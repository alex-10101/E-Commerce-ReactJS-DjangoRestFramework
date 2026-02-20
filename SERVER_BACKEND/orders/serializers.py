from decimal import ROUND_HALF_UP, Decimal
from django.db import transaction

from products.models import Product
from authentication.serializers import UserSerializer
from .models import Order, OrderItem, ShippingAddress
from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView


class ShippingAddressSerializer(serializers.ModelSerializer):
    """
    Serializer for the ShippingAddress model. 

    The serializer is used for crating data (inserting shipping address in the database when creating an order),
    or retrieving data and sending it to the client.

    The serializer returns all fields to the client. The fields on the "read_only_fields" list can only be read, 
    they cannot be changed.

    This serializer is used in the OrderCreateSerializer serializer, which inserts nested JSON data
    consisting of order data, order items, shipping address and payment method in the database.    
    """

    class Meta:
        model = ShippingAddress
        fields = "__all__"
        read_only_fields = ["id", "order", "createdAt", "updatedAt"]

class OrderItemSerializer(serializers.ModelSerializer):
    """
    Serializer used for retrieving OrderItems from the database, and sending the data to the client.

    This serializer is used inside the OrderSerializer, which sends to the client a nested JSON consisting of
    order items, shipping address and user data.
    """

    class Meta:
        model = OrderItem
        fields = "__all__"      

class CartItemSerializer(serializers.Serializer):
    """
    Serializer used for inserting the items in the order (the items in the cart) in the database.

    The fields this serializer expects are the id of the product in the cart and its quantity.

    This serializer is used in the OrderCreateSerializer serializer, which inserts nested JSON data
    consisting of order items, shipping address and payment method in the database.    
    """

    id = serializers.IntegerField(min_value=1)
    qty = serializers.IntegerField(min_value=1)  

class OrderCreateSerializer(serializers.Serializer):
    """
    Serializer, which inserts nested JSON data
    consisting of order items, shipping address and payment method in the database.

    Payload / Data coming from the client (frontend):
        {
            orderItems: CartItem[];
            shippingAddress: ShippingAddress;
            paymentMethod: string;
        }

    This serializer:
        - Validates the entire payload (including nested parts)
        - Provides custom validation errors
        - Creates:
            1) Order
            2) ShippingAddress (OneToOne with Order)
            3) OrderItem rows (FK to Order, FK to Product)
        - Updates Product.countInStock accordingly
        - Ensures atomicity: either everything is created or nothing is created

    Note:
        - Client does not send any price fields; server computes and persists them.
    
    Not used for:
        - Returning the response. For that we use OrderSerializer (read serializer).
    """

    orderItems = CartItemSerializer(many=True)
    shippingAddress = ShippingAddressSerializer()
    paymentMethod = serializers.CharField()

    # Server-side pricing constants / rules
    TAX_RATE = Decimal("0.082")      
    FREE_SHIPPING_THRESHOLD = Decimal("100.00")
    SHIPPING_FEE = Decimal("10.00")
    
    def validate_orderItems(self, items):
        """
        Ensure at least one order item exists.
        """        
        if not items:
            raise serializers.ValidationError({"detail": "No order items."})
        return items

    @staticmethod
    def __money(value: Decimal) -> Decimal:
        """
        Private method to round/quantize a Decimal money value to 2 decimal places.
        """
        return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    # https://www.reddit.com/r/django/comments/ypw0mg/can_somebody_explain_when_to_use_transaction/
    # Atomic transactions are about ensuring data consistency in your database.
    # So say you had 2 models, and a view that populated a record in both
    #       Model1.objects.create(...)
    #       Model2.objects.create(...)
    # Say Model1 finished saving, then your application crashed. 
    # If the fact that the Model2 record is missing will lead to inconsistent/wrong results in your db,
    # then you want to save both records in 1 transaction:
    # with transaction.atomic():
    #       Model1.objects.create(...)
    #       Model2.objects.create(...)
    # With this, you are guaranteed to have either both, or no records saved. 
    @transaction.atomic
    def create(self, validated_data):
        """
        Create Order + ShippingAddress + OrderItems and update stock atomically.

        Uses select_for_update() to lock Product rows while checking and decrementing stock.
        """

        request = self.context["request"]
        user = request.user

        items_data = validated_data.pop("orderItems")
        shipping_data = validated_data.pop("shippingAddress")

        # 1) Validate stock and compute subtotal using DB prices
        items_subtotal = Decimal("0.00")
        resolved_products = []  # list of (product, qty) tuples

        for item in items_data:
            product_id = item["id"]
            qty = item["qty"]
            
            try:
                # Lock product row to avoid race conditions on stock
                # Django Docs: `select_for_update()` returns a queryset that will lock rows until the end of the transaction.
                # Inside a transaction:
                # - The database locks that row
                # - Other transactions trying to read the same row with select_for_update():
                #       * wait until the first one finishes
                # - The lock is released only when the transaction commits or rolls back
                product = Product.objects.select_for_update().get(id=product_id)
            except Product.DoesNotExist:
                raise serializers.ValidationError({
                    "detail": f"Product {product_id} does not exist."
                })

            if product.countInStock < qty:
                raise serializers.ValidationError({
                    "detail": f"Not enough stock for '{product.name}'."
                })

            items_subtotal += Decimal(str(product.price)) * Decimal(qty)
            resolved_products.append((product, qty))

        items_subtotal = self.__money(items_subtotal)

        # 2) Compute shipping and tax server-side
        # shipping_price = self.SHIPPING_FEE
        # if items_subtotal >= self.FREE_SHIPPING_THRESHOLD:
        #     shipping_price = Decimal("0.00")
        shipping_price = (
            Decimal("0.00")
            if items_subtotal >= self.FREE_SHIPPING_THRESHOLD
            else self.SHIPPING_FEE
        )
        tax_price = self.__money(items_subtotal * self.TAX_RATE)
        total_price = self.__money(items_subtotal + shipping_price + tax_price)

        # 3) Create Order (prices computed server-side)
        order = Order.objects.create(
            user=user,
            paymentMethod=validated_data["paymentMethod"],
            taxPrice=tax_price,
            shippingPrice=shipping_price,
            totalPrice=total_price,
        )

        # 4) Create ShippingAddress
        ShippingAddress.objects.create(
            order=order,
            address=shipping_data["address"],
            city=shipping_data["city"],
            postalCode=shipping_data["postalCode"],
            country=shipping_data["country"],
        )

        # 5) Create OrderItems and update stock (DB price)
        for product, qty in resolved_products:
            OrderItem.objects.create(
                product=product,
                order=order,
                name=product.name,
                qty=qty,
                price=product.price,
                image=request.build_absolute_uri(product.cover_img.url) if product.cover_img.url else ""
            )

            # 6) Update the count in stock, and save the changes made to the product
            product.countInStock -= qty
            product.save(update_fields=["countInStock"])

        return order
    

class OrderSerializer(serializers.ModelSerializer):
    """
    Serializer which sends to the client a nested JSON consisting of
    order data, order items, shipping address and user data

    This serializer:
        - Serializes an existing Order into a JSON response
        - Includes in the response:
            * order data
            * order items
            * shipping address
            * user information

    This serializer is NOT used for creation. It receives a real Order instance, not request data

    About `obj` in get_* methods:
        - `obj` is the Order instance currently being serialized
        - It represents one database row
    """

    # declare a read-only serializer field whose value is computed by a method `get_fieldName()`
    # (in this case: get_order()) instead of coming directly from the model.
    orderItems = serializers.SerializerMethodField(read_only=True)
    
    # declare a read-only serializer field whose value is computed by a method `get_fieldName()`
    # (in this case: get_shippingAddress()) instead of coming directly from the model.
    shippingAddress = serializers.SerializerMethodField(read_only=True)
    
    # declare a read-only serializer field whose value is computed by a method `get_fieldName()`
    # (in this case: get_user()) instead of coming directly from the model.   
    user = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Order
        fields = "__all__"

    def get_orderItems(self, obj):
        """
        Return all OrderItem rows belonging to this Order.

        Args:
            obj (Order): The Order instance being serialized

        Returns:
            list[dict]: Serialized OrderItem objects
        """

        # items = obj.orderitem_set.all()
        items = OrderItem.objects.filter(order = obj)
        serializer = OrderItemSerializer(items, many=True)
        return serializer.data

    def get_shippingAddress(self, obj):
        """
        Return the ShippingAddress associated with this Order.

        Args:
            obj (Order): The Order instance being serialized

        Returns:
            dict: Serialized ShippingAddress if it exists
        """

        # Default reverse accessor for OneToOneField
        address = obj.shippingaddress
        serializer = ShippingAddressSerializer(address, many=False)
        return serializer.data

    def get_user(self, obj):
        """
        Return serialized user data for the Order owner.

        Args:
            obj (Order): The Order instance being serialized

        Returns:
            dict: Serialized user data
        """
        
        serializer = UserSerializer(obj.user, many=False)
        return serializer.data

from decimal import Decimal
from django.db import models
from django.contrib.auth import get_user_model
from products.models import Product
from django.core.validators import MinValueValidator

User = get_user_model()

# Create your models here.

class Order(models.Model):
    """
    Represents a customer's order, containing the overall payment information,
    pricing details, and status. An Order typically consists of multiple
    OrderItems and is associated with a single ShippingAddress.
    This model acts like a finalized purchase record, not just a shopping cart.
    """

    user = models.ForeignKey(User, on_delete=models.CASCADE, null=False)
    paymentMethod = models.CharField(max_length=200, null=True, blank=True)
    taxPrice = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0, message="Price cannot be negative.")])
    shippingPrice = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0, message="Price cannot be negative.")])
    totalPrice = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0, message="Price cannot be negative.")])
    isPaid = models.BooleanField(default=False)
    isDelivered = models.BooleanField(default=False)
    paidAt = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    delveredAt = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    def __str__(self):
        """
        Show the time the order was created  when querying the database in shell or when using Django Admin instead of showing an
        unhelpful "<Order object>" label.
        """
        return str(self.createdAt)

class OrderItem(models.Model):
    """
    A single item within an Order. An OrderItem represents a specific product
    that a customer is purchasing, along with the quantity and the price at
    the time of the order.

    The difference between Products and Order Items: 
        - Products are general catalog items.
        - OrderItems are purchased instances of those products.

    Why One-To-Many relationship between OrderItem and Product:
        - because the same product can appear be purchesed multiple times by different customers. Example:

            product_id          orderitem_id
            -----------         -------------
            Laptop       <--    OrderItem #1 (Order #1, qty=1)
            Laptop       <--    OrderItem #2 (Order #5, qty=2)
            Laptop       <--    OrderItem #3 (Order #12, qty=1)

        - In the example above:
            * one customer bought one laptop model one time
            * another customer bought the same laptop model two times
            * another customer bought the same laptop model one times

    Why One-To-Many relationship between OrderItem and Order:
        - because an order can consists of multiple bought products. 
        - For example a user can buy not only a laptop, but also headphones, phones etc. 
    """
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, null=False)
    name = models.CharField(max_length=200, null=True, blank=True)
    qty = models.PositiveIntegerField(null=True, blank=True, default=0)

    # price of an order item can sometimes differ the price of the product. 
    # For example, discounts are applied to the price of the order item, not to the price of the product.
    price =  models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0, message="Price cannot be negative.")])
    
    image = models.CharField(max_length=200, null=True, blank=True)
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    def __str__(self):
        """
        Show the time the name of the purchased product when querying the database in shell or when using Django Admin instead of showing an
        unhelpful "<OrderItem object>" label.
        """
        return str(self.name)
    
class ShippingAddress(models.Model):
    """
    The shipping address associated with a specific Order. This includes the
    destination details needed for physical delivery of purchased items.
    Each Order has exactly one ShippingAddress.

    Why the One-To-One relationship with ShippingAddress is defined in the ShippingAddress model and not in the Order model:
    - because Order is the parent table and ShippingAddress is a Child table.
    - the foreign key is writen in the child table (in ShippingAddress).
    - thus, the parent table (Order) remains independent and does not require the
      existence of a ShippingAddress at creation time.
    """

    order = models.OneToOneField(Order, on_delete=models.CASCADE, null=True, blank=True)
    address = models.CharField(max_length=200, null=True, blank=True)
    city = models.CharField(max_length=200, null=True, blank=True)
    postalCode = models.CharField(max_length=200, null=True, blank=True)
    country = models.CharField(max_length=200, null=True, blank=True)
    # shipingPrice = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0.0)])
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    def __str__(self):
        """
        Show the time the address  when querying the database in shell or when using Django Admin instead of showing an
        unhelpful "<ShippingAddress object>" label.
        """
        return str(self.address)

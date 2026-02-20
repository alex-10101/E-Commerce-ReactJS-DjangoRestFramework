from decimal import Decimal
from utils.frontendURL import FRONTEND_URL
from products.models import Product
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework import permissions
from .serializers import OrderCreateSerializer, OrderSerializer
from .models import Order, OrderItem, ShippingAddress
from django.db.models import Q
from datetime import datetime, timezone
import stripe
from django.shortcuts import redirect
from dotenv import load_dotenv, find_dotenv
import os

# get the stripe secret key from environment variables
load_dotenv(find_dotenv())
stripe.api_key = os.environ['STRIPE_SECRET_KEY']


# Create your views here.

class OrderListCreateApiView(APIView):
    """
    Class Based View for retrieving multiple orders and for creating an order.
    """

    permission_classes=[permissions.IsAuthenticated]
    
    def get(self, request):
        """
        Get all orders.
        """
        if request.user.is_staff:
            orders = Order.objects.all()
        else:
            orders = Order.objects.filter(user = request.user)
        # orders = request.user.order_set.all()
       
        # many=True indicates that multiple Product instances to the client.
        serializer = OrderSerializer(orders, many=True, context={"request": request})
        
        return Response(serializer.data, status=status.HTTP_200_OK)
      
    def post(self, request):
        """
        Insert a new order in the database and return it.

        Returns:
            201: The created order (serialized by OrderSerializer)
            400: Validation errors (custom messages from OrderCreateSerializer)
        """
        create_serializer = OrderCreateSerializer(
            data=request.data,
            context={"request": request}
        )

        if not create_serializer.is_valid():
            return Response(
                {"detail": create_serializer.errors}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        order = create_serializer.save(user=request.user)

        # Return the newly created order using your existing read serializer
        read_order_serializer = OrderSerializer(order, many=False)
        return Response(read_order_serializer.data, status=status.HTTP_201_CREATED)

class OrderDetailApiView(APIView):
    """
    View for retrieving, updating or deleting a single order.
    """

    permission_classes=[permissions.IsAuthenticated]

    def __get_order(self, order_id, user):
        """
        Private method to get the order with the given id from the database.

        If the user is an admin, get the order only by its id.
        Else, get the order by its id, and by the user id.
        """

        if user.is_staff:
            try:
                return Order.objects.get(id=order_id)
            except Order.DoesNotExist:
                return None
            
        try:
            return Order.objects.get(id=order_id, user_id=user.id)
        except Order.DoesNotExist:
            return None
 
        
    def get(self, request, id):
        """
        Get the order with the given id when the user makes a GET request to this endpoint.
        """

        order = self.__get_order(order_id=id, user=request.user)

        if order is None:
            return Response(
                {"detail": "The order with the given id does not exist."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = OrderSerializer(order, context={"request": request})
        
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def put(self, request, id):
        """
        Update the order to paid, when the admin makes a PUT request to this endpoint.
        """
        if not request.user.is_staff:
            return Response(
                {"detail": "Not Authorized."},
                status=status.HTTP_401_UNAUTHORIZED
            )
 
        order = self.__get_order(order_id=id, user = request.user)
        order.isPaid = True
        order.paidAt = datetime.now()
        order.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
class OrderDeliverApiView(APIView):
    """
    View for marking an order as delivered.
    """

    permission_classes=[permissions.IsAuthenticated, permissions.IsAdminUser]

    def __get_order(self, order_id):
        """
        Private method to get the order with the given id from the database.

        If the user is an admin, get the order only by its id.
        Else, get the order by its id, and by the user id.
        """

        try:
            return Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return None
                
    def put(self, request, id):
        """
        Update the order to paid, when the admin makes a PUT request to this endpoint.
        """
        order = self.__get_order(order_id=id)

        if order is None:
            return Response(
                {"detail": "The order with the given id does not exist."},
                status=status.HTTP_404_NOT_FOUND
            )

        if not order.isPaid:
            return Response(
                {"detail": "Cannot mark order as delivered if it is not payed."},
                status=status.HTTP_400_BAD_REQUEST
            )

        order.isDelivered = True
        order.delveredAt = datetime.now()
        order.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

class StripeCreateCheckoutSessionView(APIView):
    """
    View to process payments using Stripe.
    Testing with stripe: https://docs.stripe.com/checkout/quickstart#testing 
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id):
        CURRENCY = "ron"

        try:
            # Get order from the database
            try:
                order = Order.objects.get(id=id, user=request.user)
            except Order.DoesNotExist:
                return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

            if order.isPaid:
                return Response({"detail": "Order already paid."}, status=status.HTTP_400_BAD_REQUEST)

            # Build line_items from DB (prices + qty from DB)
            line_items = []
            for item in order.orderitem_set.all():  # adjust related_name if needed
                line_items.append(
                    {
                        "price_data": {
                            "currency": CURRENCY,  
                            "product_data": {
                                "name": item.name,
                            },
                            # unit_amount is the price of ONE unit of an item, expressed in cents: unit_amount = price of 1 item × 100
                            "unit_amount": int((Decimal(item.price) * 100).quantize(Decimal("1"))),
                        },
                        "quantity": int(item.qty),
                    }
                )

            # Add shipping + tax as separate line items 
            if order.shippingPrice and Decimal(order.shippingPrice) > 0:
                line_items.append({
                    "price_data": {
                        "currency": CURRENCY,
                        "product_data": {
                            "name": "Shipping"
                        },
                        "unit_amount": int((Decimal(order.shippingPrice) * 100).quantize(Decimal("1"))),
                    },
                    "quantity": 1,
                })

            if order.taxPrice and Decimal(order.taxPrice) > 0:
                line_items.append({
                    "price_data": {
                        "currency": CURRENCY,
                        "product_data": {
                            "name": "Tax"
                        },
                        "unit_amount": int((Decimal(order.taxPrice) * 100).quantize(Decimal("1"))),
                    },
                    "quantity": 1,
                })

            # Create Checkout Session
            checkout_session = stripe.checkout.Session.create(
                mode="payment",
                payment_method_types=["card"],
                line_items=line_items,
                metadata={"order_id": str(order.id), "user_id": str(order.user_id)},
                # {CHCKOUT_SEESSION_ID} is generated by stripe
                success_url=f"{FRONTEND_URL}/order/{order.id}?success=1&session_id={{CHECKOUT_SESSION_ID}}", 
                cancel_url=f"{FRONTEND_URL}/order/{order.id}?canceled=1",
            )

            # Redirect to the payment/checkout page hosted by stripe
            # return redirect(checkout_session.url, code=303)

            # Return the url to the payment/checkout page hosted by stripe
            return Response({"url": checkout_session.url}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"detail": "Could not process payment."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    
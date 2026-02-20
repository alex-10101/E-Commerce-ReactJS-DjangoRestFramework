from django.urls import path
from .views import OrderListCreateApiView, OrderDetailApiView, OrderDeliverApiView, StripeCreateCheckoutSessionView


urlpatterns = [
    path("", OrderListCreateApiView.as_view(), name="orders-list-add"),
    path("<int:id>/", OrderDetailApiView.as_view(), name="orders_detail"),
    path("<int:id>/deliver/", OrderDeliverApiView.as_view(), name="order_deliver"),
    path("<int:id>/stripe/create-checkout-session/", StripeCreateCheckoutSessionView.as_view(), name="stripe_create_checkout")
]
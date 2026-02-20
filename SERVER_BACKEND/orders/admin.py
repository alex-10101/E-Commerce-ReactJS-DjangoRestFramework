from django.contrib import admin
from .models import Order, OrderItem, ShippingAddress

# Register your models here.

# make the  models accessible from the Django Admin interface.
admin.site.register(Order)
admin.site.register(OrderItem)
admin.site.register(ShippingAddress)
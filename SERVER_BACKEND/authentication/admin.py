from django.contrib import admin
from django.contrib.auth import get_user_model

# Register your models here.

# get the custom User model
User = get_user_model()

# make the model accessible from the Django Admin interface.
admin.site.register(User)
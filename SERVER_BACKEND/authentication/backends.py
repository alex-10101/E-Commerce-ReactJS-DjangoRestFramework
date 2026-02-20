from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.db.models import Q

UserModel = get_user_model()


class EmailOrUsernameBackend(ModelBackend):
    """
    Class which overrides the authenticate method in the ModelBackend class,
    which allows the users only to authenticate with username and password.
    
    This class allows the regular user to authenticate with both with username and password, 
    as well as with email and password.
    """
    def authenticate(self, request, username=None, password=None, **kwargs):
        try:
            # "username" is the credential name expected by Django's authentication system
            # (including the Django admin login form).
            # In this custom function, the value provided for "username" may be 
            # either the user's actual username or their email address.
            #
            # The query below returns the user whose username or email matches the value
            # supplied in the "username" field (case-insensitive), thus allowing authentication
            # with either username+password or email+password.            
            user = UserModel.objects.get(
                Q(email__iexact=username) | Q(username__iexact=username)
            )
        except UserModel.DoesNotExist:
            # Run the default password hasher once to reduce the timing
            # difference between an existing and a nonexistent user (#20760).
            UserModel().set_password(password)
            return
        if user.check_password(password) and self.user_can_authenticate(user):
            return user

# class EmailOrUsernameBackend(ModelBackend):
#     """
#     Class which overrides the authenticate method in the ModelBackend class,
#     which allows the users only to authenticate with username and password.
    
#     This class allows the regular user to authenticate with both with username and password, 
#     as well as withemail and password.
#     """
#     def authenticate(self, request, username=None, password=None, **kwargs):
#         try:
#             # Try to log in with username first (standard in Django).
#             user = UserModel.objects.get(username__iexact=username)
#         except UserModel.DoesNotExist:
#             try:
#                 #  If previous query didn't succeed, try to log in with email.
#                 user = UserModel.objects.get(email__iexact=username)
#             except UserModel.DoesNotExist:
#                 # Mitigate timing differences (same pattern as Django)
#                 UserModel().set_password(password)
#                 return None        
#         if user.check_password(password) and self.user_can_authenticate(user):
#             return user


from django.conf import settings
from django.urls import path, re_path

from .views import\
    ActivateAccountView, ChangeKnownPasswordView, GetAllUsersProfile, GetUserProfile, LogoutAllDevicesView,\
    RegisterWithAccountActivationView, GetCSRFCookie, LoginView, LogoutView, CheckAuthenticatedView, DeleteAccountView,\
    RequestChangeForgottenPasswordView, ConfirmChangeForgottenPasswordView, UpdateAccountView, DeleteAccountAdminView

 
urlpatterns = [
    path("csrf_cookie/", GetCSRFCookie.as_view(), name="csrf_cookie"),
    path("is_authenticated/", CheckAuthenticatedView.as_view(), name="is_authenticated"),
    # path("register", RegisterView.as_view(), name="register"),
    path("register/", RegisterWithAccountActivationView.as_view(), name="register"),
    path("activate_account/<str:uidb64>/<str:token>/", ActivateAccountView.as_view(), name="activate_account"),
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("logout_all/", LogoutAllDevicesView.as_view(), name="logout"),
    path("change_known_password/", ChangeKnownPasswordView.as_view(), name="change_known_password"),
    path("request_change_known_password/", RequestChangeForgottenPasswordView.as_view(), name="request_change_known_password"), 
    path("confirm_change_known_password/<str:uidb64>/<str:token>/", ConfirmChangeForgottenPasswordView.as_view(), name="confirm_change_known_password"),
    path("get_acount/<int:id>/", GetUserProfile.as_view(), name="get_current_account"),
    path("get_all_acounts/", GetAllUsersProfile.as_view(), name="get_all_acounts"),
    path("update_account/<int:id>/", UpdateAccountView.as_view(), name="update_account"),
    path("delete_account/", DeleteAccountView.as_view(), name="delete_account"),
    path("delete_account_admin/<int:id>/", DeleteAccountAdminView.as_view(), name="delete_account_admin"),
]
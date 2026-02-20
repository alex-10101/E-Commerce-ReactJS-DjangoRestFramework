import os
from django.contrib.auth import get_user_model
from utils.frontendURL import FRONTEND_URL
from rest_framework.views import APIView
from rest_framework import permissions
from django.contrib import auth
from rest_framework.response import Response

from .serializers import RecoverPasswordSerializer, ResetPasswordSerializer, UserSerializer, RegisterSerializer, LoginSerializer, DeleteAccountSerializer, ChangePasswordSerializer
from django.views.decorators.csrf import csrf_protect
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import status
from django.middleware.csrf import rotate_token
from django.http import HttpResponse
from django.contrib.sessions.models import Session
from django.utils import timezone

from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.core.mail import EmailMessage

from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.signing import BadSignature
# from utils.generateAccountActivationToken import account_activation_token

# from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth.tokens import PasswordResetTokenGenerator

from importlib import import_module
from django.conf import settings


User = get_user_model()

# generates a one time-token for activating accounts and for resetting passwords.
generated_token = PasswordResetTokenGenerator()

# Create your views here.

class GetCSRFCookie(APIView):
    """View to get a CSRF cookie"""
    permission_classes = (permissions.AllowAny,)

    # def get(self, request):
    #     """
    #     When the client makes a page refresh, a request should be made to this endpoint to get a new csrf cookie.
    #     """
    #     rotate_token(request)
    #     return Response(status=status.HTTP_200_OK)

    @method_decorator(ensure_csrf_cookie)
    def get(self, request):
        """
        When the client app mounts and there is no CSRF cookie, a request should be made to this endpoint to get a new csrf cookie.
        """
        return Response(status=status.HTTP_200_OK)


@method_decorator(csrf_protect, name="dispatch")
class CheckAuthenticatedView(APIView):
    """
    View to check if the current user is authenticated or not.
    When the client makes a page refresh, a request should be made to this endpoint to see if the user is authenticated.
    """

    def get(self, request):
        """Method which runs when the user submits a GET request to check if the current user is authenticated or not"""
        if bool(request.user and request.user.is_authenticated):
            user = UserSerializer(self.request.user)
            return Response({"user": user.data}, status=status.HTTP_200_OK)

        return Response(status=status.HTTP_401_UNAUTHORIZED)

class RegisterWithAccountActivationView(APIView):
    """
    API view responsible for user registration with email-based account activation.

    This view accepts a username, email, password, and password confirmation.
    Upon successful validation:

    - If no user exists with the provided email, a new inactive user is created.
    - If a user already exists with the provided email, no new user is created.
    - In both cases, an account activation email is sent.

    To prevent user enumeration attacks, the response returned to the client
    is identical regardless of whether the email already exists in the system.

    Permissions:
        - AllowAny: Registration is available to unauthenticated users.
    """

    permission_classes = (permissions.AllowAny,)

    def __send_account_activation_email(self, user):
        """
        Generate and send an account activation email for a given user.

        This method:
        - Generates a URL-safe base64 encoded user ID (uid).
        - Generates a one-time activation token using PasswordResetTokenGenerator.
        - Constructs an activation link pointing to the frontend application.
        - Renders and sends an HTML email containing the activation link.

        The token is bound to the user's current state (e.g., password hash),
        ensuring that tokens are invalidated when relevant user attributes change.

        Args:
            user (User): The user instance to whom the activation email is sent.
        """
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = generated_token.make_token(user)

        # base_url = getattr(settings, "FRONTEND_BASE_URL", "http://localhost:4173")
        # activation_link = f"{base_url}/activate/{uid}/{token}/"

        # current_site = get_current_site(request)
        # activation_link = f"{current_site}/activate/{uid}/{token}/" # if we also use Django for the frontend
        activation_link = f"{FRONTEND_URL}/activate/{uid}/{token}/"

        mail_subject = "Activate your user account."
        message = render_to_string(
            template_name="authentication/template_activate_account.html",
            context={
                "username": user.username,
                "activation_link": activation_link,
            },
        )

        email = EmailMessage(mail_subject, message, to=[user.email])
        email.content_subtype = "html"  # to render html tags in the template. Without this, the html tags will be shown as strings. 

        email.send(fail_silently=False)

    def post(self, request):
        """
        Method which creates/regusters a new user when the client makes a POST request to this endpoint.
        """
        serializer = RegisterSerializer(data=request.data)

        if serializer.is_valid():
            validated_data = serializer.validated_data
            email = validated_data["email"]
            username = validated_data["username"]
            password = validated_data["password"]

            # Retrieve existing user by email or create a new one
            user = User.objects.filter(email=email).first()
            if user is None:
                user = User.objects.create_user(
                    email=email,
                    username=username,
                    password=password,
                )

                # Make user inactive. If the user is not active, he/she cannot log in.
                # The user will be set to active after he/she activates his/her account.
                user.is_active = False
                user.save()

            self.__send_account_activation_email(user)

            # Identical response regardless of whether the user existed
            return Response(f"Please check your email to activate your account.", status=status.HTTP_201_CREATED)
        
        return Response(
            {"detail": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )


    
@method_decorator(csrf_protect, name="dispatch")
class ActivateAccountView(APIView):
    def post(self, request, uidb64, token):
        """
        First, decode the "uidb64" and get the "token" froh the activation email link.
        Then, check whether the user exists in our database with a decoded primary key.
        If the user exists, we are checking whether the token is not expired yet.
        If not, catch the User.DoesNotExist exception and return an "Account Activation Failed" error.
        """

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, BadSignature, User.DoesNotExist):
            user = None

        # if user is not None and account_activation_token.check_token(user, token):
        #     user.is_active = True
        #     user.save()
        #     return Response('Account activated successfully!', status=status.HTTP_200_OK)

        if user is not None and generated_token.check_token(user, token):
            user.is_active = True
            user.save()
            return Response('Account activated successfully!', status=status.HTTP_200_OK)


        return Response({"detail": "Account Activation Failed."}, status=status.HTTP_400_BAD_REQUEST)    


@method_decorator(csrf_protect, name="dispatch")
class LoginView(APIView):
    """View to log in a user with username and password"""

    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        """Method which runs when the user submits a POST request to log in."""
        
        context={"request": request}
        
        serializer=LoginSerializer(data=request.data, context=context)

        if serializer.is_valid():

            email=serializer.validated_data["email"]
            password=serializer.validated_data["password"]

            # authenticate with email and password (Django's default authentication is with username and password)
            user = auth.authenticate(username=email, password=password)

            # Some possible reasons for error: wrong username or password or the user is inactive.
            if user is None:
                return Response({"detail": "Could not log in."}, status=status.HTTP_400_BAD_REQUEST)

            auth.login(request, user)
            user = UserSerializer(self.request.user)
            return Response({"user": user.data}, status=status.HTTP_200_OK)

        return Response({"detail": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    """View to log a user out."""
    permission_classes=[permissions.IsAuthenticated]

    def post(self, request):
        """Method which runs when the user submits a POST request to log out."""
        auth.logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class LogoutAllDevicesView(APIView):
    """View to log a user out of all devices."""
    permission_classes=[permissions.IsAuthenticated]

    def post(self, request):
        """Method which runs when the user submits a POST request to log out."""

        # Get all active sessions
        sessions = Session.objects.filter(expire_date__gte=timezone.now())

        # Loop through sessions and delete those for the current user
        for session in sessions:

            SessionStore = import_module(settings.SESSION_ENGINE).SessionStore
            s = SessionStore(session_key=session.session_key)

            session_data = session.get_decoded()

            if session_data.get('_auth_user_id') == str(request.user.id):
                # this deletes from the cache
                s.delete()
                # this deletes from the database (but not also from the cache)
                session.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)


class ChangeKnownPasswordView(APIView):
    permission_classes=[permissions.IsAuthenticated]

    def put(self, request):
        """Change the password of the current user (the user making the request)"""

        context={'request': request}

        serializer=ChangePasswordSerializer(data=request.data, context=context)

        if serializer.is_valid():
            user=request.user
            user.set_password(serializer.data["newPassword"])
            user.save()

            return Response(status=status.HTTP_204_NO_CONTENT)

        return Response({"detail": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_protect, name="dispatch")
class RequestChangeForgottenPasswordView(APIView):

    def __send_recover_password_email(self, user):
        """
        Private method, which, for an existing user, generates uid and a token and create the activation link using these values. 
        Then an email is sent to the user with this activation link.
        """

        # if there is no user, send en empty email to reduce timing difference between users with email and users without email
        if user == None:
            email = EmailMessage(subject="...", body="...", to=["non-existing-email@gmail.com"])
            email.content_subtype = "html" # to render html tags in the template. Without this, the html tags will be shown as strings. 
            email.send()
            return

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        # token = account_activation_token.make_token(user)
        token = generated_token.make_token(user)

        # current_site = get_current_site(request)
        # activation_link = f"{current_site}/confirmChangeForgottenPassword/{uid}/{token}/" # if we also use Django for the frontend
        activation_link = f"{FRONTEND_URL}/confirmChangeForgottenPassword/{uid}/{token}/"

        mail_subject = 'Password Reset request.'
        message = render_to_string(template_name="authentication/template_recover_password.html", context={
            'username': user.username,
            'activation_link': activation_link,
        })

        email = EmailMessage(mail_subject, message, to=[user.email])
        email.content_subtype = "html" # to render html tags in the template. Without this, the html tags will be shown as strings. 

        email.send()


    def post(self, request):
        serializer = RecoverPasswordSerializer(data=request.data)

        if serializer.is_valid():
            email=serializer.validated_data["email"]

            associated_user = None
            try:
                associated_user = User.objects.get(email=email)
            except User.DoesNotExist:
                pass
            self.__send_recover_password_email(user=associated_user)

            return Response(f"Please check your email to recover your password.", status=status.HTTP_200_OK)

        return Response({"detail": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_protect, name="dispatch")
class ConfirmChangeForgottenPasswordView(APIView):

    def put(self, request, uidb64, token):
        """
        First, extract the data passed with the request and pass them to the serializer.
        Then, decode the "uidb64" and "token" given in an reset password email link.
        Then, check whether the user exists in our database with a decoded primary key.
        If the user exists, we are checking whether the token is not expired yet.
        If not, we set the user as active and redirect it back to the login page.
        """

        context={'request': request}

        serializer=ResetPasswordSerializer(data=request.data, context=context)

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, BadSignature, User.DoesNotExist):
            user = None

        if user is not None and generated_token.check_token(user, token):

            if serializer.is_valid():
                user.set_password(serializer.validated_data["newPassword"])
                user.save()
                return Response('Password reset was successful!', status=status.HTTP_200_OK)
            
            return Response({"detail": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"detail": "Password reset failed."}, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_protect, name="dispatch")
class GetUserProfile(APIView):
    """
    View to return the request user's profile.
    """

    permissions = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def get(self, request, id):
        """Method which runs when the user submits a GET request to retrieve his/her profile."""
        try:    
            user_db = User.objects.get(id=id)
        except User.DoesNotExist:
            user_db = None

        if not user_db:
            return Response(
                {"detail": "The user with the given id does not exist."}, 
                status=status.HTTP_404_NOT_FOUND)
        
        user = UserSerializer(user_db)
        return Response(user.data, status=status.HTTP_200_OK)

class GetAllUsersProfile(APIView):
    """
    View to return the profile of all users.
    """

    permission_classes=[permissions.IsAuthenticated, permissions.IsAdminUser]
    
    def get(self, request):
        """Method which runs when the user (admin) submits a GET request to retrieve all profiles."""
        users_db = User.objects.all()
        users = UserSerializer(users_db, many=True)
        return Response(users.data, status=status.HTTP_200_OK)


class UpdateAccountView(APIView):
    """
    Class based view to update the profile of a user.
    """

    permission_classes=[permissions.IsAuthenticated, permissions.IsAdminUser]

    def put(self, request, id):
        """
        Mehtod which updates the profile of the current user (the user making the request), 
        when the user makes a PUT request to this endpoint.
        """

        try:
            user = User.objects.get(id=id)
        except User.DoesNotExist:
            user = None

        if user is None:
            return Response(
                {"detail": "The user with the given id does not exist."},
                status=status.HTTP_404_NOT_FOUND
            )

        is_admin_user = request.data.get("is_staff", user.is_staff)
        user.is_staff=is_admin_user
        user.is_superuser=is_admin_user

        user.save()
        
        return Response(UserSerializer(user).data, status=status.HTTP_200_OK)
        

class DeleteAccountView(APIView):
    """Class based view to delete the profile of a user."""

    permission_classes=[permissions.IsAuthenticated]

    def delete(self, request):
        """Delete the account of the current user (the user making the request)"""

        context={"request": request}

        serializer=DeleteAccountSerializer(data=request.data, context=context)

        if serializer.is_valid():
            user=request.user
            User.objects.get(id=user.id).delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        
        return Response({"detail": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

class DeleteAccountAdminView(APIView):
    """Class based view to delete the profile of a user."""

    permission_classes=[permissions.IsAuthenticated, permissions.IsAdminUser]

    def delete(self, request, id):
        """Delete the account of the user with the given id."""

        try:
            user = User.objects.get(id=id)
        except User.DoesNotExist:
            user = None

        if user is None:
            return Response(
                {"detail": "The user with the given id does not exist."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        user.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)
        

import json
import re
from tokenize import generate_tokens
from django.test import TestCase, override_settings
from django.urls import reverse
from django.core import mail
from django.contrib.auth import get_user_model
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.core.signing import BadSignature
from authentication.views import generated_token
import time

User = get_user_model()

# Run with python3 manage.py test

@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend") # use this email during testing keep the emails in memory
class RegistrationWithActivationEmailTests(TestCase):
    """
    Tests for RegisterWithAccountActivationView with activation-email sending.
    """

    def setUp(self):
        """
        Create a user which is available to all tests.
        """

        self.existing_user = User.objects.create_user(
            username="existinguser",
            email="existinguser@example.com",
            password="password123",
        )

    def __register(self, payload):
        """
        Private method which calls the register API view.
        """
        
        return self.client.post(
            reverse("register"),
            data=json.dumps(payload),
            content_type="application/json",
        )

    def test_registration_success_creates_user_and_sends_activation_email(self):
        """
        Tests a correct user registration.
        """

        # the request data
        payload = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "StrongPassword123!!",
            "confirmPassword": "StrongPassword123!!",
        }

        # call the register endpoint with the payload data
        response = self.__register(payload)

        # verify the status code
        self.assertEqual(response.status_code, 201)

        # verify the response from the server
        self.assertEqual(response.json(), "Please check your email to activate your account.")

        # verify that the user has been created after a successful registration
        self.assertTrue(User.objects.filter(email="newuser@example.com").exists())
        
        # get the created user
        user = User.objects.get(email="newuser@example.com")

        # verify the user is not active
        self.assertEqual(user.is_active, False)

        # verify that one email has been sent
        self.assertEqual(len(mail.outbox), 1)

        # outox returns a list with an EmailMessage instance for each message that would be sent.
        # --> get the sent email (the email at index 0)
        sent_email = mail.outbox[0]
        
        # verify that the mail has been sent to the email from the request data
        self.assertEqual(sent_email.to, ["newuser@example.com"])

        # verify the subject of the email
        self.assertIn("Activate your user account.", sent_email.subject)

        # get the activation link, the encoded uid (and the random token) from the sent email
        # Interpreting the regex:
        # / --> literal slash
        # ([^/]+) --> one or more characters that are NOT /
        # / --> slash separator
        # ([^/]+) --> again, characters that are NOT /
        # / --> trailing slash
        # The regex should guarantee: /activate/<uid>/<token>/
        activation_link = re.search(r"/activate/([^/]+)/([^/]+)/", sent_email.body)

        # .groups() returns a tuple with the text captured by each pair of parentheses, in order.
        # here, .groups() returns a tuple containing the user id and the token from the activation link.
        uid_activation_link, token = activation_link.groups() 
        
        # encode the uid again (assume this is a correct way to do it)
        uid = urlsafe_base64_encode(force_bytes(user.pk))

        # verify the encoded user id in the email matches the encoded user id above         
        self.assertEqual(uid_activation_link, uid)    

        # clear the list of sent emails (optional)
        # mail.outbox.clear()

        # the request data for another user
        payload_other_user = {
            "username": "otheruser",
            "email": "otheruser@example.com",
            "password": "StrongPassword123!!",
            "confirmPassword": "StrongPassword123!!",
        }

        # call the register endpoint with the request data for the other user
        response_other_user = self.__register(payload_other_user)

        # get the 2nd sent email (the email at index 1)
        sent_email_other_user = mail.outbox[1]
        
        # verify that the mail has been sent to the email from the request data
        self.assertEqual(sent_email_other_user.to, ["otheruser@example.com"])

        # verify the subject of the email
        self.assertIn("Activate your user account.", sent_email_other_user.subject)

        # get the activation link, the encoded uid (and the random token) from the sent email
        activation_link_other_user = re.search(r"/activate/([^/]+)/([^/]+)/", sent_email_other_user.body)
        uid_activation_link_other_user, token_other_user = activation_link_other_user.groups()

        # verify that the encoded user ids of the two created users are different
        self.assertNotEqual(uid_activation_link, uid_activation_link_other_user)

        # verify that the tokens of the two created users are different
        self.assertNotEqual(token, token_other_user)

    def test_registration_existing_email_does_not_create_new_user_but_sends_email(self):
        """
        Test what happens if a user already has an account, but tries to register again.
        An email should be sent to the user, but a new user should not be created.
        """

        # the request data
        payload = {
            "username": "someotherusername",
            "email": "existinguser@example.com",
            "password": "StrongPassword123!!",
            "confirmPassword": "StrongPassword123!!",
        }

        # get the number of users with the email address before calling the register endpoint
        before_count = User.objects.filter(email="existinguser@example.com").count()

        # call the register endpoint with the request data
        response = self.__register(payload)
 
        # get the number of users with the email address after calling the register endpoint
        after_count = User.objects.filter(email="existinguser@example.com").count()

        # verify the response returned by the server
        self.assertEqual(response.status_code, 201)

        # verify that the number of users with the email address does not change (so, no duplicate user is created)
        self.assertEqual(before_count, after_count)  

        # verify that one email has been sent to the email address from the request data
        self.assertEqual(len(mail.outbox), 1)
        sent = mail.outbox[0]
        self.assertEqual(sent.to, ["existinguser@example.com"])

        # Response message matches your view
        self.assertEqual(response.json(), "Please check your email to activate your account.")

    def test_registration_password_mismatch_returns_400_and_sends_no_email(self):
        """
        Test what happens if a user enters two different passwords.
        User should return a 400 bad request response, it should not send any email and it should not create any user.
        """

        payload = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "StrongPassword123!!",
            "confirmPassword": "DifferentPassword123!!",
        }

        response = self.__register(payload)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(len(mail.outbox), 0)
        self.assertFalse(User.objects.filter(email="newuser@example.com").exists())
        self.assertEqual(response.json(), {'detail': {'password': ['Passwords do not match.']}})


    def test_registration_duplicate_username_returns_400_and_sends_no_email(self):
        """
        Test what happens if a user enters a username which has already been taken.
        User should return a 400 bad request response, it should not send any email and it should not create any user.
        """

        payload = {
            "username": "existinguser",  # already taken
            "email": "brandnew@example.com",
            "password": "StrongPassword123!!",
            "confirmPassword": "StrongPassword123!!",
        }

        response = self.__register(payload)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(len(mail.outbox), 0)
        self.assertFalse(User.objects.filter(email="brandnew@example.com").exists())
        self.assertEqual(response.json(), {'detail': {'username': ['A user with that username already exists.']}})


    def test_registration_invalid_email_returns_400_and_sends_no_email(self):
        """
        Test what happens if a user enters an invalid email addess.
        User should return a 400 bad request response, it should not send any email and it should not create any user.
        """

        payload = {
            "username": "newuser",
            "email": "invalid-email-format",
            "password": "StrongPassword123!!",
            "confirmPassword": "StrongPassword123!!",
        }

        response = self.__register(payload)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(len(mail.outbox), 0)
        self.assertFalse(User.objects.filter(username="newuser").exists())
        self.assertEqual(response.json(), {'detail': {'email': ['Email is invalid.']}})


    def test_registration_missing_fields_returns_400_and_sends_no_email(self):
        """
        Test what happens if a user doesn't enter all required fields.
        User should return a 400 bad request response, it should not send any email and it should not create any user.
        """
        
        # test missing username
        payload = {
            "username": "",
            "email": "newuser@example.com",
            "password": "StrongPassword123!!",
            "confirmPassword": "StrongPassword123!!",
        }

        response = self.__register(payload)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(len(mail.outbox), 0)
        self.assertFalse(User.objects.filter(email="newuser@example.com").exists())
        self.assertEqual(response.json(), {'detail': {'username': ['Username is required.']}})

        # test missing email
        payload = {
            "username": "u1",
            "email": "",
            "password": "StrongPassword123!!",
            "confirmPassword": "StrongPassword123!!",
        }

        response = self.__register(payload)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(len(mail.outbox), 0)
        self.assertFalse(User.objects.filter(username="neu1").exists())
        self.assertEqual(response.json(), {'detail': {'email': ['Enter a valid email address.']}})

        # test missing password
        payload = {
            "username": "u1",
            "email": "newuser@example.com",
            "password": "",
            "confirmPassword": "StrongPassword123!!",
        }

        response = self.__register(payload)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(len(mail.outbox), 0)
        self.assertFalse(User.objects.filter(email="newuser@example.com").exists())
        self.assertEqual(response.json(), {'detail': {'password': ['Password is required.']}})

        # test missing password confirmation
        payload = {
            "username": "u1",
            "email": "newuser@example.com",
            "password": "StrongPassword123!!",
            "confirmPassword": "",
        }

        response = self.__register(payload)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(len(mail.outbox), 0)
        self.assertFalse(User.objects.filter(email="newuser@example.com").exists())
        self.assertEqual(response.json(), {'detail': {'confirmPassword': ['Password confirmation is required.']}})


    def test_registration_weak_password_returns_400_and_sends_no_email(self):
        """
        Test what happens if a user enters a weak password.
        User should return a 400 bad request response, it should not send any email and it should not create any user.
        """

        payload = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "weak",
            "confirmPassword": "weak",
        }

        response = self.__register(payload)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(len(mail.outbox), 0)
        self.assertFalse(User.objects.filter(email="newuser@example.com").exists())
        self.assertEqual(response.json(), {'detail': {'password': ['This password is too short. It must contain at least 8 characters.']}})


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class ActivateAccountViewTests(TestCase):
    """
    Unit tests for ActivateAccountView exactly as provided.
    """

    def setUp(self):
        """
        Create a user, an encoded user id and a token to activate the account.
        Make these available to all tests.
        """
        
        self.user = User.objects.create_user(
            username="inactiveuser",
            email="inactive@example.com",
            password="StrongPassword123!!",
        )
        self.user.is_active = False
        self.user.save()

        self.uidb64 = urlsafe_base64_encode(force_bytes(self.user.pk))
        self.valid_token = generated_token.make_token(self.user)

    def __activate_account(self, uidb64, token):
        """
        Private method which calls the activate_account endpoint.
        """

        return reverse("activate_account", kwargs={"uidb64": uidb64, "token": token})


    def test_activate_success_valid_uid_and_token(self):
        """
        Test what happens during a normal account activation.
        The server should return a 200 status code and the user should become active.
        """

        response = self.client.post(self.__activate_account(self.uidb64, self.valid_token))
        self.assertEqual(response.status_code, 200)

        # self.user.refresh_from_db()
        self.user = User.objects.get(pk=self.user.pk)
        self.assertTrue(self.user.is_active)

        self.assertEqual(response.json(), "Account activated successfully!")

    def test_activate_invalid_token_returns_400(self):
        """
        Test what happens if a user sends a valid encoded user id, but an invalid token.
        The server should return a 400 status code and the user should not become active.
        """

        response = self.client.post(self.__activate_account(self.uidb64, "invalid-token"))
        self.assertEqual(response.status_code, 400)

        # self.user.refresh_from_db()
        self.user = User.objects.get(pk=self.user.pk)
        self.assertFalse(self.user.is_active)

        self.assertEqual(response.json(), {"detail": "Account Activation Failed."})

    def test_activate_invalid_uidb64_returns_400(self):
        """
        Test what happens if a user sends an invalid encoded user id, which cannot be decoded.
        The server should return a 400 status code and the user should not become active.
        """

        response = self.client.post(self.__activate_account("not-base64", self.valid_token))
        self.assertEqual(response.status_code, 400)

        # self.user.refresh_from_db()
        self.user = User.objects.get(pk=self.user.pk)
        self.assertFalse(self.user.is_active)

        self.assertEqual(response.json(), {"detail": "Account Activation Failed."})

    def test_activate_uidb64_for_nonexistent_user_raises_DoesNotExist(self):
        """
        Test what happens if a user sends an encoded user id, but the user id is not in the database.
        The server should return a 400 status code and the user should not become active.
        """

        missing_uidb64 = urlsafe_base64_encode(force_bytes(-1))

        response = self.client.post(self.__activate_account(missing_uidb64, self.valid_token))
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {"detail": "Account Activation Failed."})

    def test_activate_token_for_other_user_fails_with_400(self):
        """
        Test what happens if a new user tries to activate his/her account with another user's token.
        The server should return a 400 status code and the new user should not become active.
        """

        # create the other user and make it inactive
        other_user = User.objects.create_user(
            username="otheruser",
            email="other@example.com",
            password="StrongPassword123!!",
        )
        other_user.is_active = False
        other_user.save()

        # encode the user id of the other user
        other_uidb64 = urlsafe_base64_encode(force_bytes(other_user.pk))

        # try to call the activate_account endpoint with someone else's token
        response = self.client.post(self.__activate_account(other_uidb64, self.valid_token))

        self.assertEqual(response.status_code, 400)

        # other_user.refresh_from_db()
        other_user = User.objects.get(pk=self.user.pk)

        self.assertFalse(other_user.is_active)

        self.assertEqual(response.json(), {"detail": "Account Activation Failed."})


class SessionAuthTests(TestCase):
    """
    Unit Tests to check the authentication and logout views. 
    """

    def setUp(self):
        # Create a test user
        self.username = 'testuser'
        self.email = 'testemail@gmail.com'
        self.password = 'testpassword123'
        self.user = User.objects.create_user(username=self.username, email=self.email, password=self.password)


    def test_login_success(self):
        """
        Test that a user can log in successfully with valid credentials
        """

        login_data = {
            'email': "testemail@gmail.com",
            'password': "testpassword123"
        }
        response = self.client.post(
            reverse('login'), 
            data=json.dumps(login_data), 
            content_type='application/json')

        # Ensure login was successful 
        self.assertEqual(response.status_code, 200)
        # Ensure the user is authenticated
        self.assertTrue(response.wsgi_request.user.is_authenticated)


    def test_login_failure(self):
        """
        Test that a user cannot log in with invalid credentials
        """

        login_data = {
            'email': "testemail@gmail.com",
            'password': 'wrongpassword'
        }
        response = self.client.post(
            reverse('login'), 
            data=json.dumps(login_data), 
            content_type='application/json')

        # Ensure login failed
        self.assertEqual(response.status_code, 400)
        # Ensure the user is not authenticated
        self.assertFalse(response.wsgi_request.user.is_authenticated)


    def test_session_exists_after_login(self):
        """
        Test that session data is set after login
        """

        login_data = {
            'email': "testemail@gmail.com",
            'password': "testpassword123"
        }
        response = self.client.post(
            reverse('login'), 
            data=json.dumps(login_data), 
            content_type='application/json')

        self.assertEqual(response.status_code, 200)
        # Check that session key is set (logged-in session)
        session = self.client.session
        self.assertIn('_auth_user_id', session)
        # Ensure the session user is correct
        self.assertEqual(int(session['_auth_user_id']), self.user.pk)


    def test_logout_clears_session(self):
        """
        Test that logging out clears the session
        """

        # First, log in the user
        login_data = {
            'email': "testemail@gmail.com",
            'password': "testpassword123"
        }
        response = self.client.post(
            reverse('login'), 
            data=json.dumps(login_data), 
            content_type='application/json')

        self.assertEqual(response.status_code, 200)
        # Now, log the user out
        response = self.client.post(reverse('logout'))
        # Ensure logout was successful 
        self.assertEqual(response.status_code, 204)
        # Check that session is cleared
        session = self.client.session
        self.assertNotIn('_auth_user_id', session)


    def test_session_expiry(self):
        """
        Test that a session expires after a set time (for example, 0 to force expiry)
        """
        # Login user
        login_data = {
            'email': "testemail@gmail.com",
            'password': "testpassword123"
        }
        response = self.client.post(
            reverse('login'), 
            data=json.dumps(login_data), 
            content_type='application/json')
        
        self.assertEqual(response.status_code, 200)

        # Force session to expire the session in 1 second
        session = self.client.session
        session.set_expiry(1)  
        session.save()

        # Wait for 2 seconds to ensure the session has expired
        time.sleep(2)  

        # Try to call which requires authentication after forcing session expiry
        response_after_logout = self.client.put(
            reverse("update_account", args=[response.data["user"]["id"]]),
            data=json.dumps({"is_admin": False}),
            content_type="application/json")
    
        
        # Check if user was logged out due to session expiry
        self.assertEqual(response_after_logout.status_code, 403)  
        self.assertNotIn('_auth_user_id', self.client.session)


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class RequestChangeForgottenPasswordViewTests(TestCase):
    """
    Unit tests for RequestChangeForgottenPasswordView.
    """

    def setUp(self):
        """
        Create a user and make it available to all tests.
        """

        # mail.outbox.clear()
        self.user = User.objects.create_user(
            username="existinguser",
            email="existinguser@example.com",
            password="StrongPassword123!!",
        )

    def __request_change_forgotten_password(self, payload):
        """
        Helper to call the password recovery request endpoint.
        """
        return self.client.post(
            reverse("request_change_known_password"),
            data=json.dumps(payload),
            content_type="application/json",
        )

    def test_existing_email_sends_recover_email(self):
        """
        If the email exists, a password recovery email is sent to that address,
        and the activation link contains the user's uid and a token.
        """
        response = self.__request_change_forgotten_password({"email": "existinguser@example.com"})

        self.assertEqual(response.status_code, 200)
        # Response contains the provided email (your current behavior)
        # self.assertIn("existinguser@example.com", response.content.decode())

        # One email should be sent
        self.assertEqual(len(mail.outbox), 1)
        sent = mail.outbox[0]

        # Email goes to the real user
        self.assertEqual(sent.to, ["existinguser@example.com"])
        self.assertIn("Password Reset request.", sent.subject)

        # Activation link should contain uid and token
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))

        # Check the path is present
        self.assertIn(f"/confirmChangeForgottenPassword/{uid}/", sent.body)

        # Extract uid and token from the link in the email body
        match = re.search(r"/confirmChangeForgottenPassword/([^/]+)/([^/]+)/", sent.body)
        self.assertIsNotNone(match, sent.body)
        uid_from_email, token_from_email = match.groups()

        self.assertEqual(uid_from_email, uid)
        self.assertTrue(token_from_email)

    def test_nonexistent_email_still_sends_dummy_email_and_returns_200(self):
        """
        If the email does not exist, the view still sends a dummy email
        (timing mitigation) and returns 200.
        """

        response = self.__request_change_forgotten_password({"email": "noone@example.com"})

        self.assertEqual(response.status_code, 200)
        # self.assertIn("noone@example.com", response.content.decode())

        # Dummy email is still sent
        self.assertEqual(len(mail.outbox), 1)
        sent_email = mail.outbox[0]

        # Your dummy recipient
        self.assertEqual(sent_email.to, ["non-existing-email@gmail.com"])

    def test_missing_email_field_returns_400(self):
        """
        Missing email key causes KeyError in your view before serializer runs.
        This test documents current behavior.
        """

        with self.assertRaises(KeyError):
            self.__request_change_forgotten_password({})
            
    def test_invalid_email_format_returns_400(self):
        """
        Invalid email format should fail serializer validation and return 400.
        (Assumes your User.email field is an EmailField or serializer validates it.)
        """

        response = self.__request_change_forgotten_password({"email": "invalid-email-format"})

        self.assertEqual(response.status_code, 400)
        self.assertIn("detail", response.json())
        self.assertEqual(len(mail.outbox), 0)



class ConfirmChangeForgottenPasswordViewTests(TestCase):
    """
    Unit tests for ConfirmChangeForgottenPasswordView.
    """

    def setUp(self):
        """
        Create a user and make it available to all tests. 
        Also encode the id of the user and generate a valid token.
        """

        self.user = User.objects.create_user(
            username="user1",
            email="user1@example.com",
            password="OldStrongPassword123!!",
        )

        self.uidb64 = urlsafe_base64_encode(force_bytes(self.user.pk))
        self.valid_token = generated_token.make_token(self.user)

    def __confirm_reset(self, uidb64, token, payload):
        """
        Helper that calls the confirm password reset endpoint (PUT).
        """

        url = reverse(
            "confirm_change_known_password",
            kwargs={"uidb64": uidb64, "token": token},
        )

        return self.client.put(
            url,
            data=json.dumps(payload),
            content_type="application/json",
        )

    def test_password_reset_success(self):
        """
        Test what happens in a normal password reset.
        The server should return a 200 status code and the password of the user should change.
        """

        payload = {
            "newPassword": "NewStrongPassword123!!",
            "newPasswordConfirm": "NewStrongPassword123!!",
        }

        response = self.__confirm_reset(self.uidb64, self.valid_token, payload)

        self.assertEqual(response.status_code, 200)

        # Success is a JSON string (quoted in raw body), so resp.json() returns a Python string.
        self.assertEqual(response.json(), "Password reset was successful!")

        # Verify password changed in DB
        user = User.objects.get(pk=self.user.pk)
        self.assertTrue(user.check_password("NewStrongPassword123!!"))
        self.assertFalse(user.check_password("OldStrongPassword123!!"))


    def test_password_reset_invalid_token_returns_400(self):
        """
        Test what happens if the user sends an invalid token.
        The server should return a 400 status code and the password of the user should not change.
        """

        payload = {
            "newPassword": "NewStrongPassword123!!",
            "newPasswordConfirm": "NewStrongPassword123!!",
        }

        response = self.__confirm_reset(self.uidb64, "invalid-token", payload)

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {"detail": "Password reset failed."})

        user = User.objects.get(pk=self.user.pk)
        self.assertTrue(user.check_password("OldStrongPassword123!!"))


    def test_password_reset_invalid_uidb64_returns_400(self):
        """
        Test what happens if the user sends an invalid encoded user id.
        The server should return a 400 status code and the password of the user should not change.
        """
        payload = {
            "newPassword": "NewStrongPassword123!!",
            "newPasswordConfirm": "NewStrongPassword123!!",
        }

        response = self.__confirm_reset("not-base64", self.valid_token, payload)

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {"detail": "Password reset failed."})

        user = User.objects.get(pk=self.user.pk)
        self.assertTrue(user.check_password("OldStrongPassword123!!"))


    def test_password_reset_nonexistent_user_returns_400(self):
        """
        Test what happens if the user sends an encoded user id, but the id does not exist in the database.
        The server should return a 400 status code and the password of the user should not change.
        """

        missing_uidb64 = urlsafe_base64_encode(force_bytes(999999))
        payload = {
            "newPassword": "NewStrongPassword123!!",
            "newPasswordConfirm": "NewStrongPassword123!!",
        }

        response = self.__confirm_reset(missing_uidb64, self.valid_token, payload)

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {"detail": "Password reset failed."})


    def test_password_reset_password_mismatch_returns_400(self):
        """
        Test what happens if the user enters two different passwords.
        The server should return a 400 status code and the password of the user should not change.
        """

        payload = {
            "newPassword": "NewStrongPassword123!!",
            "newPasswordConfirm": "DifferentPassword123!!",
        }

        response = self.__confirm_reset(self.uidb64, self.valid_token, payload)

        self.assertEqual(response.status_code, 400)

        user = User.objects.get(pk=self.user.pk)
        self.assertTrue(user.check_password("OldStrongPassword123!!"))

    def test_missing_required_payload_keys_raises_keyerror(self):
        """
        Test what happens if the client app does not send all required input data.
        The server (or Python) should return a 400 response. 
        """

        response = self.__confirm_reset(self.uidb64, self.valid_token, payload={})
        self.assertEqual(response.status_code, 400)

    def test_token_for_other_user_cannot_reset_password(self):
        """
        Test what happens if the user uses another user's token.
        The server should return a 400 status code and the password of the user should not change.
        """

        other = User.objects.create_user(
            username="user2",
            email="user2@example.com",
            password="OtherOldStrongPassword123!!",
        )
        other_uidb64 = urlsafe_base64_encode(force_bytes(other.pk))

        payload = {
            "newPassword": "NewStrongPassword123!!",
            "newPasswordConfirm": "NewStrongPassword123!!",
        }

        # Using token for self.user against other user's uidb64 should fail
        response = self.__confirm_reset(other_uidb64, self.valid_token, payload)

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {"detail": "Password reset failed."})

        other_user = User.objects.get(pk=other.pk)
        self.assertTrue(other_user.check_password("OtherOldStrongPassword123!!"))


class UpdateAccountViewTests(TestCase):
    """
    Unit tests for UpdateAccountView (admin-only update by user id).
    """

    def setUp(self):
        self.user1 = User.objects.create_user(
            username="user1",
            email="user1@example.com",
            password="StrongPassword123!!",
        )

        self.user2 = User.objects.create_user(
            username="user2",
            email="user2@example.com",
            password="StrongPassword123!!",
        )

        # IsAdminUser checks `is_staff`
        self.admin = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="StrongPassword123!!",
            is_staff=True,
        )

    def __update_account(self, user_id: int, payload: dict):
        return self.client.put(
            reverse("update_account", args=[user_id]),
            data=json.dumps(payload),
            content_type="application/json",
        )

    def test_unauthenticated_user_cannot_update(self):
        payload = {"is_staff": True}
        response = self.__update_account(self.user1.id, payload)
        self.assertEqual(response.status_code, 403)

        self.user1.refresh_from_db()
        self.assertFalse(self.user1.is_staff)

    def test_authenticated_non_admin_cannot_update(self):
        self.client.force_login(self.user1)

        payload = {"is_staff": True}
        response = self.__update_account(self.user1.id, payload)
        self.assertEqual(response.status_code, 403)

        self.user1.refresh_from_db()
        self.assertFalse(self.user1.is_staff)

    def test_admin_can_update_user(self):
        self.client.force_login(self.admin)

        payload = {"is_staff": True}
        response = self.__update_account(self.user1.id, payload)
        self.assertEqual(response.status_code, 200)

        # response is UserSerializer(user).data
        self.assertEqual(response.data["id"], self.user1.id)
        self.assertTrue(response.data["is_staff"])

        # DB updated
        self.user1.refresh_from_db()
        self.assertTrue(self.user1.is_staff)

        # other users unchanged
        self.user2.refresh_from_db()
        self.assertFalse(self.user2.is_staff)

    def test_returns_404_if_user_does_not_exist(self):
        self.client.force_login(self.admin)

        payload = {"is_staff": True}
        response = self.__update_account(999999, payload)
        self.assertEqual(response.status_code, 404)
        self.assertEqual(
            response.data.get("detail"),
            "The user with the given id does not exist.",
        )

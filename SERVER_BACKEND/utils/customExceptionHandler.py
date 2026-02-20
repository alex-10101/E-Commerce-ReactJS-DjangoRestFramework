from django.http import JsonResponse

def handle_500_error(exception):
    """
    When the server is running in production (Debug=False), use this handler500
    to catch unexpected errors and send a message to the users.

    For this to work, in the project_name/urls.py (here in ecommerce_api/urls.py) add this line after the urlpatterns list:

    handler500 = "utils.customExceptionHandler.handle_500_error"
    """
    response = JsonResponse({"detail": "Did not complete action, an unexpected error occured."})
    response.status_code = 500
    return response
from django.urls import path
from . import api_views

urlpatterns = [
    path('login/', api_views.login_api, name='api_login'),
    path('logout/', api_views.logout_api, name='api_logout'),
    path('register/', api_views.register_api, name='api_register'),
    path('register/verify/', api_views.register_verify_api, name='api_register_verify'),
    path('profile/', api_views.profile_api, name='api_profile'),
    path('email/connect/', api_views.connect_email_api, name='api_email_connect'),
    path('device/register/', api_views.register_device_api, name='api_device_register'),
    path('test-push/', api_views.test_push_api, name='api_test_push'),
]

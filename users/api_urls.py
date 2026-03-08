from django.urls import path
from . import api_views

urlpatterns = [
    path("login/", api_views.login_api),
    path("register/", api_views.register_api),
    path("register/verify/", api_views.register_verify_api),
    path("forgot-password/", api_views.forgot_password_api),
    path("forgot-password/verify/", api_views.forgot_verify_api),
    path("reset-password/", api_views.reset_password_api),
    path("profile/", api_views.profile_api),
    path("email/connect/", api_views.connect_email_api),
    # path("candidates/<int:candidate_id>/add/", api_views.add_from_candidate_api),
    path("logout/", api_views.logout_api),
]
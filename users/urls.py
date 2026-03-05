from django.urls import path, include
from . import views

app_name = "auth"

urlpatterns = [
    path("login/", views.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),
    path("register/", views.register_view, name="register"),
    path("register/verify/", views.register_verify_view, name="register_verify"),
    path("forgot-password/", views.forgot_password_view, name="forgot_password"),
    path("forgot-password/verify/", views.forgot_verify_view, name="forgot_verify"),
    path("reset-password/", views.reset_password_view, name="reset_password"),
    path("profile/", views.profile_view, name="profile"),
    path("email/connect/", views.connect_email, name="connect_email"),
    path("detected/<int:candidate_id>/", views.add_from_candidate, name="add_from_candidate"),
]
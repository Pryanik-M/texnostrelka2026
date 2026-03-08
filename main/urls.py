from django.urls import path
from . import views

app_name = "main"

urlpatterns = [
    path("", views.home_view, name="home"),
    path("analytics/", views.analytics_view, name="analytics"),
    path("forecast/", views.forecast_view, name="forecast"),
    path("subscriptions/", views.subscriptions_list, name="subscriptions"),
    path("subscriptions/add/", views.add_subscription, name="add_subscription"),
    path("email/sync/", views.email_sync, name="email_sync"),
    path("email/disconnect/", views.email_disconnect, name="email_disconnect"),
    path("subscriptions/detected/", views.subscription_candidates, name="subscription_candidates"),
    path("subscriptions/accept/<int:candidate_id>/", views.accept_candidate, name="accept_candidate"),
    path("subscriptions/ignore/<int:candidate_id>/", views.ignore_candidate,name="ignore_candidate"),
    path("subscriptions/detected/confirm/<int:candidate_id>/", views.confirm_candidate, name="confirm_candidate"),
    path("subscriptions/from-email/<int:candidate_id>/", views.create_subscription_from_email, name="create_from_email"),
    path('subscriptions/delete/<int:sub_id>/', views.delete_subscription, name='delete_subscription'),
]
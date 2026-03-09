from django.urls import path
from . import api_views

urlpatterns = [
    path("subscriptions/", api_views.subscriptions_api),
    path("subscriptions/<int:sub_id>/", api_views.subscription_detail_api),
    path("email/sync/", api_views.email_sync_api),
    path("analytics/", api_views.analytics_api),
    path("forecast/", api_views.forecast_api),
    path("candidates/", api_views.candidates_api),
    path("candidates/<int:candidate_id>/accept/", api_views.accept_candidate_api),
    path("candidates/<int:candidate_id>/ignore/", api_views.ignore_candidate_api),
    path("candidates/<int:candidate_id>/create/", api_views.create_from_candidate_api),
    path("email/disconnect/", api_views.email_disconnect_api),
]
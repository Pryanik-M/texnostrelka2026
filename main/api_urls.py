from django.urls import path
from . import api_views

urlpatterns = [
    path('categories/', api_views.categories_api, name='api_categories'),
    path('subscriptions/', api_views.subscriptions_api, name='api_subscriptions'),
    path('subscriptions/<int:sub_id>/', api_views.subscription_detail_api, name='api_subscription_detail'),
    path('analytics/', api_views.analytics_api, name='api_analytics'),
    path('forecast/', api_views.forecast_api, name='api_forecast'),
    path('candidates/', api_views.candidates_api, name='api_candidates'),
    path('candidates/<int:candidate_id>/accept/', api_views.accept_candidate_api, name='api_candidate_accept'),
    path('candidates/<int:candidate_id>/ignore/', api_views.ignore_candidate_api, name='api_candidate_ignore'),
    path('candidates/<int:candidate_id>/create/', api_views.create_from_candidate_api, name='api_candidate_create'),
    path('email/sync/', api_views.email_sync_api, name='api_email_sync'),
    path('email/disconnect/', api_views.email_disconnect_api, name='api_email_disconnect'),
]

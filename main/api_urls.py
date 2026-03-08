from django.urls import path
from . import api_views

urlpatterns = [

    path(
        "candidates/<int:candidate_id>/add/",
        api_views.add_from_candidate_api
    ),

]
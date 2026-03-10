from django.urls import path, include

urlpatterns = [
    path('users/', include('users.api_urls')),
    path('main/', include('main.api_urls')),
]

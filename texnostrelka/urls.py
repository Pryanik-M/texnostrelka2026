from django.contrib import admin
from django.urls import path, include
from django.shortcuts import redirect

urlpatterns = [
    path('api/', include('texnostrelka.api_urls')),
    path('', include('main.urls')),
    path('auth/', include('users.urls')),
    path('admin/', admin.site.urls),
    path('webpush/', include('webpush.urls')),
    path('api/users/', include('users.api_urls')),
    path('api/main/', include('main.api_urls')),
]

from django.contrib import admin
from django.urls import path, include
from django.shortcuts import redirect

urlpatterns = [
    path('', include('main.urls')),
    path('auth/', include('users.urls')),
    path('admin/', admin.site.urls),
    path('webpush/', include('webpush.urls')),
]

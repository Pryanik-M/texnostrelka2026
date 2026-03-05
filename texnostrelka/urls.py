from django.contrib import admin
from django.urls import path, include
from django.shortcuts import redirect
from django.views.generic import RedirectView, TemplateView

urlpatterns = [
    path('webpush/service-worker.js', TemplateView.as_view(template_name="service-worker.js", content_type='application/javascript'), name='service-worker.js'),
    path('', include('main.urls')),
    path('auth/', include('users.urls')),
    path('admin/', admin.site.urls),
    path('webpush/', include('webpush.urls')),
]

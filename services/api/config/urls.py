"""Root URL configuration for the OmniLinks API."""

from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("health/", include("modules.health.presentation.http.urls")),
]

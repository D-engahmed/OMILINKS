"""HTTP routes for process and dependency health checks."""

from django.urls import path

from modules.health.presentation.http.views import live, ready

urlpatterns = [
    path("live/", live, name="health-live"),
    path("ready/", ready, name="health-ready"),
]

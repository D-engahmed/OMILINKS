"""Django application configuration for operational health checks."""

from django.apps import AppConfig


class HealthConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "modules.health"

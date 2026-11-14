"""Tests for operational health endpoints."""

from unittest.mock import patch

from django.db import OperationalError
from django.test import SimpleTestCase


class HealthEndpointTests(SimpleTestCase):
    def test_liveness_does_not_depend_on_database(self):
        response = self.client.get("/health/live/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "live"})

    @patch("modules.health.presentation.http.views.connection.cursor")
    def test_readiness_succeeds_when_database_is_available(self, cursor):
        cursor.return_value.__enter__.return_value = cursor.return_value

        response = self.client.get("/health/ready/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "status": "ready",
                "checks": {"database": "available"},
            },
        )
        cursor.assert_called_once()
        cursor.return_value.execute.assert_called_once_with("SELECT 1")

    @patch(
        "modules.health.presentation.http.views.connection.cursor",
        side_effect=OperationalError("database credential details"),
    )
    def test_readiness_fails_without_exposing_database_error(self, _cursor):
        response = self.client.get("/health/ready/")

        self.assertEqual(response.status_code, 503)
        self.assertEqual(
            response.json(),
            {
                "status": "not_ready",
                "checks": {"database": "unavailable"},
            },
        )
        self.assertNotIn("credential", response.content.decode().lower())

    def test_health_endpoints_reject_non_get_methods(self):
        response = self.client.post("/health/live/")

        self.assertEqual(response.status_code, 405)

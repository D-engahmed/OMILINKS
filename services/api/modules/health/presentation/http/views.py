"""Operational health endpoints.

Liveness intentionally avoids dependency checks so an unavailable database
does not cause an orchestrator to restart a healthy application process.
Readiness verifies the database before the instance receives traffic.
"""

from django.db import DatabaseError, connection
from django.http import JsonResponse
from django.views.decorators.http import require_GET


@require_GET
def live(_request):
    """Report that the web process can serve requests."""
    return JsonResponse({"status": "live"})


@require_GET
def ready(_request):
    """Report readiness only when the transactional database is reachable."""
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
    except DatabaseError:
        return JsonResponse(
            {
                "status": "not_ready",
                "checks": {"database": "unavailable"},
            },
            status=503,
        )

    return JsonResponse(
        {
            "status": "ready",
            "checks": {"database": "available"},
        }
    )

"""Kafka producer for the ingestion pipeline (ch.27: channels -> api via webhooks).

Channels POST webhooks -> FastAPI -> normalized event -> Kafka topic
`omilinks.ingestion` -> consumer persists to Postgres and triggers the AI engine.
"""

import json
import uuid
from typing import Any

from aiokafka import AIOKafkaProducer

from app.core.config import settings

_producer: AIOKafkaProducer | None = None


async def get_producer() -> AIOKafkaProducer:
    global _producer
    if _producer is None:
        _producer = AIOKafkaProducer(
            bootstrap_servers=settings.kafka_bootstrap_servers,
            value_serializer=lambda v: json.dumps(v).encode("utf-8"),
        )
        try:
            await _producer.start()
        except Exception:
            _producer = None
            raise
    return _producer


async def publish_ingestion_event(event: dict[str, Any]) -> None:
    """Publish an ingestion event. No-op if Kafka is unavailable (dev without broker)."""
    try:
        producer = await get_producer()
    except Exception as exc:  # noqa: BLE001
        print(
            f"[ingestion] Kafka unavailable; dropping event "
            f"({exc.__class__.__name__}): {event.get('event_id')}"
        )
        return
    event.setdefault("event_id", str(uuid.uuid4()))
    await producer.send_and_wait(settings.kafka_ingestion_topic, event)

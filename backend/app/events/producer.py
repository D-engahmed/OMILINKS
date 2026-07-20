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
        await _producer.start()
    return _producer


async def publish_ingestion_event(event: dict[str, Any]) -> None:
    producer = await get_producer()
    event.setdefault("event_id", str(uuid.uuid4()))
    await producer.send_and_wait(settings.kafka_ingestion_topic, event)

"""Kafka consumer for the ingestion pipeline.

Consumes `omilinks.ingestion`, persists normalized events, and dispatches to
the AI decision engine (ch.19). Scaffold only — domain handler plugged in later.
"""

import asyncio
import json

from aiokafka import AIOKafkaConsumer

from app.core.config import settings


async def start_consumer():
    """Start the ingestion consumer.

    Best-effort: if Kafka is unreachable (e.g. local dev without a broker),
    log and return None so the API still boots. The producer side will buffer
    or error per-call; ingestion simply waits for a broker to appear.
    """
    try:
        consumer = AIOKafkaConsumer(
            settings.kafka_ingestion_topic,
            bootstrap_servers=settings.kafka_bootstrap_servers,
            group_id=settings.kafka_consumer_group,
            value_deserializer=lambda v: json.loads(v.decode("utf-8")),
            auto_offset_reset="earliest",
        )
        await consumer.start()
    except Exception as exc:  # noqa: BLE001 — Kafka down should not block API startup
        print(
            f"[ingestion] Kafka unavailable at {settings.kafka_bootstrap_servers}; "
            f"consumer not started ({exc.__class__.__name__})."
        )
        return None

    async def _loop():
        try:
            async for msg in consumer:
                await handle_ingestion_event(msg.value)
        except Exception as exc:  # noqa: BLE001
            print(f"[ingestion] consumer loop stopped: {exc}")
        finally:
            await consumer.stop()

    return asyncio.create_task(_loop())


async def handle_ingestion_event(event: dict) -> None:
    # TODO: persist conversation/message, trigger AI decision flow (ch.19/29)
    # Placeholder: log receipt.
    print(f"[ingestion] received event_id={event.get('event_id')}")

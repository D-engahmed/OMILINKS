"""CLI to seed RBAC catalog + system role templates (ch.13 §6).

Usage:
    python -m app.domains.access.services.seed_cli
Requires a running Postgres pointed to by DATABASE_URL in .env.
"""

import asyncio

from app.db.session import AsyncSessionLocal
from app.domains.access.services.seed import seed_rbac


async def main() -> None:
    async with AsyncSessionLocal() as db:
        await seed_rbac(db)
    print("RBAC seeded: permissions + 6 system role templates.")


if __name__ == "__main__":
    asyncio.run(main())

"""Smoke tests: health, register, login, full CRUD flow."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health(client: AsyncClient):
    resp = await client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["service"] == "Omnilinks"


@pytest.mark.asyncio
async def test_register_and_login(client: AsyncClient):
    # Register
    resp = await client.post(
        "/auth/register",
        json={
            "company_name": "TestCo",
            "slug": "testco-smoke",
            "email": "admin@testco-smoke.com",
            "password": "secret123",
            "type": "startup",
        },
    )
    assert resp.status_code == 201
    tenant = resp.json()
    assert tenant["slug"] == "testco-smoke"
    assert tenant["type"] == "startup"

    # Login
    resp = await client.post(
        "/auth/login",
        json={"email": "admin@testco-smoke.com", "password": "secret123"},
    )
    assert resp.status_code == 200
    token = resp.json()["access_token"]
    assert len(token) > 20


@pytest.mark.asyncio
async def test_full_team_crud(client: AsyncClient):
    # Setup: register + login
    await client.post(
        "/auth/register",
        json={
            "company_name": "TeamTest",
            "slug": "teamtest-smoke",
            "email": "admin@teamtest.com",
            "password": "secret123",
        },
    )
    login = await client.post(
        "/auth/login",
        json={"email": "admin@teamtest.com", "password": "secret123"},
    )
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    # List teams (should have default "General")
    resp = await client.get("/teams", headers=headers)
    assert resp.status_code == 200
    teams = resp.json()
    assert any(t["name"] == "General" and t["is_default"] for t in teams)

    # Create team
    resp = await client.post("/teams", json={"name": "Support"}, headers=headers)
    assert resp.status_code == 201
    team_id = resp.json()["id"]
    assert resp.json()["name"] == "Support"

    # Get team
    resp = await client.get(f"/teams/{team_id}", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["name"] == "Support"

    # Update team
    resp = await client.patch(f"/teams/{team_id}", json={"name": "Support 2"}, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["name"] == "Support 2"

    # Duplicate name → 409
    resp = await client.post("/teams", json={"name": "General"}, headers=headers)
    assert resp.status_code == 409

    # Delete team
    resp = await client.delete(f"/teams/{team_id}", headers=headers)
    assert resp.status_code == 200

    # Cannot delete default team
    general_id = [t for t in teams if t["is_default"]][0]["id"]
    resp = await client.delete(f"/teams/{general_id}", headers=headers)
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_user_invite_and_list(client: AsyncClient):
    await client.post(
        "/auth/register",
        json={
            "company_name": "UserTest",
            "slug": "usertest-smoke",
            "email": "admin@usertest.com",
            "password": "secret123",
        },
    )
    login = await client.post(
        "/auth/login",
        json={"email": "admin@usertest.com", "password": "secret123"},
    )
    h = {"Authorization": f"Bearer {login.json()['access_token']}"}

    # List users (should have admin)
    resp = await client.get("/users", headers=h)
    assert resp.status_code == 200
    users = resp.json()
    assert any(u["email"] == "admin@usertest.com" for u in users)

    # Invite user
    resp = await client.post(
        "/users/invites",
        json={"email": "agent@usertest.com", "full_name": "Agent Smith"},
        headers=h,
    )
    assert resp.status_code == 201
    assert resp.json()["email"] == "agent@usertest.com"
    assert resp.json()["status"] == "invited"

    # Duplicate invite → 409
    resp = await client.post(
        "/users/invites",
        json={"email": "agent@usertest.com"},
        headers=h,
    )
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_access_roles_and_permissions(client: AsyncClient):
    await client.post(
        "/auth/register",
        json={
            "company_name": "AccessTest",
            "slug": "accesstest-smoke",
            "email": "admin@accesstest.com",
            "password": "secret123",
        },
    )
    login = await client.post(
        "/auth/login",
        json={"email": "admin@accesstest.com", "password": "secret123"},
    )
    h = {"Authorization": f"Bearer {login.json()['access_token']}"}

    # List permissions
    resp = await client.get("/access/permissions", headers=h)
    assert resp.status_code == 200
    perms = resp.json()
    assert len(perms) > 50  # we have 67

    # List roles (system templates)
    resp = await client.get("/access/roles", headers=h)
    assert resp.status_code == 200
    roles = resp.json()
    role_names = [r["name"] for r in roles]
    assert "Tenant Admin" in role_names
    assert "Agent" in role_names

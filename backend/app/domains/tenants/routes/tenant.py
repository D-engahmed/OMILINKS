"""Tenant + Team + User routers (ch.13 Appendix B API surface)."""

from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_request_context, require
from app.core.context import RequestContext
from app.db.session import get_db
from app.domains.access.services.seed import seed_rbac
from app.domains.tenants.models.tenant import Team, Tenant, User
from app.domains.tenants.schemas.tenant import (
    TeamCreate,
    TeamMemberAdd,
    TeamOut,
    TenantCreate,
    TenantOut,
    UserInvite,
    UserOut,
)
from app.domains.tenants.services.provisioning import provision_tenant

router = APIRouter(prefix="/tenants", tags=["tenants"])


@router.post("/seed", dependencies=[Depends(require("role.manage"))])
async def seed(db: AsyncSession = Depends(get_db)):
    await seed_rbac(db)
    return {"status": "seeded"}


@router.post("", response_model=TenantOut, status_code=status.HTTP_201_CREATED)
async def create_tenant(
    payload: TenantCreate, db: AsyncSession = Depends(get_db)
):
    # provisioning also seeds RBAC if not present
    await seed_rbac(db)
    tenant = await provision_tenant(
        db=db,
        name=payload.name,
        slug=payload.slug,
        email=payload.email,
        tenant_type=payload.type,
    )
    return tenant


@router.get("/current", response_model=TenantOut, dependencies=[Depends(require("tenant.view"))])
async def get_current_tenant(
    db: AsyncSession = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context),
):
    tenant = await db.get(Tenant, ctx.tenant_id)
    return tenant


@router.get("/teams", response_model=list[TeamOut], dependencies=[Depends(require("team.view.all"))])
async def list_teams(
    db: AsyncSession = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context),
):
    rows = (
        await db.scalars(select(Team).where(Team.tenant_id == ctx.tenant_id))
    ).all()
    return list(rows)


@router.post("/teams", response_model=TeamOut, dependencies=[Depends(require("team.create"))])
async def create_team(
    payload: TeamCreate,
    db: AsyncSession = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context),
):
    team = Team(tenant_id=ctx.tenant_id, name=payload.name, settings=payload.settings)
    db.add(team)
    await db.commit()
    await db.refresh(team)
    return team


@router.post(
    "/teams/{team_id}/members",
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require("team.members.manage.all"))],
)
async def add_member(
    team_id: UUID,
    payload: TeamMemberAdd,
    db: AsyncSession = Depends(get_db),
):
    from app.domains.tenants.models.membership import TeamMembership

    member = TeamMembership(team_id=team_id, user_id=payload.user_id, role_id=payload.role_id)
    db.add(member)
    await db.commit()
    return {"status": "added"}


@router.post("/users/invites", response_model=UserOut, dependencies=[Depends(require("user.invite"))])
async def invite_user(
    payload: UserInvite,
    db: AsyncSession = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context),
):
    user = User(
        tenant_id=ctx.tenant_id,
        email=payload.email,
        full_name=payload.full_name,
        password_hash="INVITED",  # set on first login
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

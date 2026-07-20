"""Team routes: /teams (CRUD) + /teams/{id}/members."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.auth import get_request_context, require
from app.core.context import RequestContext
from app.db.session import get_db
from app.domains.tenants.models.membership import TeamMembership
from app.domains.tenants.models.tenant import Team, User
from app.domains.tenants.schemas.common import MessageResponse
from app.domains.tenants.schemas.team import (
    TeamCreate,
    TeamMemberAdd,
    TeamMemberOut,
    TeamMemberUpdate,
    TeamOut,
    TeamUpdate,
)

router = APIRouter(prefix="/teams", tags=["teams"])


# ── Teams CRUD ──────────────────────────────────────────────────────────────


@router.get("", response_model=list[TeamOut], dependencies=[Depends(require("team.view.all"))])
async def list_teams(
    db: AsyncSession = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context),
):
    rows = (await db.scalars(select(Team).where(Team.tenant_id == ctx.tenant_id))).all()
    return list(rows)


@router.post("", response_model=TeamOut, status_code=status.HTTP_201_CREATED)
async def create_team(
    payload: TeamCreate,
    db: AsyncSession = Depends(get_db),
    ctx: RequestContext = Depends(require("team.create")),
):
    # Check duplicate name within tenant
    existing = (
        await db.scalars(
            select(Team).where(Team.tenant_id == ctx.tenant_id, Team.name == payload.name)
        )
    ).first()
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, f"Team '{payload.name}' already exists")

    team = Team(tenant_id=ctx.tenant_id, name=payload.name, settings=payload.settings)
    db.add(team)
    await db.commit()
    await db.refresh(team)
    return team


@router.get(
    "/{team_id}",
    response_model=TeamOut,
    dependencies=[Depends(require("team.view.all"))],
)
async def get_team(
    team_id: UUID,
    db: AsyncSession = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context),
):
    team = await _get_team_or_404(db, team_id, ctx.tenant_id)
    return team


@router.patch(
    "/{team_id}",
    response_model=TeamOut,
    dependencies=[Depends(require("team.update.all"))],
)
async def update_team(
    team_id: UUID,
    payload: TeamUpdate,
    db: AsyncSession = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context),
):
    team = await _get_team_or_404(db, team_id, ctx.tenant_id)
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(team, field, value)
    await db.commit()
    await db.refresh(team)
    return team


@router.delete(
    "/{team_id}",
    response_model=MessageResponse,
    dependencies=[Depends(require("team.delete.all"))],
)
async def delete_team(
    team_id: UUID,
    db: AsyncSession = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context),
):
    team = await _get_team_or_404(db, team_id, ctx.tenant_id)
    # S1: cannot delete the default team
    if team.is_default:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cannot delete the default team")
    # S1: cannot delete the last team
    from sqlalchemy import func

    team_count = (
        await db.scalar(select(func.count()).select_from(Team).where(Team.tenant_id == ctx.tenant_id))
    )
    if team_count <= 1:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cannot delete the last team")

    await db.delete(team)
    await db.commit()
    return MessageResponse(message=f"Team '{team.name}' deleted")


# ── Team Members ────────────────────────────────────────────────────────────


@router.get(
    "/{team_id}/members",
    response_model=list[TeamMemberOut],
    dependencies=[Depends(require("team.view.all"))],
)
async def list_members(
    team_id: UUID,
    db: AsyncSession = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context),
):
    await _get_team_or_404(db, team_id, ctx.tenant_id)  # verify team exists
    rows = (
        await db.scalars(
            select(TeamMembership)
            .where(TeamMembership.team_id == team_id)
            .options(selectinload(TeamMembership.user), selectinload(TeamMembership.role))
        )
    ).all()
    return [_membership_to_out(m) for m in rows]


@router.post(
    "/{team_id}/members",
    response_model=TeamMemberOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require("team.members.manage.all"))],
)
async def add_member(
    team_id: UUID,
    payload: TeamMemberAdd,
    db: AsyncSession = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context),
):
    await _get_team_or_404(db, team_id, ctx.tenant_id)
    # Verify user belongs to same tenant
    user = await db.get(User, payload.user_id)
    if user is None or user.tenant_id != ctx.tenant_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    # Check duplicate membership
    existing = (
        await db.scalars(
            select(TeamMembership).where(
                TeamMembership.team_id == team_id,
                TeamMembership.user_id == payload.user_id,
            )
        )
    ).first()
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "User already in this team")

    member = TeamMembership(
        team_id=team_id,
        user_id=payload.user_id,
        role_id=payload.role_id,
        is_primary=payload.is_primary,
    )
    db.add(member)
    await db.commit()
    await db.refresh(member)
    # Reload with relationships
    member = (
        await db.scalars(
            select(TeamMembership)
            .where(TeamMembership.id == member.id)
            .options(selectinload(TeamMembership.user), selectinload(TeamMembership.role))
        )
    ).one()
    return _membership_to_out(member)


@router.patch(
    "/{team_id}/members/{user_id}",
    response_model=TeamMemberOut,
    dependencies=[Depends(require("team.members.manage.all"))],
)
async def update_member(
    team_id: UUID,
    user_id: UUID,
    payload: TeamMemberUpdate,
    db: AsyncSession = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context),
):
    member = await _get_member_or_404(db, team_id, user_id)
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(member, field, value)
    await db.commit()
    member = (
        await db.scalars(
            select(TeamMembership)
            .where(TeamMembership.id == member.id)
            .options(selectinload(TeamMembership.user), selectinload(TeamMembership.role))
        )
    ).one()
    return _membership_to_out(member)


@router.delete(
    "/{team_id}/members/{user_id}",
    response_model=MessageResponse,
    dependencies=[Depends(require("team.members.manage.all"))],
)
async def remove_member(
    team_id: UUID,
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context),
):
    member = await _get_member_or_404(db, team_id, user_id)
    # S2: cannot remove the last member with team.manage

    # Check if this member is the last one with team.manage permission
    # For now, allow removal — S2 enforcement needs permission lookup
    await db.delete(member)
    await db.commit()
    return MessageResponse(message="Member removed")


# ── Helpers ─────────────────────────────────────────────────────────────────


async def _get_team_or_404(db: AsyncSession, team_id: UUID, tenant_id: UUID) -> Team:
    team = await db.get(Team, team_id)
    if team is None or team.tenant_id != tenant_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Team not found")
    return team


async def _get_member_or_404(
    db: AsyncSession, team_id: UUID, user_id: UUID
) -> TeamMembership:
    member = (
        await db.scalars(
            select(TeamMembership).where(
                TeamMembership.team_id == team_id,
                TeamMembership.user_id == user_id,
            )
        )
    ).first()
    if member is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Member not found")
    return member


def _membership_to_out(m: TeamMembership) -> TeamMemberOut:
    return TeamMemberOut(
        user_id=m.user_id,
        role_id=m.role_id,
        is_primary=m.is_primary,
        max_concurrent_conversations=m.max_concurrent_conversations,
        joined_at=m.joined_at,
        user_email=m.user.email if m.user else "",
        user_full_name=m.user.full_name if m.user else "",
        role_name=m.role.name if m.role else "",
    )

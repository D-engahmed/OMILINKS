"""Request context carried through a request after auth (ch.13 §7.2)."""

from dataclasses import dataclass, field
from uuid import UUID


@dataclass
class RequestContext:
    user_id: UUID
    tenant_id: UUID
    plane: str = "tenant"
    permissions: set[str] = field(default_factory=set)
    # team_id -> set of team-scoped permission bases granted in that team
    team_permissions: dict[UUID, set[str]] = field(default_factory=dict)

    @property
    def team_ids(self) -> set[UUID]:
        return set(self.team_permissions.keys())

    def can(self, permission: str, team_id: UUID | None = None) -> bool:
        """Permission check following ch.13 §7.2 semantics.

        - `*.all` form -> anywhere in the tenant.
        - `*.team` form -> only if team_id in caller's team map.
        """
        if permission in self.permissions:
            return True
        base, _, scope = permission.rpartition(".")
        if scope == "all":
            return f"{base}.all" in self.permissions
        if scope == "team":
            if f"{base}.all" in self.permissions:
                return True
            if team_id is not None and team_id in self.team_permissions:
                return permission in self.team_permissions[team_id]
            # tenant-wide role may still grant the team permission via tenant perms
            return permission in self.permissions
        return False

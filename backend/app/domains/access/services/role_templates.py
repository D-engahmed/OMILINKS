"""Six system role templates (ch.13 §6).

Tenant Admin is tenant-scope and holds every tenant permission.
Team-scope templates are permission bundles. A custom role = new rows in
roles + role_permissions, so authorization code never changes.
"""

from app.domains.access.services.catalog import PERMISSION_CATALOG
from app.domains.tenants.models.enums import RoleScope

# All tenant-scope permission codes that exist (exclude platform.* namespace)
_TENANT_PERMS = {code for code, _cat, _desc in PERMISSION_CATALOG if not code.startswith("platform.")}
_ALL_TEAM_PERMS = {c for c in _TENANT_PERMS if c.endswith(".all") or c in {
    "team.create", "user.invite", "conversation.reply", "conversation.transfer",
    "conversation.escalate", "conversation.close", "conversation.note",
    "conversation.export", "contact.manage", "contact.export", "kb.view",
    "analytics.export", "ticket.create", "ticket.update", "workflow.view",
    "workflow.manage",
}}

TENANT_ADMIN = sorted(_TENANT_PERMS)

TEAM_ADMIN = [
    "team.create", "team.update.team", "team.delete.team", "team.settings.manage.team",
    "user.invite", "user.view.team", "team.members.manage.team", "role.assign.team",
    "conversation.view.team", "conversation.reply", "conversation.assign.team",
    "conversation.transfer", "conversation.takeover", "conversation.escalate",
    "conversation.close", "conversation.note", "ai.reply.approve",
    "contact.view.team", "contact.manage", "ticket.view.team", "ticket.create", "ticket.update",
    "ai.configure.team", "ai.agent.manage", "kb.view", "kb.manage.team",
    "workflow.view", "workflow.manage", "analytics.view.team", "analytics.export",
]

MANAGER = [
    "team.create", "team.settings.manage.team", "user.invite", "user.view.team",
    "user.update.team", "team.members.manage.team", "role.assign.team",
    "conversation.view.team", "conversation.reply", "conversation.assign.team",
    "conversation.transfer", "conversation.escalate", "conversation.close", "conversation.note",
    "ai.reply.approve", "contact.view.team", "contact.manage", "ticket.view.team",
    "ticket.create", "ticket.update", "kb.view", "workflow.view", "workflow.manage",
    "analytics.view.team", "analytics.export",
]

SUPERVISOR = [
    "user.view.team", "conversation.view.team", "conversation.reply",
    "conversation.assign.team", "conversation.transfer", "conversation.takeover",
    "conversation.escalate", "conversation.close", "conversation.note", "ai.reply.approve",
    "contact.view.team", "ticket.view.team", "kb.view", "analytics.view.team",
]

AGENT = [
    "user.view.team", "conversation.view.team", "conversation.reply",
    "conversation.transfer", "conversation.escalate", "conversation.close", "conversation.note",
    "contact.view.team", "contact.manage", "ticket.view.team", "ticket.create", "ticket.update",
    "kb.view", "analytics.view.team",
]

ANALYST = [
    "user.view.team", "conversation.view.team", "contact.view.team", "ticket.view.team",
    "kb.view", "analytics.view.team", "analytics.view.all", "analytics.export",
    "workflow.view",
]

# Template registry: name -> (scope, permission list)
SYSTEM_ROLE_TEMPLATES: dict[str, tuple[str, list[str]]] = {
    "Tenant Admin": (RoleScope.TENANT.value, TENANT_ADMIN),
    "Team Admin": (RoleScope.TEAM.value, TEAM_ADMIN),
    "Manager": (RoleScope.TEAM.value, MANAGER),
    "Supervisor": (RoleScope.TEAM.value, SUPERVISOR),
    "Agent": (RoleScope.TEAM.value, AGENT),
    "Analyst": (RoleScope.TEAM.value, ANALYST),
}

import type { Membership, Permission, Role } from "./types.js"
import { AppError } from "../shared/errors.js"

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  OWNER: [
    "organization.manage",
    "membership.manage",
    "customer.read",
    "customer.write",
    "conversation.read",
    "conversation.write",
    "conversation.send",
    "conversation.assign",
    "workforce.manage",
    "knowledge.read",
    "knowledge.manage",
  ],
  ADMIN: [
    "organization.manage",
    "membership.manage",
    "customer.read",
    "customer.write",
    "conversation.read",
    "conversation.write",
    "conversation.send",
    "conversation.assign",
    "workforce.manage",
    "knowledge.read",
    "knowledge.manage",
  ],
  SUPERVISOR: [
    "customer.read",
    "customer.write",
    "conversation.read",
    "conversation.write",
    "conversation.send",
    "conversation.assign",
    "workforce.manage",
    "knowledge.read",
    "knowledge.manage",
  ],
  AGENT: [
    "customer.read",
    "customer.write",
    "conversation.read",
    "conversation.write",
    "conversation.send",
    "knowledge.read",
  ],
}

export function authorize(membership: Membership, permission: Permission): void {
  if (membership.status !== "ACTIVE") {
    throw new AppError(403, "FORBIDDEN", "Membership is not active.")
  }

  if (!ROLE_PERMISSIONS[membership.role].includes(permission)) {
    throw new AppError(403, "FORBIDDEN", "Operation is not permitted.")
  }
}

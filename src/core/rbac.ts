/**
 * Folio Assistant — Role-based access control helpers.
 *
 * Auth-gateway injects X-User-Role, X-User-Email, X-User-Name headers.
 * Roles: viewer < collaborator < owner (ascending privilege).
 *
 * @module folio-assistant/core/rbac
 */

import type { UserRole } from "../types.js";
import { ROLE_LEVELS } from "../types.js";

export function getUserRole(req: Request): UserRole {
  const role = req.headers.get("x-user-role") as UserRole | null;
  return role && role in ROLE_LEVELS ? role : "viewer";
}

export function getUserEmail(req: Request): string {
  return req.headers.get("x-user-email") || "anonymous";
}

export function getUserName(req: Request): string {
  return req.headers.get("x-user-name") || "anonymous";
}

export function hasRole(req: Request, minRole: UserRole): boolean {
  return ROLE_LEVELS[getUserRole(req)] >= ROLE_LEVELS[minRole];
}

export function forbidden(action: string, minRole: UserRole): Response {
  return Response.json(
    { error: `Forbidden: ${action} requires ${minRole} role or higher` },
    { status: 403 },
  );
}

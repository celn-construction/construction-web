export type Role = "owner" | "admin" | "member";

export type Permission =
  | "INVITE_MEMBERS"
  | "REMOVE_MEMBERS"
  | "MANAGE_ROLES"
  | "MANAGE_ORGANIZATION"
  | "CREATE_PROJECTS"
  | "DELETE_PROJECTS"
  | "MANAGE_PROJECTS"
  | "VIEW_PROJECTS"
  | "APPROVE_DOCUMENTS";

const rolePermissions: Record<Role, Permission[]> = {
  owner: [
    "INVITE_MEMBERS",
    "REMOVE_MEMBERS",
    "MANAGE_ROLES",
    "MANAGE_ORGANIZATION",
    "CREATE_PROJECTS",
    "DELETE_PROJECTS",
    "MANAGE_PROJECTS",
    "VIEW_PROJECTS",
    "APPROVE_DOCUMENTS",
  ],
  admin: [
    "INVITE_MEMBERS",
    "REMOVE_MEMBERS",
    "MANAGE_ROLES",
    "CREATE_PROJECTS",
    "DELETE_PROJECTS",
    "MANAGE_PROJECTS",
    "VIEW_PROJECTS",
    "APPROVE_DOCUMENTS",
  ],
  member: [
    "VIEW_PROJECTS",
  ],
};

export function hasPermission(role: string, permission: Permission): boolean {
  const userRole = role as Role;
  const permissions = rolePermissions[userRole];
  return permissions ? permissions.includes(permission) : false;
}

export function canInviteMembers(role: string): boolean {
  return hasPermission(role, "INVITE_MEMBERS");
}

export function canRemoveMembers(role: string): boolean {
  return hasPermission(role, "REMOVE_MEMBERS");
}

export function canManageRoles(role: string): boolean {
  return hasPermission(role, "MANAGE_ROLES");
}

export function canManageOrganization(role: string): boolean {
  return hasPermission(role, "MANAGE_ORGANIZATION");
}

export function canDeleteProjects(role: string): boolean {
  return hasPermission(role, "DELETE_PROJECTS");
}

export function canManageProjects(role: string): boolean {
  return hasPermission(role, "MANAGE_PROJECTS");
}

export function canApproveDocuments(role: string): boolean {
  return hasPermission(role, "APPROVE_DOCUMENTS");
}

// Org roles that imply access to any project in the org, even without an
// explicit ProjectMember row. Mirrors the auto-create logic in projectProcedure.
const ORG_ROLES_WITH_IMPLICIT_PROJECT_ACCESS = new Set<Role>([
  "owner",
  "admin",
]);

export function hasImplicitProjectAccess(role: string): boolean {
  return ORG_ROLES_WITH_IMPLICIT_PROJECT_ACCESS.has(role as Role);
}

// Role rank for hierarchy enforcement (higher = more privileged)
const ROLE_RANK: Record<Role, number> = {
  owner: 2,
  admin: 1,
  member: 0,
};

/**
 * Returns true if inviterRole can assign targetRole.
 * Inviters can only assign roles strictly below their own level.
 */
export function canAssignRole(inviterRole: string, targetRole: string): boolean {
  const inviterRank = ROLE_RANK[inviterRole as Role];
  const targetRank = ROLE_RANK[targetRole as Role];
  if (inviterRank === undefined || targetRank === undefined) return false;
  return inviterRank > targetRank;
}

export type Role = "owner" | "admin" | "project_manager" | "member" | "viewer";

export type Permission =
  | "INVITE_MEMBERS"
  | "REMOVE_MEMBERS"
  | "MANAGE_ROLES"
  | "MANAGE_ORGANIZATION"
  | "CREATE_PROJECTS"
  | "DELETE_PROJECTS"
  | "MANAGE_PROJECTS"
  | "VIEW_PROJECTS";

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
  ],
  admin: [
    "INVITE_MEMBERS",
    "REMOVE_MEMBERS",
    "MANAGE_ROLES",
    "CREATE_PROJECTS",
    "DELETE_PROJECTS",
    "MANAGE_PROJECTS",
    "VIEW_PROJECTS",
  ],
  project_manager: [
    "CREATE_PROJECTS",
    "MANAGE_PROJECTS",
    "VIEW_PROJECTS",
  ],
  member: [
    "VIEW_PROJECTS",
  ],
  viewer: [
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

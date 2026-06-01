/**
 * Converts a snake_case role string to Title Case.
 * e.g. "in_progress" → "In Progress"
 */
export function formatRole(role: string): string {
  return role
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Frames an org role as an explicit first-person membership statement,
 * making it clear the role describes the current user — not the org.
 * e.g. "owner" → "You're the owner", "member" → "You're a member"
 */
export function formatMembership(role: string): string {
  const phrases: Record<string, string> = {
    owner: "You're the owner",
    admin: "You're an admin",
    member: "You're a member",
  };
  return phrases[role.toLowerCase()] ?? `You're ${formatRole(role)}`;
}

/**
 * Extracts initials from a name string.
 * e.g. "John Doe" → "JD", "Alice" → "A", null → "?"
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
}

/**
 * Formats a byte count into a human-readable file size string.
 * e.g. 1536 → "1.5 KB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

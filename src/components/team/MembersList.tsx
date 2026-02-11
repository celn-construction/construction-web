'use client';

interface Member {
  id: string;
  role: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface MembersListProps {
  members: Member[];
  isLoading: boolean;
}

export default function MembersList({ members, isLoading }: MembersListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-lg animate-pulse"
          >
            <div className="w-10 h-10 rounded-full bg-[var(--bg-hover)]" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-[var(--bg-hover)] rounded w-1/3" />
              <div className="h-3 bg-[var(--bg-hover)] rounded w-1/2" />
            </div>
            <div className="h-6 bg-[var(--bg-hover)] rounded w-20" />
          </div>
        ))}
      </div>
    );
  }

  const formatRole = (role: string) => {
    return role
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email.charAt(0).toUpperCase();
  };

  return (
    <div className="space-y-2">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
        >
          {/* Avatar */}
          {member.user.image ? (
            <img
              src={member.user.image}
              alt={member.user.name || member.user.email}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[var(--accent-primary)] text-[var(--bg-primary)] flex items-center justify-center font-medium text-sm">
              {getInitials(member.user.name, member.user.email)}
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-[var(--text-primary)] truncate">
              {member.user.name || member.user.email}
            </div>
            <div className="text-sm text-[var(--text-muted)] truncate">
              {member.user.email}
            </div>
          </div>

          {/* Role Badge */}
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--bg-hover)] text-[var(--text-secondary)] whitespace-nowrap">
            {formatRole(member.role)}
          </span>
        </div>
      ))}
    </div>
  );
}

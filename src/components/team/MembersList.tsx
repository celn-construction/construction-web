'use client';

import { motion } from 'framer-motion';

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
            className="flex items-center gap-3 p-3.5 rounded-lg animate-pulse"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className="w-11 h-11 rounded-full bg-[var(--bg-hover)]" />
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

  const getRoleBorderColor = (role: string) => {
    if (role === 'owner' || role === 'admin') return 'var(--accent-warm)';
    if (role === 'project_manager') return 'var(--status-blue)';
    if (role === 'viewer') return 'var(--text-muted)';
    return 'var(--border-color)';
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.04,
          },
        },
      }}
      className="space-y-2"
    >
      {members.map((member) => (
        <motion.div
          key={member.id}
          variants={{
            hidden: { opacity: 0, y: 8 },
            visible: { opacity: 1, y: 0 },
          }}
          className="flex items-center gap-3 p-3.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
        >
          {/* Avatar */}
          {member.user.image ? (
            <img
              src={member.user.image}
              alt={member.user.name || member.user.email}
              className="w-11 h-11 rounded-full ring-2 ring-[var(--border-light)]"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-[var(--accent-primary)] text-[var(--bg-primary)] flex items-center justify-center font-medium text-sm">
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
          <span
            className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--bg-hover)] text-[var(--text-secondary)] whitespace-nowrap border-l-2"
            style={{ borderLeftColor: getRoleBorderColor(member.role) }}
          >
            {formatRole(member.role)}
          </span>
        </motion.div>
      ))}
    </motion.div>
  );
}

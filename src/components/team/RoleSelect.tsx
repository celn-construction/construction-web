'use client';

import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface RoleSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

const roles = [
  {
    value: 'admin',
    label: 'Admin',
    description: 'Full access to all settings and team management',
    color: 'var(--accent-warm)',
  },
  {
    value: 'project_manager',
    label: 'Project Manager',
    description: 'Manage projects, tasks, and team assignments',
    color: 'var(--status-blue)',
  },
  {
    value: 'member',
    label: 'Member',
    description: 'View and contribute to assigned projects',
    color: 'var(--border-color)',
  },
  {
    value: 'viewer',
    label: 'Viewer',
    description: 'Read-only access to projects',
    color: 'var(--text-muted)',
  },
];

export default function RoleSelect({
  value,
  onValueChange,
  disabled = false,
}: RoleSelectProps) {
  const [open, setOpen] = useState(false);
  const selectedRole = roles.find((role) => role.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border border-gray-200 dark:border-[var(--border-color)] bg-white dark:bg-[var(--bg-input)] px-3 py-2 text-sm text-gray-900 dark:text-[var(--text-primary)] ring-offset-white dark:ring-offset-[var(--bg-card)] placeholder:text-gray-500 dark:placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-gray-950 dark:focus:ring-[var(--accent-purple)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors'
          )}
        >
          <span>{selectedRole?.label || 'Select a role'}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-1">
        <div className="space-y-1">
          {roles.map((role) => (
            <button
              key={role.value}
              type="button"
              onClick={() => {
                onValueChange(role.value);
                setOpen(false);
              }}
              className={cn(
                'relative flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                'hover:bg-gray-100 dark:hover:bg-[var(--bg-hover)]',
                value === role.value &&
                  'bg-gray-50 dark:bg-[var(--bg-hover)]/50'
              )}
            >
              <div
                className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                style={{ backgroundColor: role.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-900 dark:text-[var(--text-primary)]">
                  {role.label}
                </div>
                <div className="text-xs text-gray-500 dark:text-[var(--text-muted)] mt-0.5">
                  {role.description}
                </div>
              </div>
              {value === role.value && (
                <Check className="w-4 h-4 text-gray-900 dark:text-[var(--text-primary)] mt-1 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

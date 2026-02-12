'use client';

import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Box, Typography } from '@mui/material';

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
  },
  {
    value: 'project_manager',
    label: 'Project Manager',
    description: 'Manage projects, tasks, and team assignments',
  },
  {
    value: 'member',
    label: 'Member',
    description: 'View and contribute to assigned projects',
  },
  {
    value: 'viewer',
    label: 'Viewer',
    description: 'Read-only access to projects',
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
          style={{
            display: 'flex',
            height: '40px',
            width: '100%',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-input)',
            padding: '8px 12px',
            fontSize: '0.875rem',
            color: 'var(--text-primary)',
            transition: 'all 0.2s',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
          }}
        >
          <span>{selectedRole?.label || 'Select a role'}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-1">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {roles.map((role) => (
            <button
              key={role.value}
              type="button"
              onClick={() => {
                onValueChange(role.value);
                setOpen(false);
              }}
              style={{
                position: 'relative',
                display: 'flex',
                width: '100%',
                alignItems: 'flex-start',
                gap: '12px',
                borderRadius: '8px',
                padding: '10px 12px',
                textAlign: 'left',
                transition: 'background-color 0.2s',
                backgroundColor: value === role.value ? 'var(--bg-hover)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                if (value !== role.value) {
                  e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (value !== role.value) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: 'text.disabled',
                  mt: 0.75,
                  flexShrink: 0,
                }}
              />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 500, color: 'text.primary' }}
                >
                  {role.label}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled', mt: 0.25 }}>
                  {role.description}
                </Typography>
              </Box>
              {value === role.value && (
                <Check className="w-4 h-4 mt-1 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

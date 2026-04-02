'use client';

import { Check } from '@phosphor-icons/react';
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  type SelectChangeEvent,
} from '@mui/material';

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
  const selectedRole = roles.find((role) => role.value === value);

  const handleChange = (event: SelectChangeEvent) => {
    onValueChange(event.target.value);
  };

  return (
    <FormControl fullWidth disabled={disabled}>
      <Select
        value={value}
        onChange={handleChange}
        displayEmpty
        renderValue={(selected) => {
          const role = roles.find((r) => r.value === selected);
          return role?.label || 'Select a role';
        }}
        sx={{
          '& .MuiSelect-select': {
            py: 1.25,
          },
        }}
      >
        {roles.map((role) => (
          <MenuItem
            key={role.value}
            value={role.value}
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.5,
              py: 1.5,
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
              <Typography variant="caption" sx={{ color: 'text.disabled', mt: 0.25, display: 'block' }}>
                {role.description}
              </Typography>
            </Box>
            {value === role.value && (
              <Check size={16} weight="bold" style={{ marginTop: 4, flexShrink: 0 }} />
            )}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

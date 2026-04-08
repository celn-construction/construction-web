'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User, Settings } from 'lucide-react';
import { Box, Menu, MenuItem, Typography, Divider } from '@mui/material';
import { signOut, useSession } from '@/lib/auth-client';
import UserAvatar from '@/components/ui/UserAvatar';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { useLoading } from '@/components/providers/LoadingProvider';

export default function UserMenu() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const open = Boolean(anchorEl);
  const router = useRouter();
  const { data: session } = useSession();
  const { showLoading, hideLoading } = useLoading();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    showLoading('Logging out...');
    try {
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            hideLoading();
            handleClose();
            router.push('/sign-in');
            router.refresh();
          }
        }
      });
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
      hideLoading();
    }
  };

  return (
    <>
      <Box
        component="button"
        onClick={handleClick}
        aria-label="User menu"
        aria-expanded={open}
        sx={{
          width: 40,
          height: 40,
          bgcolor: 'action.hover',
          borderRadius: '50%',
          overflow: 'hidden',
          cursor: 'pointer',
          border: '2px solid transparent',
          transition: 'all 0.2s',
          p: 0,
          '&:hover': {
            borderColor: 'action.selected',
          },
        }}
      >
        <UserAvatar
          image={session?.user?.image}
          name={session?.user?.name}
          size={36}
          borderRadius="50%"
          fontSize="0.8125rem"
        />
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        sx={{
          mt: 1.5,
          '& .MuiPaper-root': {
            width: 192,
          },
        }}
      >
        <Box sx={{ px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
            {session?.user?.name || 'User'}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {session?.user?.email || ''}
          </Typography>
        </Box>

        <MenuItem onClick={handleClose}>
          <User style={{ width: 16, height: 16, color: 'var(--text-secondary)', marginRight: 12 }} />
          <Typography variant="body2">Profile</Typography>
        </MenuItem>

        <MenuItem onClick={handleClose}>
          <Settings style={{ width: 16, height: 16, color: 'var(--text-secondary)', marginRight: 12 }} />
          <Typography variant="body2">Settings</Typography>
        </MenuItem>

        <Divider sx={{ my: 0.5 }} />

        <MenuItem
          onClick={handleLogout}
          disabled={isLoggingOut}
          sx={{
            color: 'error.main',
            '&:hover': {
              bgcolor: 'error.main',
              color: 'white',
              opacity: 0.1,
            },
          }}
        >
          {isLoggingOut ? (
            <>
              <LoadingSpinner size="sm" />
              <Typography variant="body2" sx={{ ml: 1.5 }}>Logging out...</Typography>
            </>
          ) : (
            <>
              <LogOut style={{ width: 16, height: 16, marginRight: 12 }} />
              <Typography variant="body2">Logout</Typography>
            </>
          )}
        </MenuItem>
      </Menu>

    </>
  );
}

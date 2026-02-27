'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import type { AlertColor } from '@mui/material/Alert';

interface SnackbarAction {
  label: string;
  onClick: () => void;
}

interface SnackbarOptions {
  severity?: AlertColor;
  action?: SnackbarAction;
}

interface SnackbarContextValue {
  showSnackbar: (message: string, severityOrOptions?: AlertColor | SnackbarOptions) => void;
}

const SnackbarContext = createContext<SnackbarContextValue | undefined>(undefined);

export function SnackbarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<AlertColor>('info');
  const actionRef = useRef<SnackbarAction | undefined>(undefined);

  const showSnackbar = useCallback((msg: string, severityOrOptions?: AlertColor | SnackbarOptions) => {
    let sev: AlertColor = 'info';
    let action: SnackbarAction | undefined;

    if (typeof severityOrOptions === 'string') {
      sev = severityOrOptions;
    } else if (severityOrOptions) {
      sev = severityOrOptions.severity ?? 'info';
      action = severityOrOptions.action;
    }

    setMessage(msg);
    setSeverity(sev);
    actionRef.current = action;
    setOpen(true);
  }, []);

  const handleClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  const hasAction = !!actionRef.current;

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={hasAction ? null : 4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleClose}
          severity={severity}
          sx={{ width: '100%' }}
          action={hasAction ? (
            <Button
              color="inherit"
              size="small"
              onClick={() => { actionRef.current?.onClick(); setOpen(false); }}
            >
              {actionRef.current!.label}
            </Button>
          ) : undefined}
        >
          {message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  const context = useContext(SnackbarContext);
  if (context === undefined) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
}

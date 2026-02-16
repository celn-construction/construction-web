'use client';

import { FileUp } from 'lucide-react';
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { FileDropzone } from './FileDropzone';

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  taskId: string;
  folderId: string;
  folderName: string;
  onUploadComplete: () => void;
}

export default function UploadDialog({
  open,
  onOpenChange,
  projectId,
  taskId,
  folderId,
  folderName,
  onUploadComplete,
}: UploadDialogProps) {
  const handleUploadComplete = () => {
    onUploadComplete();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onClose={() => onOpenChange(false)} maxWidth="sm" fullWidth>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              bgcolor: 'rgb(245, 158, 11, 0.1)',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <FileUp
              size={20}
              style={{
                color: 'rgb(245, 158, 11)',
                position: 'absolute',
                zIndex: 1,
              }}
            />
          </Box>
          <DialogTitle sx={{ p: 0 }}>Upload to {folderName}</DialogTitle>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Upload a document to this folder
        </Typography>

        <DialogContent sx={{ p: 0 }}>
          <FileDropzone
            projectId={projectId}
            taskId={taskId}
            folderId={folderId}
            onUploadComplete={handleUploadComplete}
          />
        </DialogContent>

        <DialogActions sx={{ px: 0, pt: 3 }}>
          <Button variant="outlined" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

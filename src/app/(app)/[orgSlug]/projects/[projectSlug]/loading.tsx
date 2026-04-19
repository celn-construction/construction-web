import { Box } from '@mui/material';
import { IBeamLoader } from '@/components/ui/IBeamLoader';

export default function ProjectLoading() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <IBeamLoader size={32} />
    </Box>
  );
}

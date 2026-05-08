import { Box } from '@mui/material';
import { BlueprintBackground } from '@/components/onboarding/BlueprintBackground';
import UploadStatusChipsHost from '@/components/ui/UploadStatusChipsHost';

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      <BlueprintBackground />
      {children}
      <UploadStatusChipsHost />
    </Box>
  );
}

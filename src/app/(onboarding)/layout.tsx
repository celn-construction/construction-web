import { Box } from '@mui/material';
import { BlueprintBackground } from '~/components/onboarding/BlueprintBackground';

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
    </Box>
  );
}

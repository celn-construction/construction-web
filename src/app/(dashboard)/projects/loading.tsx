import { Box, Skeleton, Stack } from '@mui/material';

export default function ProjectsLoading() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: 'background.paper',
        borderRadius: 2,
        p: 3,
      }}
    >
      {/* Tree skeleton with two-level indentation (groups and tasks) */}
      <Stack spacing={1}>
        {[
          { indent: 0, width: 192 }, // Group
          { indent: 1, width: 160 }, // Task
          { indent: 1, width: 176 }, // Task
          { indent: 1, width: 144 }, // Task
          { indent: 0, width: 208 }, // Group
          { indent: 1, width: 176 }, // Task
          { indent: 1, width: 160 }, // Task
          { indent: 1, width: 128 }, // Task
          { indent: 0, width: 192 }, // Group
          { indent: 1, width: 144 }, // Task
        ].map((item, i) => (
          <Box
            key={i}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              pl: item.indent * 3,
            }}
          >
            <Skeleton variant="rounded" width={20} height={20} />
            <Skeleton variant="rounded" width={item.width} height={32} />
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

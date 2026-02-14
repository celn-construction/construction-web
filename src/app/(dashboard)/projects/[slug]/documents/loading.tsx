import { Box, Skeleton, Stack } from '@mui/material';

export default function DocumentsLoading() {
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
      {/* Tree skeleton with indentation */}
      <Stack spacing={1}>
        {[
          { indent: 0, width: 192 },
          { indent: 1, width: 160 },
          { indent: 1, width: 176 },
          { indent: 2, width: 144 },
          { indent: 0, width: 208 },
          { indent: 1, width: 176 },
          { indent: 1, width: 160 },
          { indent: 2, width: 128 },
          { indent: 2, width: 144 },
          { indent: 0, width: 192 },
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

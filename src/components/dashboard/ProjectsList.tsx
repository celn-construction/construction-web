import { Maximize2, CheckCircle2 } from 'lucide-react';
import { ImageWithFallback } from '@/components/ui/image-with-fallback';
import { Box, Typography, Paper, IconButton, Stack, Avatar, Divider } from '@mui/material';

const projects = [
  {
    id: '1',
    name: 'Downtown Tower Construction',
    description: 'Steel & concrete framework',
    timeframe: 'Today 08:00 AM - 03:00 PM',
    completed: true,
    assignees: [
      '/images/avatar-1.jpg',
      '/images/avatar-2.jpg',
    ],
  },
  {
    id: '2',
    name: 'Residential Complex Phase 2',
    description: 'Interior finishing work',
    timeframe: 'Today 09:00 AM - 05:00 PM',
    completed: false,
    assignees: [
      '/images/avatar-3.jpg',
      '/images/avatar-4.jpg',
    ],
  },
];

export default function ProjectsList() {
  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: 'card.background',
        borderRadius: '12px',
        p: 3,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 500, color: 'text.primary' }}>
            Active Projects
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Wednesday, 11 May
          </Typography>
        </Box>
        <IconButton
          sx={{
            width: 40,
            height: 40,
            bgcolor: 'action.hover',
            borderRadius: '8px',
            '&:hover': {
              bgcolor: 'action.selected',
            },
          }}
        >
          <Maximize2 size={20} />
        </IconButton>
      </Box>

      <Stack spacing={2} divider={<Divider />}>
        {projects.map((project) => (
          <Box key={project.id}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                mb: 1,
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography
                  sx={{
                    color: 'text.primary',
                    mb: 0.5,
                    textDecoration: project.completed ? 'line-through' : 'none',
                  }}
                >
                  {project.name}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {project.description}
                </Typography>
              </Box>
              {project.completed && (
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: 'action.hover',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CheckCircle2 size={20} />
                </Box>
              )}
            </Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {project.timeframe}
              </Typography>
              <Box sx={{ display: 'flex', ml: -1 }}>
                {project.assignees.map((avatar, idx) => (
                  <Avatar
                    key={idx}
                    src={avatar}
                    alt="Team member"
                    sx={{
                      width: 28,
                      height: 28,
                      border: 2,
                      borderColor: 'card.background',
                      ml: -1,
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}

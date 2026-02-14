"use client";

import { useState } from "react";
import { Box, Typography, Button, Paper } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AddProjectDialog from "~/components/projects/AddProjectDialog";

export function NoProjectPrompt() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100vh - 64px)",
        p: 3,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 6,
          maxWidth: 500,
          textAlign: "center",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="h4" gutterBottom fontWeight={600}>
          Create Your First Project
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Get started by creating your first project. Projects help you organize
          tasks, track timelines, and collaborate with your team.
        </Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          Create Project
        </Button>
      </Paper>

      <AddProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </Box>
  );
}

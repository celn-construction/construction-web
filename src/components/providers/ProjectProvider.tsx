"use client";

import { createContext, useContext, type ReactNode } from "react";

interface ProjectContextValue {
  projectId: string;
  projectSlug: string;
  projectName: string;
  organizationId: string;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: ProjectContextValue;
}) {
  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
}

export function useProjectContext(): ProjectContextValue {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProjectContext must be used within ProjectProvider");
  }
  return context;
}

export function useOptionalProjectContext(): ProjectContextValue | null {
  return useContext(ProjectContext);
}

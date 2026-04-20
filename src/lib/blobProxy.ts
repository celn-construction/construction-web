export function documentProxyUrl(documentId: string): string {
  return `/api/blob/${documentId}`;
}

export function projectImageProxyUrl(projectId: string): string {
  return `/api/blob/project-image/${projectId}`;
}

export function withProxyImageUrl<T extends { id: string; imageUrl: string | null }>(project: T): T {
  return project.imageUrl
    ? { ...project, imageUrl: projectImageProxyUrl(project.id) }
    : project;
}

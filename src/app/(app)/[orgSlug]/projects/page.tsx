import ProjectsView from "@/components/projects/ProjectsView";

export default async function ProjectsIndexPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  return <ProjectsView orgSlug={orgSlug} />;
}

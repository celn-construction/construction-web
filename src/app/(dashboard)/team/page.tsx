"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

export default function TeamRedirect() {
  const { data: activeProject } = api.project.getActive.useQuery();
  const router = useRouter();

  useEffect(() => {
    if (activeProject?.slug) {
      router.replace(`/projects/${activeProject.slug}/team`);
    }
  }, [activeProject, router]);

  return null;
}

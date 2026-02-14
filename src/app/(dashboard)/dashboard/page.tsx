"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

export default function DashboardRedirect() {
  const { data: activeProject } = api.project.getActive.useQuery();
  const router = useRouter();

  useEffect(() => {
    if (activeProject?.slug) {
      router.replace(`/projects/${activeProject.slug}/dashboard`);
    }
  }, [activeProject, router]);

  return null;
}

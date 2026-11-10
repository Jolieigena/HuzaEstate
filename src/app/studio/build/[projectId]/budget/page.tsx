"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBuildProjectContext } from "@/components/build/BuildProjectContext";

// There is no budget page any more; old links land on the download step.
export default function BudgetPage() {
  const project = useBuildProjectContext();
  const router = useRouter();
  useEffect(() => {
    router.replace(`/studio/build/${project.id}/summary`);
  }, [project.id, router]);
  return null;
}

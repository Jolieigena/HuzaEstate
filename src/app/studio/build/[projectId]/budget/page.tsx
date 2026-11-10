"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBuildProjectContext } from "@/components/build/BuildProjectContext";

// The budget is part of the "Budget and download" step, on the same page as the design.
export default function BudgetPage() {
  const project = useBuildProjectContext();
  const router = useRouter();
  useEffect(() => {
    router.replace(`/studio/build/${project.id}/summary`);
  }, [project.id, router]);
  return null;
}

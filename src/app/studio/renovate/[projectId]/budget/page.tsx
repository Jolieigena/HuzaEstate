"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRenovationProjectContext } from "@/components/renovate/RenovationProjectContext";

// There is no budget page any more; old links land on the project.
export default function BudgetPage() {
  const project = useRenovationProjectContext();
  const router = useRouter();
  useEffect(() => {
    router.replace(`/studio/renovate/${project.id}`);
  }, [project.id, router]);
  return null;
}

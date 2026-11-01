"use client";

import { use } from "react";
import { DesignBriefEditPage } from "@/components/admin/pages/DesignBriefs";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <DesignBriefEditPage id={id} />;
}

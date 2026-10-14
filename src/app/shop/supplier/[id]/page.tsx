"use client";

import { use } from "react";
import StorefrontPage from "@/components/shop/StorefrontPage";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <StorefrontPage supplierId={id} />;
}

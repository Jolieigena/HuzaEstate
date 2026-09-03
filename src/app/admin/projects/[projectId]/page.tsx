import { ProjectDetailPage } from "@/components/admin/pages/Projects";

export default async function Page({ params, searchParams }: { params: Promise<{ projectId: string }>; searchParams: Promise<{ module?: string }> }) {
  const { projectId } = await params;
  const { module } = await searchParams;
  return <ProjectDetailPage projectId={decodeURIComponent(projectId)} module={module === "renovate" ? "renovate" : "build"} />;
}

import RequireAuth from "@/components/shared/RequireAuth";

export default function ContractsLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}

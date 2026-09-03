import RequireAuth from "@/components/shared/RequireAuth";

export default function InvoicesLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}

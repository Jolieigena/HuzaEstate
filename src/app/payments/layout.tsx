import RequireAuth from "@/components/shared/RequireAuth";

export default function PaymentsLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}

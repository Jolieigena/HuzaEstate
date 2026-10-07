import SupplierShell from "@/components/supplier/SupplierShell";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <SupplierShell>{children}</SupplierShell>;
}

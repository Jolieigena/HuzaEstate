import ShopNav from "@/components/shop/ShopNav";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ShopNav />
      {children}
    </>
  );
}

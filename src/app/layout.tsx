import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";
import ConditionalFooter from "@/components/ConditionalFooter";
import { AuthProvider } from "@/lib/auth-context";
import { ToastProvider } from "@/lib/toast-context";

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
  weight: ["200", "300", "400", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "HuzaEstate",
  description: "Real Estate platform for Rwanda",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${nunitoSans.variable} font-sans antialiased min-h-screen flex flex-col`}
      >
        <AuthProvider>
          <ToastProvider>
            <AppShell>{children}</AppShell>
            <ConditionalFooter />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

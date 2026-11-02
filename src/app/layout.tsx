import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import AppShell from "@/components/AppShell";
import ConditionalFooter from "@/components/ConditionalFooter";
import NavigationTracker from "@/components/NavigationTracker";
import AddRoleHost from "@/components/shared/AddRoleHost";
import VisitTracker from "@/components/analytics/VisitTracker";
import { AuthProvider } from "@/lib/auth-context";
import { ToastProvider } from "@/lib/toast-context";

// Nunito Sans is kept in the project (the Latin letters, every weight from 200 to 900) rather than fetched from Google when the site
// is built, so a build never fails because Google Fonts could not be reached.
const nunitoSans = localFont({
  src: "./fonts/NunitoSans-latin-variable.woff2",
  variable: "--font-nunito-sans",
  weight: "200 900",
  display: "swap",
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
      {/* Browser extensions (e.g. Grammarly's data-gr-* attributes) modify <body>
          before hydration; this only silences attribute mismatches on <body> itself. */}
      <body
        className={`${nunitoSans.variable} font-sans antialiased min-h-screen flex flex-col`}
        suppressHydrationWarning
      >
        <NavigationTracker />
        <AuthProvider>
          <VisitTracker />
          <ToastProvider>
            <AppShell>{children}</AppShell>
            <ConditionalFooter />
            <AddRoleHost />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

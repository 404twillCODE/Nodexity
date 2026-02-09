import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SystemTopBar, SystemFooter } from "@/components/SystemFrame";
import { WebsiteSettingsProvider } from "@/components/WebsiteSettingsProvider";
import { getCurrentUser } from "@/lib/supabase/server";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nodexity",
  description: "Infrastructure management platform",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentUser = await getCurrentUser();

  return (
    <html lang="en" className={inter.variable}>
      <body>
        <WebsiteSettingsProvider>
          <div className="relative z-10 flex min-h-screen flex-col">
            <SystemTopBar userRole={currentUser?.role} />
            <main className="relative z-10 flex-1">{children}</main>
            <SystemFooter />
          </div>
        </WebsiteSettingsProvider>
      </body>
    </html>
  );
}

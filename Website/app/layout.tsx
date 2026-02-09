import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SystemTopBar, SystemFooter } from "@/components/SystemFrame";
import { WebsiteSettingsProvider } from "@/components/WebsiteSettingsProvider";
import { BootCompleteProvider } from "@/components/BootCompleteContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nodexity",
  description: "Infrastructure management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="flex h-full flex-col overflow-hidden">
        <WebsiteSettingsProvider>
          <BootCompleteProvider>
            <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
              <SystemTopBar />
              <main className="relative z-10 flex-1">{children}</main>
              <SystemFooter />
            </div>
          </BootCompleteProvider>
        </WebsiteSettingsProvider>
      </body>
    </html>
  );
}

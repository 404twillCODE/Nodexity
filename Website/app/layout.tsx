import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SystemTopBar, SystemFooter } from "@/components/SystemFrame";
import { WebsiteSettingsProvider } from "@/components/WebsiteSettingsProvider";
import { SessionProvider } from "@/components/SessionProvider";

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
      <body>
        <SessionProvider>
          <WebsiteSettingsProvider>
            <div className="relative z-10 flex min-h-screen flex-col">
              <SystemTopBar />
              <main className="relative z-10 flex-1">{children}</main>
              <SystemFooter />
            </div>
          </WebsiteSettingsProvider>
        </SessionProvider>
      </body>
    </html>
  );
}


import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SystemTopBar, SystemFooter } from "@/components/SystemFrame";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hexnode",
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
        <div className="relative z-10 flex min-h-screen flex-col">
          <SystemTopBar />
          <main className="relative z-10 flex-1">{children}</main>
          <SystemFooter />
        </div>
      </body>
    </html>
  );
}


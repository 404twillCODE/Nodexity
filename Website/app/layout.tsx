import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ResourcePoolConfigProvider } from "@/components/context/ResourcePoolConfigContext";

export const metadata: Metadata = {
  metadataBase: new URL('https://hexnode.com'),
  title: {
    default: "HEXNODE — Resources, not restrictions",
    template: "%s | HEXNODE",
  },
  description: "Resource-based Minecraft hosting. Buy a pool of resources and deploy servers without limits.",
  applicationName: "HEXNODE",
  openGraph: {
    title: "HEXNODE",
    description: "Resource-based Minecraft hosting. Buy a pool of resources and deploy servers without limits.",
    type: "website",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/logo.png", type: "image/png" },
    ],
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground font-sans antialiased">
        <ResourcePoolConfigProvider>
          <Navbar />
          {children}
          <Footer />
        </ResourcePoolConfigProvider>
      </body>
    </html>
  );
}


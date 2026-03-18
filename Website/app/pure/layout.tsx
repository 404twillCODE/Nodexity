import type { Metadata } from "next";

const PAGE_URL = "https://nodexity.com/pure";
const PAGE_DESCRIPTION =
  "Build a clean, optimized Minecraft FPS modpack for Modrinth in minutes with Nodexity Pure FPS.";

export const metadata: Metadata = {
  title: "Pure FPS",
  description: PAGE_DESCRIPTION,
  openGraph: {
    title: "Pure FPS | Nodexity",
    description: PAGE_DESCRIPTION,
    url: PAGE_URL,
  },
  twitter: {
    title: "Pure FPS | Nodexity",
    description: PAGE_DESCRIPTION,
  },
};

export default function PureLayout({ children }: { children: React.ReactNode }) {
  return children;
}

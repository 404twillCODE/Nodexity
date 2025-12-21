import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Server Details",
  description: "View and manage your HEXNODE server details.",
};

export default function ServerDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}


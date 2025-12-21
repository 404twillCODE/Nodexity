import type { Metadata } from "next";
import { ServerProvider } from "@/components/context/ServerContext";
import FloatingAssistant from "@/components/assistant/FloatingAssistant";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Manage your HEXNODE infrastructure, resource pools, and servers.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ServerProvider>
      <div className="pt-16">
        {children}
      </div>
      <FloatingAssistant />
    </ServerProvider>
  );
}


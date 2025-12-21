import type { Metadata } from "next";
import { ServerProvider } from "@/components/context/ServerContext";
import { AssistantProvider } from "@/components/context/AssistantContext";
import FloatingAssistant from "@/components/assistant/FloatingAssistant";
import DashboardSidebar from "@/components/DashboardSidebar";
import PageTransition from "@/components/PageTransition";

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
      <AssistantProvider>
        <div className="flex min-h-screen bg-background pt-16">
          <DashboardSidebar />
          <main className="flex-1 ml-60">
            <PageTransition>
              {children}
            </PageTransition>
          </main>
        </div>
        <FloatingAssistant />
      </AssistantProvider>
    </ServerProvider>
  );
}


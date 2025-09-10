"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { ReportProvider } from "@/context/ReportContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <ReportProvider>
        {children}
      </ReportProvider>
    </SidebarProvider>
  );
}

"use client"

import { useEffect } from 'react';
import { AppSidebar } from "./sidebar"
import { Header } from "./header"
import { SubHeader } from "./sub-header"
import { SidebarProvider, SidebarInset, useSidebar } from "@/components/ui/shadcn/sidebar"
import { useSettingsStore } from '@/stores'

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  user?: {
    name: string;
    email: string;
    avatar: string;
  };
}

// Componente interno para sincronizar o estado do sidebar
const SidebarSync = ({ children, title, user }: MainLayoutProps) => {
  const sidebarCollapsed = useSettingsStore((s) => s.sidebarCollapsed);
  const sidebarManuallyCollapsed = useSettingsStore((s) => s.sidebarManuallyCollapsed);
  const toggleSidebar = useSettingsStore((s) => s.toggleSidebar);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const { setOpen } = useSidebar();

  // Sincronizar o estado do sidebar quando o store mudar
  useEffect(() => {
    setOpen(!sidebarCollapsed);
  }, [sidebarCollapsed, setOpen]);

  // Handle hover behavior - only works if sidebar was manually collapsed by user
  const handleHover = (shouldCollapse: boolean) => {
    // Only apply hover behavior if the sidebar was manually collapsed by the user
    if (sidebarManuallyCollapsed) {
      updateSettings({ sidebarCollapsed: shouldCollapse });
    }
  };

  return (
    <>
      <AppSidebar
        isCollapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        onHover={handleHover}
        isManuallyCollapsed={sidebarManuallyCollapsed}
      />
      <SidebarInset className="h-screen flex flex-col overflow-hidden">
        <Header
          title={title}
          user={user}
          onMenuToggle={toggleSidebar}
          isSidebarCollapsed={sidebarCollapsed}
        />
        <SubHeader />
        <main className="flex flex-1 flex-col gap-4 overflow-y-auto">
          {children}
        </main>
      </SidebarInset>
    </>
  );
};

export const MainLayout = ({ children, title, user }: MainLayoutProps) => {
  // Usar o store para o estado do menu
  const sidebarCollapsed = useSettingsStore((s) => s.sidebarCollapsed);

  return (
    <SidebarProvider
      defaultOpen={!sidebarCollapsed}
    >
      <SidebarSync title={title} user={user}>
        {children}
      </SidebarSync>
    </SidebarProvider>
  );
};

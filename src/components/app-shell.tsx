"use client";

import { TaskProvider } from "@/lib/task-context";
import { Sidebar, TopBar, BottomNav, FAB } from "./navigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <TaskProvider>
      <TopBar />
      <Sidebar />
      <main className="pt-[60px] md:pt-0 md:pl-64 min-h-screen flex flex-col pb-24 md:pb-0">
        {children}
      </main>
      <FAB />
      <BottomNav />
    </TaskProvider>
  );
}

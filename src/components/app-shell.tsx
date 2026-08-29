"use client";

import { usePathname } from "next/navigation";
import { TaskProvider } from "@/lib/task-context";
import { SocialProvider } from "@/lib/social-context";
import { Sidebar, TopBar, BottomNav } from "./navigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/auth");

  if (isAuthPage) {
    return <main className="min-h-screen bg-background">{children}</main>;
  }

  return (
    <TaskProvider>
      <SocialProvider>
        <TopBar />
        <Sidebar />
        <main className="pt-[60px] md:pt-0 md:pl-64 min-h-screen flex flex-col pb-24 md:pb-0">
          {children}
        </main>
        <BottomNav />
      </SocialProvider>
    </TaskProvider>
  );
}

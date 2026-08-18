"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTaskContext } from "@/lib/task-context";

const NAV_ITEMS = [
  { href: "/", icon: "dashboard", label: "Beranda" },
  { href: "/calendar", icon: "calendar_month", label: "Kalender" },
  { href: "/matrix", icon: "grid_view", label: "Matriks" },
  { href: "/task/new", icon: "add_box", label: "Tugas" },
];

function NavIcon({ icon, filled }: { icon: string; filled: boolean }) {
  return (
    <span
      className="material-symbols-outlined"
      style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
    >
      {icon}
    </span>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { profile } = useTaskContext();
  const isConnected = Boolean(profile?.telegram_chat_id);

  return (
    <nav className="hidden md:flex flex-col fixed left-0 top-0 h-full z-40 bg-surface text-primary border-r-2 border-primary shadow-[4px_0px_0px_0px_rgba(0,0,0,1)] w-64">
      <div className="p-4 border-b-2 border-primary mb-4">
        <h1 className="text-[48px] leading-[52px] font-black tracking-widest text-primary" style={{ letterSpacing: "-0.02em" }}>
          SEE ME
        </h1>
        <p className="text-[14px] leading-[16px] uppercase font-bold text-on-surface-variant tracking-[0.05em]">
          Manifesto Produktivitas
        </p>
      </div>
      <div className="flex-1 flex flex-col gap-2 px-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 p-3 text-[14px] leading-[16px] uppercase font-bold tracking-[0.05em] transition-all ${
                active
                  ? "bg-secondary-container text-on-secondary-container border-2 border-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1"
                  : "text-on-surface-variant hover:bg-surface-container-low hover:translate-x-1 transition-transform"
              }`}
            >
              <NavIcon icon={item.icon === "add_box" ? "add_circle" : item.icon} filled={active} />
              {item.label === "Tugas" ? "Tugas Baru" : item.label}
            </Link>
          );
        })}
      </div>
      <div className="px-2 pb-4 mt-auto">
        {isConnected ? (
          <div className="w-full py-2.5 mb-4 bg-category-green text-on-primary text-[12px] leading-[14px] uppercase font-bold tracking-[0.05em] neo-border flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              check_circle
            </span>
            Telegram Terhubung
          </div>
        ) : (
          <Link
            href="/settings"
            className="w-full py-3 mb-4 bg-priority-delegate text-on-primary text-[14px] leading-[16px] uppercase font-bold tracking-[0.05em] neo-border-3 neo-shadow active-press flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">sync</span>
            Hubungkan Telegram
          </Link>
        )}
        <div className="flex flex-col gap-2 border-t-2 border-primary pt-4">
          <Link
            href="/settings"
            className="flex items-center gap-3 p-2 text-on-surface-variant hover:bg-surface-container-low text-[14px] leading-[16px] uppercase font-bold tracking-[0.05em] hover:translate-x-1 transition-transform"
          >
            <span className="material-symbols-outlined">settings</span>
            Pengaturan
          </Link>
          <button className="flex items-center gap-3 p-2 text-on-surface-variant hover:bg-surface-container-low text-[14px] leading-[16px] uppercase font-bold tracking-[0.05em] hover:translate-x-1 transition-transform text-left">
            <span className="material-symbols-outlined">archive</span>
            Arsip
          </button>
        </div>
      </div>
    </nav>
  );
}

export function TopBar() {
  return (
    <header className="md:hidden fixed top-0 left-0 w-full z-50 flex justify-between items-center px-[16px] h-[44px] bg-surface border-b-2 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="text-[24px] leading-[28px] font-bold uppercase tracking-tighter text-primary">
        SEE ME REMINDER
      </div>
      <div className="flex gap-4">
        <span className="material-symbols-outlined text-primary hover:bg-secondary-container transition-transform active:translate-x-1 active:translate-y-1 p-1 cursor-pointer">
          notifications
        </span>
        <Link href="/settings">
          <span className="material-symbols-outlined text-primary hover:bg-secondary-container transition-transform active:translate-x-1 active:translate-y-1 p-1 cursor-pointer">
            settings
          </span>
        </Link>
      </div>
    </header>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 bg-surface border-t-2 border-primary h-[64px]">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center p-1 w-full h-full text-[12px] leading-[14px] font-bold uppercase transition-all ${
              active
                ? "bg-secondary-container text-on-secondary-container border-2 border-primary"
                : "text-on-surface-variant hover:bg-surface-container-high active:translate-y-1"
            }`}
          >
            <NavIcon icon={item.icon} filled={active} />
            <span className="mt-1">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function FAB() {
  return (
    <Link
      href="/task/new"
      className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-primary text-on-primary rounded-full flex items-center justify-center neo-border-3 neo-shadow active-press z-40"
    >
      <span className="material-symbols-outlined text-[32px]">add</span>
    </Link>
  );
}

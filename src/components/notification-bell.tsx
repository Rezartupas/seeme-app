"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSocialContext } from "@/lib/social-context";

export function NotificationBell() {
  const { notifications, unreadCount, markAllRead } = useSocialContext();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleOpen = async () => {
    setOpen((v) => !v);
    if (!open && unreadCount > 0) await markAllRead();
  };

  const handleNotifClick = (n: (typeof notifications)[0]) => {
    setOpen(false);
    if (n.type === "friend_request" || n.type === "friend_accepted") {
      router.push("/friends");
    } else if (n.activityId) {
      // Navigate to friend's calendar — we don't have the friend id here,
      // so navigate to /friends and let the user drill in.
      router.push("/friends");
    }
  };

  const typeLabel: Record<string, string> = {
    friend_request: "Permintaan pertemanan",
    friend_accepted: "Menerima pertemanan Anda",
    comment: "Berkomentar pada aktivitas",
    reaction: "Bereaksi pada aktivitas",
  };

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="relative p-1 text-primary hover:bg-secondary-container transition-transform active:translate-x-1 active:translate-y-1 flex items-center justify-center cursor-pointer"
        title={unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : "Tidak ada notifikasi baru"}
        aria-label="Notifikasi"
      >
        <span
          className="material-symbols-outlined text-[24px]"
          style={unreadCount > 0 ? { fontVariationSettings: "'FILL' 1" } : undefined}
        >
          notifications
        </span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-error text-on-error text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-primary animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-surface border-2 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50 max-h-96 overflow-y-auto">
          <div className="p-3 border-b-2 border-primary flex justify-between items-center">
            <span className="text-[14px] font-bold uppercase tracking-[0.05em]">Notifikasi</span>
            <button
              onClick={() => setOpen(false)}
              className="material-symbols-outlined text-[18px] hover:text-error cursor-pointer"
            >
              close
            </button>
          </div>
          {notifications.length === 0 ? (
            <div className="p-4 text-[13px] text-on-surface-variant text-center">
              Belum ada notifikasi
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleNotifClick(n)}
                className={`w-full text-left px-3 py-2 border-b border-outline-variant hover:bg-surface-container-low transition-colors cursor-pointer ${
                  !n.isRead ? "bg-secondary-container" : ""
                }`}
              >
                <div className="text-[12px] font-bold uppercase tracking-[0.03em]">
                  {typeLabel[n.type] ?? n.type}
                </div>
                <div className="text-[11px] text-on-surface-variant mt-0.5">
                  {new Date(n.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

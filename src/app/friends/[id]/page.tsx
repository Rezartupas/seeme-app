"use client";

import { use } from "react";
import Link from "next/link";
import { useTaskContext } from "@/lib/task-context";
import { FriendCalendar } from "@/components/friend-calendar";

export default function FriendCalendarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: friendId } = use(params);
  const { user } = useTaskContext();

  if (!user) {
    return (
      <div className="flex-1 p-8 text-center text-on-surface-variant uppercase text-[13px] font-bold">
        Memuat…
      </div>
    );
  }

  return (
    <div className="flex-1 p-[16px] md:p-[32px] w-full max-w-4xl mx-auto flex flex-col gap-6 mt-4 md:mt-8">
      {/* Back */}
      <Link
        href="/friends"
        className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.05em] text-on-surface-variant hover:text-primary transition-colors w-fit"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Kembali ke Teman
      </Link>

      {/* Header */}
      <div className="relative">
        <div className="absolute -top-5 -left-5 bg-secondary-container border-2 border-primary p-2 text-[18px] leading-[22px] font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-10 transform -rotate-1 uppercase">
          KALENDER TEMAN
        </div>
        <div className="bg-surface-container-lowest p-6 neo-border-3 neo-shadow-lg mt-4">
          <FriendCalendar friendId={friendId} currentUserId={user.id} />
        </div>
      </div>
    </div>
  );
}

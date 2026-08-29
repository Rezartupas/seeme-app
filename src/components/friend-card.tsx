"use client";

import { useRouter } from "next/navigation";
import { Friendship } from "@/lib/types";
import { useSocialContext } from "@/lib/social-context";

interface FriendCardProps {
  friendship: Friendship;
  currentUserId: string;
}

export function FriendCard({ friendship, currentUserId }: FriendCardProps) {
  const { unfriend } = useSocialContext();
  const router = useRouter();
  const friendId =
    friendship.requesterId === currentUserId
      ? friendship.addresseeId
      : friendship.requesterId;

  return (
    <div className="flex items-center justify-between p-3 bg-surface-container-low border-2 border-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
      <button
        onClick={() => router.push(`/friends/${friendId}`)}
        className="flex items-center gap-3 flex-1 text-left hover:opacity-80 transition-opacity"
      >
        <span className="material-symbols-outlined text-[32px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
          account_circle
        </span>
        <span className="text-[14px] font-bold uppercase tracking-[0.04em] truncate">
          {friendId.slice(0, 8)}…
        </span>
      </button>
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.push(`/friends/${friendId}`)}
          className="p-1.5 border-2 border-primary bg-secondary-container shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
          title="Lihat kalender"
        >
          <span className="material-symbols-outlined text-[18px]">calendar_month</span>
        </button>
        <button
          onClick={() => unfriend(friendship.id)}
          className="p-1.5 border-2 border-primary bg-error-container shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
          title="Hapus teman"
        >
          <span className="material-symbols-outlined text-[18px] text-error">person_remove</span>
        </button>
      </div>
    </div>
  );
}

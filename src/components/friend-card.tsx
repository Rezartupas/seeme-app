"use client";

import { useState } from "react";
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
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const friendId =
    friendship.requesterId === currentUserId
      ? friendship.addresseeId
      : friendship.requesterId;
  const profile = friendship.friendProfile;
  const displayName = profile?.name || (profile?.username ? `@${profile.username}` : `${friendId.slice(0, 8)}…`);

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await unfriend(friendship.id);
      setShowConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between p-3 bg-surface-container-low border-2 border-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
        <button
          onClick={() => router.push(`/friends/${friendId}`)}
          className="flex items-center gap-3 flex-1 text-left hover:opacity-80 transition-opacity min-w-0"
        >
          <span className="material-symbols-outlined text-[32px] text-primary shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
            account_circle
          </span>
          <div className="min-w-0">
            <div className="text-[14px] font-bold uppercase tracking-[0.04em] truncate">
              {displayName}
            </div>
            {profile?.username && profile.name && (
              <div className="text-[11px] text-on-surface-variant">@{profile.username}</div>
            )}
          </div>
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
            onClick={() => setShowConfirm(true)}
            className="p-1.5 border-2 border-primary bg-error-container shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
            title="Hapus teman"
          >
            <span className="material-symbols-outlined text-[18px] text-error">person_remove</span>
          </button>
        </div>
      </div>

      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeleting) setShowConfirm(false);
          }}
        >
          <div className="w-full max-w-sm bg-surface border-2 border-primary shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-5">
            <div className="flex items-center gap-2 text-error mb-3">
              <span className="material-symbols-outlined text-[24px]">warning</span>
              <h3 className="text-[16px] font-black uppercase tracking-tight text-primary">
                Hapus Pertemanan?
              </h3>
            </div>
            <p className="text-[14px] text-on-surface leading-[20px] mb-5">
              Apakah Anda yakin ingin menghapus <strong className="font-bold text-primary">{displayName}</strong> dari daftar teman?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 border-2 border-primary bg-surface-container-highest text-[13px] font-bold uppercase tracking-[0.04em] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 border-2 border-primary bg-error text-white text-[13px] font-bold uppercase tracking-[0.04em] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50"
              >
                {isDeleting ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

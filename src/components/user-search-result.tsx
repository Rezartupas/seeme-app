"use client";

import { useState } from "react";
import { PublicProfile } from "@/lib/types";
import { useSocialContext } from "@/lib/social-context";

interface UserSearchResultProps {
  profile: PublicProfile;
  existingFriendshipId?: string;
  isPending?: boolean;
}

export function UserSearchResult({ profile, existingFriendshipId, isPending }: UserSearchResultProps) {
  const { sendFriendRequest, cancelFriendRequest } = useSocialContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    setLoading(true);
    setError(null);
    try {
      await sendFriendRequest(profile.id);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("duplicate") || msg.includes("unique")) {
        setError("Permintaan sudah dikirim sebelumnya");
      } else {
        setError("Gagal mengirim permintaan");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!existingFriendshipId) return;
    setLoading(true);
    try {
      await cancelFriendRequest(existingFriendshipId);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-surface-container-low border-2 border-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="material-symbols-outlined text-[32px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
          account_circle
        </span>
        <div>
          <div className="text-[14px] font-bold uppercase tracking-[0.04em] truncate">
            {profile.name ?? profile.username ?? profile.email ?? profile.id.slice(0, 8)}
          </div>
          {profile.username && (
            <div className="text-[11px] text-on-surface-variant">@{profile.username}</div>
          )}
          {!profile.username && profile.email && (
            <div className="text-[11px] text-on-surface-variant truncate">{profile.email}</div>
          )}
        </div>
      </div>
      <div className="ml-2">
        {error && (
          <div className="text-[11px] text-error font-bold mb-1">{error}</div>
        )}
        {isPending ? (
          <button
            onClick={handleCancel}
            disabled={loading}
            className="px-3 py-1.5 border-2 border-primary bg-surface text-[12px] font-bold uppercase tracking-[0.04em] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all disabled:opacity-50"
          >
            Batalkan
          </button>
        ) : (
          <button
            onClick={handleAdd}
            disabled={loading}
            className="px-3 py-1.5 border-2 border-primary bg-secondary-container text-[12px] font-bold uppercase tracking-[0.04em] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">person_add</span>
            Tambah
          </button>
        )}
      </div>
    </div>
  );
}

"use client";

import { Friendship } from "@/lib/types";
import { useSocialContext } from "@/lib/social-context";

interface FriendRequestItemProps {
  friendship: Friendship;
  direction: "incoming" | "outgoing";
}

export function FriendRequestItem({ friendship, direction }: FriendRequestItemProps) {
  const { acceptFriendRequest, rejectFriendRequest, cancelFriendRequest } = useSocialContext();
  const profile = friendship.friendProfile;
  const fallbackId = direction === "incoming" ? friendship.requesterId : friendship.addresseeId;
  const displayName = profile?.name || (profile?.username ? `@${profile.username}` : `${fallbackId.slice(0, 8)}…`);

  return (
    <div className="flex items-center justify-between p-3 bg-surface-container-low border-2 border-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="material-symbols-outlined text-[32px] text-primary shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
          account_circle
        </span>
        <div className="min-w-0">
          <div className="text-[13px] font-bold uppercase tracking-[0.04em] truncate">
            {displayName}
          </div>
          <div className="text-[11px] text-on-surface-variant uppercase tracking-[0.03em]">
            {direction === "incoming" ? "Ingin berteman dengan Anda" : "Permintaan dikirim"}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 ml-2">
        {direction === "incoming" ? (
          <>
            <button
              onClick={() => acceptFriendRequest(friendship.id, friendship.requesterId)}
              className="px-3 py-1.5 border-2 border-primary bg-category-green text-on-primary text-[12px] font-bold uppercase tracking-[0.04em] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
            >
              Terima
            </button>
            <button
              onClick={() => rejectFriendRequest(friendship.id)}
              className="px-3 py-1.5 border-2 border-primary bg-error-container text-error text-[12px] font-bold uppercase tracking-[0.04em] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
            >
              Tolak
            </button>
          </>
        ) : (
          <button
            onClick={() => cancelFriendRequest(friendship.id)}
            className="px-3 py-1.5 border-2 border-primary bg-surface text-on-surface text-[12px] font-bold uppercase tracking-[0.04em] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
          >
            Batalkan
          </button>
        )}
      </div>
    </div>
  );
}

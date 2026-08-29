"use client";

import { useState, useEffect } from "react";
import { useSocialContext } from "@/lib/social-context";
import { useTaskContext } from "@/lib/task-context";
import { PublicProfile } from "@/lib/types";
import { FriendCard } from "@/components/friend-card";
import { FriendRequestItem } from "@/components/friend-request-item";
import { UserSearchResult } from "@/components/user-search-result";

export default function FriendsPage() {
  const { user } = useTaskContext();
  const {
    friends,
    incomingRequests,
    outgoingRequests,
    searchUsers,
  } = useSocialContext();

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PublicProfile[]>([]);
  const [searching, setSearching] = useState(false);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      const timer = setTimeout(() => {
        setSearchResults([]);
      }, 0);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      const results = await searchUsers(query);
      setSearchResults(results);
      setSearching(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [query, searchUsers]);

  // Build lookup sets for existing relationships
  const existingIds = new Set([
    ...friends.map((f) =>
      f.requesterId === user?.id ? f.addresseeId : f.requesterId
    ),
    ...incomingRequests.map((f) => f.requesterId),
    ...outgoingRequests.map((f) => f.addresseeId),
  ]);
  const pendingOutgoing = new Map(
    outgoingRequests.map((f) => [f.addresseeId, f.id])
  );

  // Filter search results: exclude self and already-friends
  const filteredResults = searchResults.filter((p) => !existingIds.has(p.id));

  return (
    <div className="flex-1 p-[16px] md:p-[32px] w-full max-w-3xl mx-auto flex flex-col gap-8 mt-4 md:mt-8">
      {/* Header */}
      <div className="relative">
        <div className="absolute -top-5 -left-5 bg-secondary-container border-2 border-primary p-2 text-[20px] leading-[24px] font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-10 transform -rotate-2 uppercase">
          TEMAN
        </div>
        <div className="bg-surface-container-lowest p-6 neo-border-3 neo-shadow-lg mt-4">
          {/* Search */}
          <div className="flex flex-col gap-2 mb-6">
            <label className="text-[14px] font-bold uppercase tracking-[0.05em] flex items-center gap-2">
              <span className="material-symbols-outlined">search</span>
              Cari Pengguna
            </label>
            <input
              className="bg-surface-container-low p-3 text-[16px] neo-input w-full placeholder-outline"
              type="text"
              placeholder="Nama, username, atau email..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {/* Search results */}
          {(searching || filteredResults.length > 0) && (
            <div className="flex flex-col gap-2 mb-6">
              <div className="text-[12px] font-bold uppercase tracking-[0.05em] text-on-surface-variant mb-1">
                Hasil Pencarian
              </div>
              {searching && (
                <div className="text-[13px] text-on-surface-variant p-3">Mencari…</div>
              )}
              {!searching && filteredResults.length === 0 && query.trim() && (
                <div className="text-[13px] text-on-surface-variant p-3">Tidak ada hasil</div>
              )}
              {filteredResults.map((p) => (
                <UserSearchResult
                  key={p.id}
                  profile={p}
                  isPending={pendingOutgoing.has(p.id)}
                  existingFriendshipId={pendingOutgoing.get(p.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Incoming requests */}
      {incomingRequests.length > 0 && (
        <section>
          <div className="text-[16px] font-black uppercase tracking-[0.05em] mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              person_add
            </span>
            Permintaan Masuk ({incomingRequests.length})
          </div>
          <div className="flex flex-col gap-2">
            {incomingRequests.map((f) => (
              <FriendRequestItem key={f.id} friendship={f} direction="incoming" />
            ))}
          </div>
        </section>
      )}

      {/* Outgoing requests */}
      {outgoingRequests.length > 0 && (
        <section>
          <div className="text-[16px] font-black uppercase tracking-[0.05em] mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined">pending</span>
            Permintaan Dikirim ({outgoingRequests.length})
          </div>
          <div className="flex flex-col gap-2">
            {outgoingRequests.map((f) => (
              <FriendRequestItem key={f.id} friendship={f} direction="outgoing" />
            ))}
          </div>
        </section>
      )}

      {/* Friends list */}
      <section>
        <div className="text-[16px] font-black uppercase tracking-[0.05em] mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            group
          </span>
          Daftar Teman ({friends.length})
        </div>
        {friends.length === 0 ? (
          <div className="p-6 border-2 border-primary bg-surface-container-lowest text-center text-[14px] text-on-surface-variant uppercase tracking-[0.04em]">
            Belum ada teman. Cari pengguna di atas!
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {friends.map((f) => (
              <FriendCard
                key={f.id}
                friendship={f}
                currentUserId={user?.id ?? ""}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

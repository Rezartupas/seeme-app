"use client";

import { useState, useEffect, useCallback } from "react";
import { useSocialContext } from "@/lib/social-context";
import { Reaction } from "@/lib/types";

const EMOJIS = ["👍", "❤️", "🔥", "🎉", "💪", "👏"];

interface ReactionBarProps {
  activityId: string;
  ownerId: string;
  currentUserId: string;
}

export function ReactionBar({ activityId, ownerId, currentUserId }: ReactionBarProps) {
  const { getActivityReactions, toggleReaction } = useSocialContext();
  const [reactions, setReactions] = useState<Reaction[]>([]);

  const load = useCallback(async () => {
    const data = await getActivityReactions(activityId);
    setReactions(data);
  }, [activityId, getActivityReactions]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const data = await getActivityReactions(activityId);
      if (mounted) {
        setReactions(data);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [activityId, getActivityReactions]);

  const handleToggle = async (emoji: string) => {
    await toggleReaction(activityId, emoji, ownerId);
    await load();
  };

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {EMOJIS.map((emoji) => {
        const emojiReactions = reactions.filter((r) => r.emoji === emoji);
        const myReaction = emojiReactions.find((r) => r.userId === currentUserId);
        return (
          <button
            key={emoji}
            onClick={() => handleToggle(emoji)}
            className={`flex items-center gap-1 px-2 py-1 border-2 border-primary text-[14px] font-bold transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 ${
              myReaction
                ? "bg-secondary-container"
                : "bg-surface hover:bg-surface-container-low"
            }`}
            title={myReaction ? "Hapus reaksi" : "Tambah reaksi"}
          >
            <span>{emoji}</span>
            {emojiReactions.length > 0 && (
              <span className="text-[12px] font-black">{emojiReactions.length}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

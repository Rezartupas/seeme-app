"use client";

import { useState, useEffect, useCallback } from "react";
import { useSocialContext } from "@/lib/social-context";
import { Comment } from "@/lib/types";

interface CommentThreadProps {
  activityId: string;
  ownerId: string;
  currentUserId: string;
}

export function CommentThread({ activityId, ownerId, currentUserId }: CommentThreadProps) {
  const { getActivityComments, addComment } = useSocialContext();
  const [comments, setComments] = useState<Comment[]>([]);
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const data = await getActivityComments(activityId);
    setComments(data);
  }, [activityId, getActivityComments]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setSubmitting(true);
    try {
      await addComment(activityId, input.trim(), ownerId);
      setInput("");
      await load();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-4 border-t-2 border-outline-variant pt-4 flex flex-col gap-3">
      <div className="text-[12px] font-bold uppercase tracking-[0.05em] text-on-surface-variant">
        Komentar ({comments.length})
      </div>
      {comments.map((c) => (
        <div key={c.id} className="flex gap-2">
          <span
            className="material-symbols-outlined text-[24px] text-primary shrink-0"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            account_circle
          </span>
          <div className="flex-1 bg-surface-container-low border border-outline-variant p-2">
            <div className="text-[11px] text-on-surface-variant mb-1">
              {c.userId === currentUserId ? "Anda" : c.userId.slice(0, 8)}
              {" · "}
              {new Date(c.createdAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            <div className="text-[14px]">{c.content}</div>
          </div>
        </div>
      ))}
      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          className="flex-1 bg-surface-container-low p-2 text-[14px] neo-input placeholder-outline"
          placeholder="Tulis komentar…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={500}
        />
        <button
          type="submit"
          disabled={!input.trim() || submitting}
          className="px-4 py-2 border-2 border-primary bg-secondary-container font-bold text-[13px] uppercase tracking-[0.04em] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all disabled:opacity-50"
        >
          Kirim
        </button>
      </form>
    </div>
  );
}

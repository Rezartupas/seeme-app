"use client";

import { useEffect } from "react";
import { Activity } from "@/lib/types";
import { ReactionBar } from "./reaction-bar";
import { CommentThread } from "./comment-thread";

interface ActivityModalProps {
  activity: Activity;
  currentUserId: string;
  onClose: () => void;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ActivityModal({ activity, currentUserId, onClose }: ActivityModalProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg bg-surface border-2 border-primary shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-primary">
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 border border-primary ${
                activity.status === "completed" ? "bg-category-green" : "bg-priority-urgent"
              }`}
            />
            <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-on-surface-variant">
              {activity.status === "completed" ? "Selesai" : "Berlangsung"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="material-symbols-outlined text-[20px] hover:text-error transition-colors"
          >
            close
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          <h2 className="text-[20px] font-black uppercase tracking-tight mb-2">
            {activity.title}
          </h2>
          <div className="text-[13px] text-on-surface-variant flex flex-col gap-1 mb-3">
            <span>
              <span className="font-bold">Mulai:</span> {formatDateTime(activity.startTime)}
            </span>
            <span>
              <span className="font-bold">Selesai:</span> {formatDateTime(activity.endTime)}
            </span>
          </div>

          {/* Reactions */}
          <div className="border-t-2 border-outline-variant pt-3">
            <div className="text-[12px] font-bold uppercase tracking-[0.05em] text-on-surface-variant mb-1">
              Reaksi
            </div>
            <ReactionBar
              activityId={activity.id}
              ownerId={activity.userId}
              currentUserId={currentUserId}
            />
          </div>

          {/* Comments */}
          <CommentThread
            activityId={activity.id}
            ownerId={activity.userId}
            currentUserId={currentUserId}
          />
        </div>
      </div>
    </div>
  );
}

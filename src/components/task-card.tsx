"use client";

import { useState } from "react";
import { useTaskContext } from "@/lib/task-context";
import { Task, Category } from "@/lib/types";

export function TaskCheckbox({
  task,
  size = "md",
}: {
  task: Task;
  size?: "sm" | "md";
}) {
  const { toggleTask } = useTaskContext();
  const dim = size === "sm" ? "w-5 h-5" : "w-6 h-6";
  const done = task.status === "completed";

  return (
    <button
      onClick={() => toggleTask(task.id)}
      className={`${dim} neo-border-3 flex-shrink-0 cursor-pointer flex items-center justify-center transition-colors ${
        done ? "bg-primary text-on-primary" : "bg-surface-container-lowest"
      }`}
      aria-label={done ? "Tandai belum selesai" : "Tandai selesai"}
    >
      {done && (
        <span className="material-symbols-outlined text-[16px]">close</span>
      )}
    </button>
  );
}

export function CategoryChip({ category }: { category: Category }) {
  return (
    <span
      className="text-[12px] leading-[14px] font-bold uppercase px-2 py-1 neo-border text-on-primary"
      style={{ backgroundColor: category.color }}
    >
      {category.name}
    </span>
  );
}

export function PriorityChip({
  isImportant,
  isUrgent,
}: {
  isImportant: boolean;
  isUrgent: boolean;
}) {
  if (isImportant && isUrgent)
    return (
      <span className="text-[12px] leading-[14px] font-bold uppercase bg-priority-urgent text-on-primary px-2 py-1 neo-border">
        MENDESAK
      </span>
    );
  if (isImportant)
    return (
      <span className="text-[12px] leading-[14px] font-bold uppercase bg-priority-important text-primary px-2 py-1 neo-border">
        PENTING
      </span>
    );
  if (isUrgent)
    return (
      <span className="text-[12px] leading-[14px] font-bold uppercase bg-priority-delegate text-on-primary px-2 py-1 neo-border">
        DELEGASI
      </span>
    );
  return null;
}

export function TaskCard({
  task,
  variant = "default",
}: {
  task: Task;
  variant?: "default" | "overdue" | "upcoming";
}) {
  const { categories, deleteTask, rescheduleTask } = useTaskContext();
  const [showReschedule, setShowReschedule] = useState(false);
  const [customDate, setCustomDate] = useState("");

  const taskCats = categories.filter((c) => task.categoryIds.includes(c.id));
  const done = task.status === "completed";

  const getLocalDateStr = (offsetDays = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleReschedule = async (newDate: string) => {
    if (!newDate) return;
    await rescheduleTask(task.id, newDate);
    setShowReschedule(false);
  };

  return (
    <div
      className={`bg-surface-container-lowest p-4 neo-border flex flex-col gap-3 relative group hover:bg-surface-container-low transition-colors ${
        done ? "opacity-60" : ""
      }`}
    >
      <div className="flex gap-4 items-start w-full">
        <TaskCheckbox task={task} />
        <div className="flex-1 min-w-0">
          <h4
            className={`text-[18px] leading-[26px] font-medium text-primary mb-2 break-words ${
              done ? "line-through" : ""
            }`}
          >
            {task.title}
          </h4>
          {task.description && (
            <p className="text-[14px] text-on-surface-variant mb-2 break-words">
              {task.description}
            </p>
          )}
          <div className="flex flex-wrap gap-2 items-center">
            {taskCats.map((c) => (
              <CategoryChip key={c.id} category={c} />
            ))}
            {variant === "overdue" && (
              <span className="text-[12px] leading-[14px] font-bold text-error flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">
                  event_busy
                </span>
                {task.date}
              </span>
            )}
            {variant !== "overdue" && task.startTime && (
              <span className="text-[12px] leading-[14px] font-bold text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">
                  schedule
                </span>
                {task.startTime}
              </span>
            )}
            {task.reminderAt && (
              <span className="text-[12px] leading-[14px] font-bold text-priority-delegate flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">
                  notifications_active
                </span>
                {new Date(task.reminderAt).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
            {done && (
              <span className="text-[12px] leading-[14px] font-bold text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">
                  check_circle
                </span>
                Selesai
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {!done && (
            <button
              onClick={() => setShowReschedule(!showReschedule)}
              className={`p-1 transition-all cursor-pointer ${
                variant === "overdue"
                  ? "opacity-100 text-error hover:bg-error-container"
                  : "opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-primary"
              }`}
              title="Jadwalkan Ulang (Reschedule)"
              aria-label="Jadwalkan Ulang"
            >
              <span className="material-symbols-outlined text-[20px]">
                edit_calendar
              </span>
            </button>
          )}
          <button
            onClick={() => deleteTask(task.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-on-surface-variant hover:text-error cursor-pointer"
            title="Hapus tugas"
            aria-label="Hapus tugas"
          >
            <span className="material-symbols-outlined text-[20px]">delete</span>
          </button>
        </div>
      </div>

      {/* Reschedule Popover Panel */}
      {showReschedule && (
        <div className="bg-surface p-3 neo-border-3 neo-shadow-sm flex flex-col gap-2.5 mt-1 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-[12px] uppercase font-black tracking-wider text-primary flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">
                schedule
              </span>
              Jadwalkan Ulang Ke:
            </span>
            <button
              onClick={() => setShowReschedule(false)}
              className="text-on-surface-variant hover:text-primary"
              title="Tutup"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleReschedule(getLocalDateStr(0))}
              className="px-3 py-1.5 bg-secondary-container text-on-secondary-container font-bold uppercase text-[12px] neo-border active-press shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              Hari Ini
            </button>
            <button
              onClick={() => handleReschedule(getLocalDateStr(1))}
              className="px-3 py-1.5 bg-surface-container-high text-primary font-bold uppercase text-[12px] neo-border active-press shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              Besok
            </button>
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-primary/20">
            <input
              type="date"
              className="neo-input p-1.5 text-[12px] flex-1 bg-surface-container-low"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
            />
            <button
              disabled={!customDate}
              onClick={() => handleReschedule(customDate)}
              className="px-3 py-1.5 bg-primary text-on-primary font-bold uppercase text-[12px] neo-border disabled:opacity-40 active-press"
            >
              Set
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

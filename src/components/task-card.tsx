"use client";

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
  const { categories, deleteTask } = useTaskContext();
  const taskCats = categories.filter((c) => task.categoryIds.includes(c.id));
  const done = task.status === "completed";

  return (
    <div
      className={`bg-surface-container-lowest p-4 neo-border flex gap-4 items-start relative group hover:bg-surface-container-low transition-colors ${
        done ? "opacity-60" : ""
      }`}
    >
      <TaskCheckbox task={task} />
      <div className="flex-1">
        <h4
          className={`text-[18px] leading-[26px] font-medium text-primary mb-2 ${
            done ? "line-through" : ""
          }`}
        >
          {task.title}
        </h4>
        {task.description && (
          <p className="text-[14px] text-on-surface-variant mb-2">{task.description}</p>
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
              {new Date(task.reminderAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
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
      <button
        onClick={() => deleteTask(task.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-on-surface-variant hover:text-error cursor-pointer"
        title="Hapus tugas"
      >
        <span className="material-symbols-outlined text-[20px]">delete</span>
      </button>
    </div>
  );
}

"use client";

import { useTaskContext } from "@/lib/task-context";

const QUADRANTS = [
  {
    key: "q1",
    label: "Mendesak & Penting",
    sublabel: "Kerjakan Dulu",
    color: "bg-priority-urgent",
    textColor: "text-on-error",
    icon: "warning",
    tagClass: "-top-3 -left-3 rotate-[-5deg]",
  },
  {
    key: "q2",
    label: "Tidak Mendesak & Penting",
    sublabel: "Jadwalkan",
    color: "bg-priority-important",
    textColor: "text-on-primary-fixed",
    icon: "schedule",
    tagClass: "-top-3 -right-3 rotate-[5deg]",
  },
  {
    key: "q3",
    label: "Mendesak & Tidak Penting",
    sublabel: "Delegasikan",
    color: "bg-priority-delegate",
    textColor: "text-on-primary",
    icon: "forward_to_inbox",
    tagClass: "-bottom-3 -left-3 rotate-[3deg]",
  },
  {
    key: "q4",
    label: "Tidak Mendesak & Tidak Penting",
    sublabel: "Eliminasi",
    color: "bg-priority-low",
    textColor: "text-on-primary-fixed",
    icon: "delete",
    tagClass: "-bottom-3 -right-3 rotate-[-4deg]",
  },
] as const;

function getQuadrant(isImportant: boolean, isUrgent: boolean) {
  if (isImportant && isUrgent) return "q1";
  if (isImportant && !isUrgent) return "q2";
  if (!isImportant && isUrgent) return "q3";
  return "q4";
}

export default function MatrixPage() {
  const { tasks, toggleTask } = useTaskContext();

  const tasksByQuadrant = {
    q1: tasks.filter((t) => getQuadrant(t.isImportant, t.isUrgent) === "q1"),
    q2: tasks.filter((t) => getQuadrant(t.isImportant, t.isUrgent) === "q2"),
    q3: tasks.filter((t) => getQuadrant(t.isImportant, t.isUrgent) === "q3"),
    q4: tasks.filter((t) => getQuadrant(t.isImportant, t.isUrgent) === "q4"),
  };

  return (
    <div className="flex-1 p-[16px] md:p-[32px] min-h-screen pb-24 md:pb-[32px]">
      <header className="mb-8">
        <h2 className="text-[24px] md:text-[32px] leading-[28px] md:leading-[38px] font-bold text-primary uppercase border-b-4 border-primary inline-block pb-2">
          Matriks Eisenhower
        </h2>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px] md:gap-[32px] min-h-[600px]">
        {QUADRANTS.map((q) => {
          const qTasks = tasksByQuadrant[q.key];
          const isQ4 = q.key === "q4";
          return (
            <div key={q.key} className="border-4 border-primary bg-surface flex flex-col neo-shadow relative group">
              {/* Tag */}
              <div
                className={`absolute ${q.tagClass} ${q.color} ${q.textColor} text-[14px] leading-[16px] font-bold tracking-[0.05em] px-3 py-1 border-2 border-primary neo-shadow-sm z-10 uppercase`}
              >
                {q.sublabel}
              </div>
              {/* Header */}
              <div className={`${q.color} ${q.textColor} p-3 border-b-4 border-primary`}>
                <h3 className="text-[20px] leading-[24px] font-bold uppercase flex items-center justify-between">
                  {q.label}
                  <span className="material-symbols-outlined">{q.icon}</span>
                </h3>
              </div>
              {/* Tasks */}
              <div className="p-4 flex-1 overflow-y-auto space-y-4">
                {qTasks.length === 0 && (
                  <p className="text-on-surface-variant text-[14px] text-center py-4">Belum ada tugas</p>
                )}
                {qTasks.map((t) => {
                  const done = t.status === "completed";
                  return (
                    <div
                      key={t.id}
                      className={`flex items-start gap-3 p-3 border-2 border-primary ${
                        isQ4
                          ? "bg-surface-container-high border-dashed opacity-75"
                          : "bg-surface-bright neo-shadow-sm"
                      }`}
                    >
                      <button
                        onClick={() => toggleTask(t.id)}
                        className={`w-6 h-6 border-3 border-primary flex-shrink-0 mt-1 flex items-center justify-center cursor-pointer transition-colors ${
                          done ? "bg-primary text-on-primary" : "bg-surface-container-lowest"
                        }`}
                        style={{ borderWidth: "3px" }}
                      >
                        {done && <span className="material-symbols-outlined text-[14px]">close</span>}
                      </button>
                      <p
                        className={`text-[16px] leading-[24px] text-primary font-bold ${
                          done ? "line-through text-on-surface-variant" : ""
                        }`}
                      >
                        {t.title}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import { useSocialContext } from "@/lib/social-context";
import { Activity } from "@/lib/types";
import { ActivityModal } from "./activity-modal";

const DAYS_SHORT = ["SEN", "SEL", "RAB", "KAM", "JUM", "SAB", "MIN"];

function formatYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getMonthGrid(year: number, month: number): (number | null)[] {
  let startDay = new Date(year, month, 1).getDay() - 1;
  if (startDay < 0) startDay = 6;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function getWeekDates(anchor: Date): Date[] {
  const day = anchor.getDay();
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

interface FriendCalendarProps {
  friendId: string;
  currentUserId: string;
}

export function FriendCalendar({ friendId, currentUserId }: FriendCalendarProps) {
  const { getFriendActivities } = useSocialContext();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selected, setSelected] = useState<Activity | null>(null);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      setLoading(true);
      const data = await getFriendActivities(friendId);
      if (mounted) {
        setActivities(data);
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [friendId, getFriendActivities]);

  // Map activities by YYYY-MM-DD
  const byDate = useMemo(() => {
    const map = new Map<string, Activity[]>();
    for (const a of activities) {
      const key = a.startTime ? formatYMD(new Date(a.startTime)) : (a.createdAt ? formatYMD(new Date(a.createdAt)) : "");
      if (!key) continue;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }
    return map;
  }, [activities]);

  const todayStr = formatYMD(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate
    .toLocaleDateString("id-ID", { month: "long", year: "numeric" })
    .toUpperCase();

  const cells = useMemo(() => getMonthGrid(year, month), [year, month]);
  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);

  const prevPeriod = () => {
    const d = new Date(currentDate);
    if (viewMode === "month") d.setMonth(d.getMonth() - 1);
    else d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };

  const nextPeriod = () => {
    const d = new Date(currentDate);
    if (viewMode === "month") d.setMonth(d.getMonth() + 1);
    else d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };

  if (loading) {
    return <div className="p-8 text-center text-on-surface-variant uppercase text-[13px] font-bold tracking-[0.05em]">Memuat kalender…</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {(["week", "month"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 border-2 border-primary text-[12px] font-bold uppercase tracking-[0.04em] transition-all ${
                viewMode === mode
                  ? "bg-secondary-container shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  : "bg-surface hover:bg-surface-container-low"
              }`}
            >
              {mode === "week" ? "Minggu" : "Bulan"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevPeriod} className="p-1 border-2 border-primary bg-surface hover:bg-secondary-container shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5">
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          <span className="text-[14px] font-black uppercase tracking-tight min-w-[140px] text-center">{monthName}</span>
          <button onClick={nextPeriod} className="p-1 border-2 border-primary bg-surface hover:bg-secondary-container shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5">
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-px">
        {DAYS_SHORT.map((d) => (
          <div key={d} className="text-center text-[11px] font-black uppercase tracking-[0.05em] py-1 text-on-surface-variant">
            {d}
          </div>
        ))}
      </div>

      {/* Month view */}
      {viewMode === "month" && (
        <div className="grid grid-cols-7 gap-px border-2 border-primary">
          {cells.map((day, i) => {
            if (!day) return <div key={i} className="aspect-square bg-surface-container-low opacity-30" />;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayActivities = byDate.get(dateStr) ?? [];
            const isToday = dateStr === todayStr;
            return (
              <div
                key={i}
                className={`aspect-square flex flex-col p-1 bg-surface cursor-default border border-outline-variant ${
                  isToday ? "bg-secondary-container" : ""
                }`}
              >
                <span className={`text-[11px] font-black ${isToday ? "text-primary" : "text-on-surface-variant"}`}>{day}</span>
                <div className="flex flex-col gap-0.5 mt-0.5 overflow-hidden">
                  {dayActivities.slice(0, 2).map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setSelected(a)}
                      className="text-left text-[9px] font-bold uppercase truncate px-1 bg-priority-delegate text-on-primary border border-primary leading-tight"
                    >
                      {a.title}
                    </button>
                  ))}
                  {dayActivities.length > 2 && (
                    <span className="text-[9px] text-on-surface-variant">+{dayActivities.length - 2}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Week view */}
      {viewMode === "week" && (
        <div className="grid grid-cols-7 gap-px border-2 border-primary">
          {weekDates.map((date, i) => {
            const dateStr = formatYMD(date);
            const dayActivities = byDate.get(dateStr) ?? [];
            const isToday = dateStr === todayStr;
            return (
              <div
                key={i}
                className={`min-h-[120px] flex flex-col p-1 bg-surface border border-outline-variant ${
                  isToday ? "bg-secondary-container" : ""
                }`}
              >
                <span className={`text-[11px] font-black mb-1 ${isToday ? "text-primary" : "text-on-surface-variant"}`}>
                  {date.getDate()}
                </span>
                <div className="flex flex-col gap-1 overflow-hidden">
                  {dayActivities.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setSelected(a)}
                      className="text-left text-[10px] font-bold uppercase truncate px-1 py-0.5 bg-priority-delegate text-on-primary border border-primary"
                    >
                      {a.title}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {activities.length === 0 && (
        <div className="text-center p-6 border-2 border-primary text-[13px] text-on-surface-variant uppercase tracking-[0.04em]">
          Teman ini belum membagikan tugas apa pun
        </div>
      )}

      {/* Modal */}
      {selected && (
        <ActivityModal
          activity={selected}
          currentUserId={currentUserId}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

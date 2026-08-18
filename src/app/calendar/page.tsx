"use client";

import { useState, useMemo } from "react";
import { useTaskContext } from "@/lib/task-context";
import Link from "next/link";

const DAYS = ["SEN", "SEL", "RAB", "KAM", "JUM", "SAB", "MIN"];

function getMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  let startDay = firstDay.getDay() - 1; // Monday = 0
  if (startDay < 0) startDay = 6;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function getQuadrantColor(isImportant: boolean, isUrgent: boolean) {
  if (isImportant && isUrgent) return "bg-priority-urgent text-on-error";
  if (isImportant) return "bg-priority-important text-on-primary-fixed";
  if (isUrgent) return "bg-priority-delegate text-on-primary";
  return "bg-priority-low text-on-primary-fixed";
}

type ViewMode = "day" | "week" | "month";

export default function CalendarPage() {
  const { tasks, categories, toggleTask } = useTaskContext();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const todayStr = new Date().toISOString().split("T")[0];

  const monthName = currentDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" }).toUpperCase();

  const cells = useMemo(() => getMonthGrid(year, month), [year, month]);

  const tasksByDate = useMemo(() => {
    const map: Record<string, typeof tasks> = {};
    tasks.forEach((t) => {
      if (!map[t.date]) map[t.date] = [];
      map[t.date].push(t);
    });
    return map;
  }, [tasks]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  // Day view helpers
  const selectedDateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;
  const dayTasks = tasksByDate[selectedDateStr] || [];

  // Week view helpers
  const getWeekDates = () => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Monday start
    const monday = new Date(d);
    monday.setDate(d.getDate() + diff);
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const dd = new Date(monday);
      dd.setDate(monday.getDate() + i);
      dates.push(dd);
    }
    return dates;
  };
  const weekDates = getWeekDates();

  return (
    <div className="flex-1 p-[16px] md:p-[32px] bg-surface-container-lowest min-h-screen">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 pb-4 border-b-2 border-primary">
        <div className="flex items-center gap-4">
          <button onClick={prevMonth} className="p-2 neo-border hover:bg-surface-container-high active-press">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <h2 className="text-[32px] leading-[38px] font-bold text-primary">{monthName}</h2>
          <button onClick={nextMonth} className="p-2 neo-border hover:bg-surface-container-high active-press">
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
          <button
            onClick={goToday}
            className="text-[12px] leading-[14px] font-bold uppercase px-3 py-1 neo-border hover:bg-secondary-container"
          >
            Hari Ini
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="flex neo-border bg-surface-container-low">
            {([["day", "HARIAN"], ["week", "MINGGUAN"], ["month", "BULANAN"]] as [ViewMode, string][]).map(([m, label]) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={`px-4 py-2 text-[14px] leading-[16px] font-bold text-primary uppercase tracking-[0.05em] border-r-2 border-primary last:border-r-0 transition-colors ${
                  viewMode === m
                    ? "bg-secondary-container text-on-secondary-container shadow-[inset_0px_-2px_0px_0px_#000]"
                    : "hover:bg-surface-variant"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <Link
            href="/task/new"
            className="neo-border-3 neo-shadow active-press flex-1 md:flex-none px-6 py-2 bg-secondary-container text-on-secondary-container text-[14px] leading-[16px] uppercase tracking-[0.05em] font-bold flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">add</span>
            Tugas Baru
          </Link>
        </div>
      </header>

      {/* Month View */}
      {viewMode === "month" && (
        <div className="w-full neo-border bg-surface">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b-2 border-primary bg-surface-container-high">
            {DAYS.map((d, i) => (
              <div
                key={d}
                className={`p-2 border-r-2 border-primary last:border-r-0 text-center text-[12px] leading-[14px] font-bold uppercase ${
                  i >= 5 ? "bg-surface-variant" : ""
                }`}
              >
                {d}
              </div>
            ))}
          </div>
          {/* Grid */}
          <div className="grid grid-cols-7 auto-rows-[minmax(100px,auto)] md:auto-rows-[minmax(120px,auto)] bg-primary gap-[2px] p-[2px]">
            {cells.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="bg-surface-container-low p-2 opacity-50" />;
              }
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isToday = dateStr === todayStr;
              const dayTaskList = tasksByDate[dateStr] || [];

              return (
                <div
                  key={dateStr}
                  className={`p-2 h-full flex flex-col gap-1 relative group transition-colors cursor-pointer ${
                    isToday
                      ? "bg-secondary-container outline-2 outline-primary outline z-10"
                      : "bg-surface hover:bg-surface-container-lowest"
                  }`}
                  onClick={() => {
                    setCurrentDate(new Date(year, month, day));
                    setViewMode("day");
                  }}
                >
                  <span
                    className={`text-[14px] leading-[16px] font-bold absolute top-2 right-2 ${
                      isToday ? "text-on-secondary-container" : ""
                    }`}
                  >
                    {day}
                  </span>
                  <div className="mt-6 flex flex-col gap-1">
                    {dayTaskList.slice(0, 3).map((t) => (
                      <div
                        key={t.id}
                        className={`${getQuadrantColor(t.isImportant, t.isUrgent)} px-2 py-1 border-2 border-primary text-[12px] leading-[14px] font-bold truncate ${
                          t.status === "completed" ? "line-through opacity-70" : ""
                        }`}
                      >
                        {t.title}
                      </div>
                    ))}
                    {dayTaskList.length > 3 && (
                      <span className="text-[12px] text-on-surface-variant font-bold">
                        +{dayTaskList.length - 3} lagi
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week View */}
      {viewMode === "week" && (
        <div className="w-full neo-border bg-surface">
          <div className="grid grid-cols-7 border-b-2 border-primary bg-surface-container-high">
            {weekDates.map((d, i) => {
              const ds = d.toISOString().split("T")[0];
              const isToday = ds === todayStr;
              return (
                <div
                  key={i}
                  className={`p-3 border-r-2 border-primary last:border-r-0 text-center ${
                    isToday ? "bg-secondary-container" : ""
                  }`}
                >
                  <div className="text-[12px] leading-[14px] font-bold uppercase">{DAYS[i]}</div>
                  <div className="text-[20px] leading-[24px] font-bold mt-1">{d.getDate()}</div>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-7 bg-primary gap-[2px] p-[2px]">
            {weekDates.map((d, i) => {
              const ds = d.toISOString().split("T")[0];
              const dayTaskList = tasksByDate[ds] || [];
              return (
                <div key={i} className="bg-surface p-2 min-h-[200px] flex flex-col gap-2">
                  {dayTaskList.map((t) => (
                    <div
                      key={t.id}
                      className={`${getQuadrantColor(t.isImportant, t.isUrgent)} px-2 py-2 border-2 border-primary text-[12px] leading-[14px] font-bold ${
                        t.status === "completed" ? "line-through opacity-70" : ""
                      }`}
                    >
                      {t.startTime && <div className="text-[10px] opacity-80">{t.startTime}</div>}
                      {t.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day View */}
      {viewMode === "day" && (
        <div className="w-full">
          <div className="text-center mb-6">
            <div className="text-[14px] uppercase font-bold text-on-surface-variant tracking-[0.05em]">
              {currentDate.toLocaleDateString("id-ID", { weekday: "long" })}
            </div>
            <div className="text-[48px] leading-[52px] font-bold text-primary">{currentDate.getDate()}</div>
          </div>
          <div className="flex flex-col gap-4 max-w-2xl mx-auto">
            {dayTasks.length === 0 && (
              <div className="text-center py-12 neo-border border-dashed bg-surface-container-lowest">
                <span className="material-symbols-outlined text-[48px] text-outline mb-2">event_available</span>
                <p className="text-on-surface-variant text-[16px]">Tidak ada tugas untuk hari ini</p>
                <Link
                  href="/task/new"
                  className="inline-block mt-4 px-6 py-2 bg-secondary-container text-on-secondary-container neo-border-3 neo-shadow active-press text-[14px] uppercase font-bold"
                >
                  Tambah Tugas
                </Link>
              </div>
            )}
            {dayTasks
              .sort((a, b) => (a.startTime || "99:99").localeCompare(b.startTime || "99:99"))
              .map((t) => {
                const taskCats = categories.filter((c) => t.categoryIds.includes(c.id));
                const done = t.status === "completed";
                return (
                  <div
                    key={t.id}
                    className={`bg-surface-container-lowest p-4 neo-border neo-shadow-sm flex gap-4 items-start ${
                      done ? "opacity-60" : ""
                    }`}
                  >
                    <button
                      onClick={() => toggleTask(t.id)}
                      className={`w-6 h-6 neo-border-3 flex-shrink-0 cursor-pointer mt-1 flex items-center justify-center ${
                        done ? "bg-primary text-on-primary" : "bg-surface-container-lowest"
                      }`}
                    >
                      {done && <span className="material-symbols-outlined text-[16px]">close</span>}
                    </button>
                    <div className="flex-1">
                      <h4 className={`text-[18px] leading-[26px] font-medium text-primary mb-1 ${done ? "line-through" : ""}`}>
                        {t.title}
                      </h4>
                      {t.description && (
                        <p className="text-[14px] text-on-surface-variant mb-2">{t.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 items-center">
                        {t.startTime && (
                          <span className="text-[12px] leading-[14px] font-bold text-on-surface-variant flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">schedule</span>
                            {t.startTime}
                            {t.endTime && ` - ${t.endTime}`}
                          </span>
                        )}
                        {taskCats.map((c) => (
                          <span
                            key={c.id}
                            className="text-[12px] leading-[14px] font-bold uppercase px-2 py-1 neo-border text-on-primary"
                            style={{ backgroundColor: c.color }}
                          >
                            {c.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import { useTaskContext } from "@/lib/task-context";
import { TaskCard } from "@/components/task-card";
import Link from "next/link";

const DAYS = ["SEN", "SEL", "RAB", "KAM", "JUM", "SAB", "MIN"];

function formatDateToYMD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

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

function getQuadrantDotColor(isImportant: boolean, isUrgent: boolean) {
  if (isImportant && isUrgent) return "bg-priority-urgent";
  if (isImportant) return "bg-priority-important";
  if (isUrgent) return "bg-priority-delegate";
  return "bg-priority-low";
}

function getQuadrantColor(isImportant: boolean, isUrgent: boolean) {
  if (isImportant && isUrgent) return "bg-priority-urgent text-on-error";
  if (isImportant) return "bg-priority-important text-on-primary-fixed";
  if (isUrgent) return "bg-priority-delegate text-on-primary";
  return "bg-priority-low text-on-primary-fixed";
}

type ViewMode = "day" | "week" | "month";

export default function CalendarPage() {
  const { tasks } = useTaskContext();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const todayStr = formatDateToYMD(new Date());

  const monthName = currentDate
    .toLocaleDateString("id-ID", { month: "long", year: "numeric" })
    .toUpperCase();

  const cells = useMemo(() => getMonthGrid(year, month), [year, month]);

  const tasksByDate = useMemo(() => {
    const map: Record<string, typeof tasks> = {};
    tasks.forEach((t) => {
      if (!map[t.date]) map[t.date] = [];
      map[t.date].push(t);
    });
    return map;
  }, [tasks]);

  const prevPeriod = () => {
    if (viewMode === "week") {
      const prev = new Date(currentDate);
      prev.setDate(currentDate.getDate() - 7);
      setCurrentDate(prev);
      setSelectedDate(prev);
    } else if (viewMode === "day") {
      const prev = new Date(currentDate);
      prev.setDate(currentDate.getDate() - 1);
      setCurrentDate(prev);
      setSelectedDate(prev);
    } else {
      const prev = new Date(year, month - 1, 1);
      setCurrentDate(prev);
      setSelectedDate(prev);
    }
  };

  const nextPeriod = () => {
    if (viewMode === "week") {
      const next = new Date(currentDate);
      next.setDate(currentDate.getDate() + 7);
      setCurrentDate(next);
      setSelectedDate(next);
    } else if (viewMode === "day") {
      const next = new Date(currentDate);
      next.setDate(currentDate.getDate() + 1);
      setCurrentDate(next);
      setSelectedDate(next);
    } else {
      const next = new Date(year, month + 1, 1);
      setCurrentDate(next);
      setSelectedDate(next);
    }
  };

  const goToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
  };

  // Selected date string helper
  const selectedDateStr = formatDateToYMD(selectedDate);

  const selectedDateTasks = tasksByDate[selectedDateStr] || [];

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

  const selectedDateFormatted = selectedDate.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex-1 p-[16px] md:p-[32px] bg-surface-container-lowest min-h-screen">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 pb-4 border-b-2 border-primary">
        <div className="flex items-center gap-4">
          <button
            onClick={prevPeriod}
            className="p-2 neo-border hover:bg-surface-container-high active-press"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <h2 className="text-[24px] md:text-[32px] leading-[28px] md:leading-[38px] font-bold text-primary">
            {monthName}
          </h2>
          <button
            onClick={nextPeriod}
            className="p-2 neo-border hover:bg-surface-container-high active-press"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
          <button
            onClick={goToday}
            className="text-[12px] leading-[14px] font-bold uppercase px-3 py-1 neo-border hover:bg-secondary-container active-press"
          >
            Hari Ini
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="flex neo-border bg-surface-container-low">
            {(
              [
                ["day", "HARIAN"],
                ["week", "MINGGUAN"],
                ["month", "BULANAN"],
              ] as [ViewMode, string][]
            ).map(([m, label]) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={`px-3 md:px-4 py-2 text-[12px] md:text-[14px] leading-[16px] font-bold text-primary uppercase tracking-[0.05em] border-r-2 border-primary last:border-r-0 transition-colors ${
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
        <div className="flex flex-col gap-6">
          {/* Calendar Grid Container */}
          <div className="w-full neo-border bg-surface">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b-2 border-primary bg-surface-container-high">
              {DAYS.map((d, i) => (
                <div
                  key={d}
                  className={`p-2 border-r-2 border-primary last:border-r-0 text-center text-[11px] md:text-[12px] leading-[14px] font-bold uppercase ${
                    i >= 5 ? "bg-surface-variant" : ""
                  }`}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 auto-rows-[minmax(56px,auto)] md:auto-rows-[minmax(120px,auto)] bg-primary gap-[2px] p-[2px]">
              {cells.map((day, idx) => {
                if (day === null) {
                  return (
                    <div
                      key={`empty-${idx}`}
                      className="bg-surface-container-low p-2 opacity-50"
                    />
                  );
                }
                const dateStr = `${year}-${String(month + 1).padStart(
                  2,
                  "0"
                )}-${String(day).padStart(2, "0")}`;
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDateStr;
                const dayTaskList = tasksByDate[dateStr] || [];

                return (
                  <div
                    key={dateStr}
                    className={`p-1.5 md:p-2 h-full flex flex-col justify-between md:justify-start gap-1 relative transition-all cursor-pointer ${
                      isSelected
                        ? "bg-secondary-container ring-2 md:ring-3 ring-primary z-10"
                        : isToday
                        ? "bg-surface-container-high"
                        : "bg-surface hover:bg-surface-container-lowest"
                    }`}
                    onClick={() => {
                      const newSelected = new Date(year, month, day);
                      setSelectedDate(newSelected);
                      setCurrentDate(newSelected);
                    }}
                  >
                    {/* Top Row: Date Number */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[12px] md:text-[14px] font-bold px-1 rounded-none ${
                          isSelected
                            ? "bg-primary text-on-primary"
                            : isToday
                            ? "text-primary font-black underline underline-offset-2"
                            : "text-on-surface"
                        }`}
                      >
                        {day}
                      </span>
                      {dayTaskList.length > 0 && (
                        <span className="md:hidden text-[10px] font-bold bg-surface-container-highest px-1 border border-primary">
                          {dayTaskList.length}
                        </span>
                      )}
                    </div>

                    {/* Mobile (<md) View: Dot Indicators */}
                    <div className="md:hidden flex flex-wrap gap-1 mt-1">
                      {dayTaskList.slice(0, 4).map((t) => (
                        <span
                          key={t.id}
                          className={`w-2 h-2 rounded-full border border-primary ${getQuadrantDotColor(
                            t.isImportant,
                            t.isUrgent
                          )} ${
                            t.status === "completed" ? "opacity-40" : ""
                          }`}
                        />
                      ))}
                      {dayTaskList.length > 4 && (
                        <span className="text-[9px] font-black text-on-surface-variant leading-none">
                          +
                        </span>
                      )}
                    </div>

                    {/* Desktop (>=md) View: Task Chips */}
                    <div className="hidden md:flex mt-4 flex-col gap-1">
                      {dayTaskList.slice(0, 3).map((t) => (
                        <div
                          key={t.id}
                          className={`${getQuadrantColor(
                            t.isImportant,
                            t.isUrgent
                          )} px-2 py-1 border-2 border-primary text-[12px] leading-[14px] font-bold truncate ${
                            t.status === "completed"
                              ? "line-through opacity-70"
                              : ""
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

          {/* Mobile Selected Date Task Details (Visible only on mobile/tablet) */}
          <div className="md:hidden flex flex-col gap-3">
            <div className="flex items-center justify-between border-b-2 border-primary pb-2">
              <h3 className="text-[16px] font-black uppercase text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">
                  event_note
                </span>
                {selectedDateFormatted}
              </h3>
              <span className="text-[12px] font-bold bg-secondary-container px-2 py-0.5 neo-border">
                {selectedDateTasks.length} Tugas
              </span>
            </div>

            {selectedDateTasks.length === 0 ? (
              <div className="bg-surface-container-lowest p-6 neo-border text-center">
                <p className="text-[14px] text-on-surface-variant font-medium">
                  Tidak ada tugas pada tanggal ini.
                </p>
                <Link
                  href="/task/new"
                  className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-secondary-container text-on-secondary-container text-[12px] font-bold uppercase neo-border active-press"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    add
                  </span>
                  Tambah Tugas
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {selectedDateTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Week View */}
      {viewMode === "week" && (
        <div className="flex flex-col gap-6">
          {/* Desktop Week Grid (hidden on mobile) */}
          <div className="hidden md:block w-full neo-border bg-surface">
            <div className="grid grid-cols-7 border-b-2 border-primary bg-surface-container-high">
              {weekDates.map((d, i) => {
                const ds = formatDateToYMD(d);
                const isToday = ds === todayStr;
                return (
                  <div
                    key={i}
                    className={`p-3 border-r-2 border-primary last:border-r-0 text-center ${
                      isToday ? "bg-secondary-container" : ""
                    }`}
                  >
                    <div className="text-[12px] leading-[14px] font-bold uppercase">
                      {DAYS[i]}
                    </div>
                    <div className="text-[20px] leading-[24px] font-bold mt-1">
                      {d.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-7 bg-primary gap-[2px] p-[2px]">
              {weekDates.map((d, i) => {
                const ds = formatDateToYMD(d);
                const dayTaskList = tasksByDate[ds] || [];
                return (
                  <div
                    key={i}
                    className="bg-surface p-2 min-h-[200px] flex flex-col gap-2"
                  >
                    {dayTaskList.map((t) => (
                      <div
                        key={t.id}
                        className={`${getQuadrantColor(
                          t.isImportant,
                          t.isUrgent
                        )} px-2 py-2 border-2 border-primary text-[12px] leading-[14px] font-bold ${
                          t.status === "completed"
                            ? "line-through opacity-70"
                            : ""
                        }`}
                      >
                        {t.startTime && (
                          <div className="text-[10px] opacity-80">
                            {t.startTime}
                          </div>
                        )}
                        {t.title}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile Week View (Tabs + Selected Day Tasks) */}
          <div className="md:hidden flex flex-col gap-4">
            <div className="grid grid-cols-7 gap-1 bg-surface p-1 neo-border">
              {weekDates.map((d, i) => {
                const ds = formatDateToYMD(d);
                const isSelected = ds === selectedDateStr;
                const isToday = ds === todayStr;
                const dayTaskList = tasksByDate[ds] || [];

                return (
                  <button
                    key={i}
                    onClick={() => {
                      setSelectedDate(d);
                      setCurrentDate(d);
                    }}
                    className={`p-2 flex flex-col items-center justify-center neo-border transition-all ${
                      isSelected
                        ? "bg-secondary-container border-2 border-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        : isToday
                        ? "bg-surface-container-high border border-primary"
                        : "bg-surface hover:bg-surface-container-lowest border-transparent"
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase text-on-surface-variant">
                      {DAYS[i]}
                    </span>
                    <span
                      className={`text-[16px] font-black ${
                        isSelected ? "text-primary" : ""
                      }`}
                    >
                      {d.getDate()}
                    </span>
                    <div className="flex gap-0.5 mt-1 min-h-[6px]">
                      {dayTaskList.slice(0, 3).map((t) => (
                        <span
                          key={t.id}
                          className={`w-1.5 h-1.5 rounded-full ${getQuadrantDotColor(
                            t.isImportant,
                            t.isUrgent
                          )}`}
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* List Tugas Hari Terpilih di Mobile Week View */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between border-b-2 border-primary pb-2">
                <h3 className="text-[16px] font-black uppercase text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">
                    view_week
                  </span>
                  {selectedDateFormatted}
                </h3>
                <span className="text-[12px] font-bold bg-secondary-container px-2 py-0.5 neo-border">
                  {selectedDateTasks.length} Tugas
                </span>
              </div>

              {selectedDateTasks.length === 0 ? (
                <div className="bg-surface-container-lowest p-6 neo-border text-center">
                  <p className="text-[14px] text-on-surface-variant font-medium">
                    Tidak ada tugas pada hari ini.
                  </p>
                  <Link
                    href="/task/new"
                    className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-secondary-container text-on-secondary-container text-[12px] font-bold uppercase neo-border active-press"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      add
                    </span>
                    Tambah Tugas
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {selectedDateTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Day View */}
      {viewMode === "day" && (
        <div className="w-full">
          <div className="text-center mb-6 flex flex-col items-center">
            <div className="text-[14px] uppercase font-bold text-on-surface-variant tracking-[0.05em] mb-1">
              {selectedDate.toLocaleDateString("id-ID", {
                weekday: "long",
                month: "long",
                year: "numeric",
              })}
            </div>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => {
                  const prev = new Date(selectedDate);
                  prev.setDate(selectedDate.getDate() - 1);
                  setSelectedDate(prev);
                  setCurrentDate(prev);
                }}
                className="w-10 h-10 neo-border bg-surface hover:bg-secondary-container active-press flex items-center justify-center cursor-pointer"
                title="Hari sebelumnya"
                aria-label="Hari sebelumnya"
              >
                <span className="material-symbols-outlined text-[24px]">chevron_left</span>
              </button>

              <div className="text-[48px] leading-[52px] font-black text-primary min-w-[70px] text-center">
                {selectedDate.getDate()}
              </div>

              <button
                onClick={() => {
                  const next = new Date(selectedDate);
                  next.setDate(selectedDate.getDate() + 1);
                  setSelectedDate(next);
                  setCurrentDate(next);
                }}
                className="w-10 h-10 neo-border bg-surface hover:bg-secondary-container active-press flex items-center justify-center cursor-pointer"
                title="Hari berikutnya"
                aria-label="Hari berikutnya"
              >
                <span className="material-symbols-outlined text-[24px]">chevron_right</span>
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-4 max-w-2xl mx-auto">
            {selectedDateTasks.length === 0 && (
              <div className="text-center py-12 neo-border border-dashed bg-surface-container-lowest">
                <span className="material-symbols-outlined text-[48px] text-outline mb-2">
                  event_available
                </span>
                <p className="text-on-surface-variant text-[16px]">
                  Tidak ada tugas untuk hari ini
                </p>
                <Link
                  href="/task/new"
                  className="inline-block mt-4 px-6 py-2 bg-secondary-container text-on-secondary-container neo-border-3 neo-shadow active-press text-[14px] uppercase font-bold"
                >
                  Tambah Tugas
                </Link>
              </div>
            )}
            {selectedDateTasks
              .sort((a, b) =>
                (a.startTime || "99:99").localeCompare(b.startTime || "99:99")
              )
              .map((t) => (
                <TaskCard key={t.id} task={t} />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useTaskContext } from "@/lib/task-context";
import { TaskCard, PriorityChip } from "@/components/task-card";
import Link from "next/link";

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function formatRelative(dateStr: string) {
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  if (dateStr === today) return "Hari Ini";
  if (dateStr === tomorrow) return "Besok";
  return formatDate(dateStr);
}

export default function DashboardPage() {
  const { getOverdueTasks, getTodayTasks, getUpcomingTasks, categories } = useTaskContext();

  const overdue = getOverdueTasks();
  const today = getTodayTasks();
  const upcoming = getUpcomingTasks().slice(0, 6);

  const todayStr = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="p-[16px] md:p-[32px] flex-1 flex flex-col gap-[16px]">
      {/* Desktop top bar */}
      <div className="hidden md:flex justify-between items-center pb-6 border-b-2 border-primary">
        <h2 className="text-[32px] leading-[38px] font-bold text-primary">Ringkasan</h2>
        <div className="flex items-center gap-6">
          <div className="relative">
            <input
              className="neo-border-3 py-2 px-4 text-[16px] bg-surface-container-lowest focus:outline-none w-64 placeholder:text-outline"
              placeholder="Cari tugas..."
              type="text"
            />
            <span className="material-symbols-outlined absolute right-3 top-2 text-outline">
              search
            </span>
          </div>
        </div>
      </div>

      {/* Telegram Promo Card */}
      <div className="bg-secondary-fixed text-on-secondary-fixed p-6 neo-border neo-shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-[20px] leading-[24px] font-bold mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined">qr_code_2</span>
            Hubungkan Telegram
          </h3>
          <p className="text-[16px] leading-[24px] max-w-xl">
            Dapatkan notifikasi instan dan tambah tugas langsung dari chat. Tetap sinkron tanpa buka aplikasi.
          </p>
        </div>
        <button className="bg-primary text-on-primary text-[14px] leading-[16px] uppercase font-bold tracking-[0.05em] py-3 px-6 neo-border-3 neo-shadow active-press whitespace-nowrap z-10">
          Hubungkan Sekarang
        </button>
        <div className="absolute -right-10 -bottom-10 opacity-20 transform rotate-12 pointer-events-none">
          <span className="material-symbols-outlined text-[120px]">send</span>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-[16px] mt-4">
        {/* Overdue */}
        <section className="lg:col-span-12 xl:col-span-4 bg-error-container neo-border neo-shadow p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6 pb-2 border-b-2 border-error">
            <h3 className="text-[20px] leading-[24px] font-bold text-error flex items-center gap-2 uppercase tracking-tight">
              <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>
                warning
              </span>
              Terlewat
            </h3>
            <span className="bg-error text-on-error text-[12px] leading-[14px] font-bold px-2 py-1 neo-border">
              {overdue.length}
            </span>
          </div>
          <div className="flex flex-col gap-4">
            {overdue.length === 0 && (
              <p className="text-on-surface-variant text-[14px]">Tidak ada tugas terlewat!</p>
            )}
            {overdue.map((t) => (
              <TaskCard key={t.id} task={t} variant="overdue" />
            ))}
          </div>
        </section>

        {/* Today */}
        <section className="lg:col-span-12 xl:col-span-8 bg-surface-bright neo-border neo-shadow p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6 pb-2 border-b-2 border-primary">
            <h3 className="text-[20px] leading-[24px] font-bold text-primary flex items-center gap-2 uppercase tracking-tight">
              <span className="material-symbols-outlined">today</span>
              Hari Ini
            </h3>
            <div className="flex items-center gap-4">
              <span className="text-[14px] leading-[16px] font-semibold text-on-surface-variant hidden sm:inline tracking-[0.05em]">
                {todayStr}
              </span>
              <span className="bg-primary text-on-primary text-[12px] leading-[14px] font-bold px-2 py-1 neo-border">
                {today.length}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {today.map((t) => (
              <TaskCard key={t.id} task={t} />
            ))}
            <Link
              href="/task/new"
              className="border-2 border-dashed border-outline-variant p-4 flex flex-col items-center justify-center gap-2 hover:bg-surface-container-high transition-colors min-h-[120px] text-on-surface-variant hover:text-primary group"
            >
              <span className="material-symbols-outlined text-[32px] group-hover:scale-110 transition-transform">
                add
              </span>
              <span className="text-[14px] leading-[16px] uppercase font-bold tracking-[0.05em]">Tambah Tugas</span>
            </Link>
          </div>
        </section>

        {/* Upcoming */}
        <section className="lg:col-span-12 bg-surface-container-lowest neo-border p-6 flex flex-col mt-4">
          <div className="flex justify-between items-center mb-6 pb-2 border-b-2 border-primary">
            <h3 className="text-[20px] leading-[24px] font-bold text-primary flex items-center gap-2 uppercase tracking-tight">
              <span className="material-symbols-outlined">event_upcoming</span>
              Akan Datang
            </h3>
          </div>
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {upcoming.length === 0 && (
                <p className="text-on-surface-variant text-[14px]">Tidak ada tugas mendatang</p>
              )}
              {upcoming.map((t) => {
                const taskCats = categories.filter((c) => t.categoryIds.includes(c.id));
                return (
                  <div key={t.id} className="w-72 bg-surface-bright p-4 neo-border neo-shadow-sm flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <PriorityChip isImportant={t.isImportant} isUrgent={t.isUrgent} />
                      {taskCats[0] && (
                        <span
                          className="text-[12px] leading-[14px] font-bold uppercase px-2 py-1 neo-border text-on-primary"
                          style={{ backgroundColor: taskCats[0].color }}
                        >
                          {taskCats[0].name}
                        </span>
                      )}
                      <span className="text-[12px] leading-[14px] font-bold">{formatRelative(t.date)}</span>
                    </div>
                    <h4 className="text-[18px] leading-[26px] font-medium text-primary">{t.title}</h4>
                    {t.description && (
                      <p className="text-[16px] leading-[24px] text-on-surface-variant line-clamp-2 text-sm">
                        {t.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

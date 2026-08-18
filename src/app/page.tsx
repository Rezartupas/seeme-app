"use client";

import { useState, useEffect } from "react";
import { useTaskContext } from "@/lib/task-context";
import { TaskCard, PriorityChip } from "@/components/task-card";
import Link from "next/link";

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatRelative(dateStr: string) {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(now.getDate()).padStart(2, "0")}`;

  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(now.getDate() + 1);
  const tomorrow = `${tomorrowDate.getFullYear()}-${String(
    tomorrowDate.getMonth() + 1
  ).padStart(2, "0")}-${String(tomorrowDate.getDate()).padStart(2, "0")}`;

  if (dateStr === today) return "Hari Ini";
  if (dateStr === tomorrow) return "Besok";
  return formatDate(dateStr);
}

export default function DashboardPage() {
  const {
    getOverdueTasks,
    getTodayTasks,
    getUpcomingTasks,
    categories,
    profile,
    user,
  } = useTaskContext();

  const [searchQuery, setSearchQuery] = useState("");
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [tzLabel, setTzLabel] = useState("");

  const displayName =
    profile?.name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Pengguna";

  useEffect(() => {
    // Detect browser timezone label (e.g. "WIB", "WITA", "SGT", "JST")
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const short = new Intl.DateTimeFormat("id-ID", {
      timeZoneName: "short",
      timeZone: tz,
    })
      .formatToParts(new Date())
      .find((p) => p.type === "timeZoneName");
    setTzLabel(short?.value || tz);

    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const overdueAll = getOverdueTasks();
  const todayAll = getTodayTasks();
  const upcomingAll = getUpcomingTasks();
  const isTelegramConnected = Boolean(profile?.telegram_chat_id);

  // Filter based on search query
  const matchesSearch = (t: { title: string; description?: string }) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q))
    );
  };

  const overdue = overdueAll.filter(matchesSearch);
  const today = todayAll.filter(matchesSearch);
  const upcoming = upcomingAll.filter(matchesSearch).slice(0, 6);

  // Format Date & Time (auto-detect timezone from browser)
  const formattedDate = currentTime
    ? currentTime.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  const formattedTime = currentTime
    ? currentTime.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }) +
      " " +
      tzLabel
    : "--:--:--";

  return (
    <div className="p-[16px] md:p-[32px] flex-1 flex flex-col gap-[16px]">
      {/* Top bar & Clock */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b-2 border-primary">
        <div>
          <h2 className="text-[28px] md:text-[32px] leading-[34px] md:leading-[38px] font-black text-primary uppercase tracking-tight">
            Halo, {displayName}!
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[13px] md:text-[14px] font-bold uppercase text-on-surface-variant tracking-[0.05em]">
              {formattedDate}
            </span>
            <span className="text-on-surface-variant font-bold">•</span>
            <span className="bg-secondary-container text-on-secondary-container px-2 py-0.5 text-[12px] md:text-[13px] font-black neo-border">
              {formattedTime}
            </span>
          </div>
        </div>

        {/* Search Input */}
        <div className="w-full md:w-auto relative">
          <input
            className="neo-border-3 py-2.5 pl-4 pr-10 text-[14px] md:text-[16px] bg-surface-container-lowest focus:outline-none w-full md:w-72 placeholder:text-outline"
            placeholder="Cari tugas di beranda..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-outline hover:text-primary cursor-pointer"
              title="Hapus pencarian"
            >
              <span className="material-symbols-outlined text-[20px]">
                close
              </span>
            </button>
          ) : (
            <span className="material-symbols-outlined absolute right-3 top-2.5 text-outline pointer-events-none text-[20px]">
              search
            </span>
          )}
        </div>
      </div>

      {/* Telegram Promo Card */}
      {!isTelegramConnected && (
        <div className="bg-secondary-fixed text-on-secondary-fixed p-6 neo-border neo-shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-[20px] leading-[24px] font-bold mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined">qr_code_2</span>
              Hubungkan Telegram
            </h3>
            <p className="text-[16px] leading-[24px] max-w-xl">
              Dapatkan notifikasi instan dan tambah tugas langsung dari chat.
              Tetap sinkron tanpa buka aplikasi.
            </p>
          </div>
          <Link
            href="/settings"
            className="bg-primary text-on-primary text-[14px] leading-[16px] uppercase font-bold tracking-[0.05em] py-3 px-6 neo-border-3 neo-shadow active-press whitespace-nowrap z-10"
          >
            Hubungkan Sekarang
          </Link>
          <div className="absolute -right-10 -bottom-10 opacity-20 transform rotate-12 pointer-events-none">
            <span className="material-symbols-outlined text-[120px]">send</span>
          </div>
        </div>
      )}

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-[16px] mt-2">
        {/* Overdue */}
        <section className="lg:col-span-12 xl:col-span-4 bg-error-container neo-border neo-shadow p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6 pb-2 border-b-2 border-error">
            <h3 className="text-[20px] leading-[24px] font-bold text-error flex items-center gap-2 uppercase tracking-tight">
              <span
                className="material-symbols-outlined text-error"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
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
              <p className="text-on-surface-variant text-[14px]">
                {searchQuery
                  ? "Tidak ada tugas terlewat yang cocok."
                  : "Tidak ada tugas terlewat!"}
              </p>
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
                {formattedDate}
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
            {!searchQuery && (
              <Link
                href="/task/new"
                className="border-2 border-dashed border-outline-variant p-4 flex flex-col items-center justify-center gap-2 hover:bg-surface-container-high transition-colors min-h-[120px] text-on-surface-variant hover:text-primary group"
              >
                <span className="material-symbols-outlined text-[32px] group-hover:scale-110 transition-transform">
                  add
                </span>
                <span className="text-[14px] leading-[16px] uppercase font-bold tracking-[0.05em]">
                  Tambah Tugas
                </span>
              </Link>
            )}
            {searchQuery && today.length === 0 && (
              <div className="col-span-full py-6 text-center text-[14px] text-on-surface-variant font-medium">
                Tidak ada tugas hari ini yang cocok dengan pencarian.
              </div>
            )}
          </div>
        </section>

        {/* Upcoming */}
        <section className="lg:col-span-12 bg-surface-container-lowest neo-border p-6 flex flex-col mt-4">
          <div className="flex justify-between items-center mb-6 pb-2 border-b-2 border-primary">
            <h3 className="text-[20px] leading-[24px] font-bold text-primary flex items-center gap-2 uppercase tracking-tight">
              <span className="material-symbols-outlined">event_upcoming</span>
              Akan Datang
            </h3>
            <span className="bg-primary text-on-primary text-[12px] leading-[14px] font-bold px-2 py-1 neo-border">
              {upcoming.length}
            </span>
          </div>
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {upcoming.length === 0 && (
                <p className="text-on-surface-variant text-[14px]">
                  {searchQuery
                    ? "Tidak ada tugas mendatang yang cocok."
                    : "Tidak ada tugas mendatang"}
                </p>
              )}
              {upcoming.map((t) => {
                const taskCats = categories.filter((c) =>
                  t.categoryIds.includes(c.id)
                );
                return (
                  <div
                    key={t.id}
                    className="w-72 bg-surface-bright p-4 neo-border neo-shadow-sm flex flex-col gap-3"
                  >
                    <div className="flex justify-between items-start">
                      <PriorityChip
                        isImportant={t.isImportant}
                        isUrgent={t.isUrgent}
                      />
                      {taskCats[0] && (
                        <span
                          className="text-[12px] leading-[14px] font-bold uppercase px-2 py-1 neo-border text-on-primary"
                          style={{ backgroundColor: taskCats[0].color }}
                        >
                          {taskCats[0].name}
                        </span>
                      )}
                      <span className="text-[12px] leading-[14px] font-bold">
                        {formatRelative(t.date)}
                      </span>
                    </div>
                    <h4 className="text-[18px] leading-[26px] font-medium text-primary">
                      {t.title}
                    </h4>
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

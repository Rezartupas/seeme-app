"use client";

import { useTaskContext } from "@/lib/task-context";
import { TaskCard } from "@/components/task-card";
import Link from "next/link";
import { useState } from "react";

export default function ArchivePage() {
  const { tasks, loading } = useTaskContext();
  const [search, setSearch] = useState("");

  const completedTasks = tasks
    .filter((t) => t.status === "completed")
    .filter((t) =>
      search
        ? t.title.toLowerCase().includes(search.toLowerCase()) ||
          (t.description && t.description.toLowerCase().includes(search.toLowerCase()))
        : true
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto w-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b-2 border-primary pb-4">
        <div>
          <h1 className="text-[32px] md:text-[40px] font-black uppercase tracking-tight text-primary flex items-center gap-3">
            <span className="material-symbols-outlined text-[36px] md:text-[44px]">archive</span>
            Arsip Tugas
          </h1>
          <p className="text-[14px] uppercase font-bold text-on-surface-variant tracking-[0.05em] mt-1">
            Riwayat semua tugas yang telah diselesaikan
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-secondary-container text-on-secondary-container px-4 py-2 neo-border-3 font-bold text-[14px] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            Total Selesai: {tasks.filter((t) => t.status === "completed").length}
          </div>
        </div>
      </div>

      {/* Search Filter */}
      <div className="w-full">
        <input
          type="text"
          placeholder="Cari tugas di arsip..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="p-3 text-[14px] md:text-[16px] neo-input w-full bg-surface-container-low"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="p-8 text-center font-bold uppercase text-on-surface-variant">
          Memuat data arsip...
        </div>
      ) : completedTasks.length === 0 ? (
        <div className="bg-surface-container-lowest p-8 md:p-12 neo-border-3 text-center flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-[64px] text-on-surface-variant">
            inventory_2
          </span>
          <div>
            <h3 className="text-[20px] font-black uppercase text-primary">
              {search ? "Tugas Tidak Ditemukan" : "Belum Ada Tugas di Arsip"}
            </h3>
            <p className="text-[14px] text-on-surface-variant mt-1">
              {search
                ? "Coba gunakan kata kunci pencarian yang lain."
                : "Selesaikan tugas pada Beranda, Kalender, atau Matriks untuk melihat riwayat di sini."}
            </p>
          </div>
          <Link
            href="/"
            className="mt-2 px-6 py-3 bg-secondary-container text-on-secondary-container font-bold uppercase neo-border-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active-press inline-flex items-center gap-2 text-[14px]"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Kembali ke Beranda
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {completedTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useTaskContext } from "@/lib/task-context";
import { CategoryChip, PriorityChip } from "@/components/task-card";
import Link from "next/link";
import { useState, useMemo } from "react";

export default function ArchivePage() {
  const { tasks, categories, loading, restoreTasks, deleteTasks, deleteTask } =
    useTaskContext();
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const categoryMap = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c]));
  }, [categories]);

  const completedTasks = useMemo(() => {
    return tasks
      .filter((t) => t.status === "completed")
      .filter((t) =>
        search
          ? t.title.toLowerCase().includes(search.toLowerCase()) ||
            (t.description &&
              t.description.toLowerCase().includes(search.toLowerCase()))
          : true
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [tasks, search]);

  const allVisibleSelected =
    completedTasks.length > 0 &&
    completedTasks.every((t) => selectedIds.includes(t.id));

  const handleToggleSelectAll = () => {
    if (allVisibleSelected) {
      const visibleSet = new Set(completedTasks.map((t) => t.id));
      setSelectedIds((prev) => prev.filter((id) => !visibleSet.has(id)));
    } else {
      const newSelected = Array.from(
        new Set([...selectedIds, ...completedTasks.map((t) => t.id)])
      );
      setSelectedIds(newSelected);
    }
  };

  const handleToggleSingle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBatchRestore = async () => {
    if (selectedIds.length === 0) return;
    setIsProcessing(true);
    try {
      await restoreTasks(selectedIds);
      setSelectedIds([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirm = window.confirm(
      `Apakah Anda yakin ingin menghapus permanen ${selectedIds.length} tugas yang dipilih? Tindakan ini tidak dapat dibatalkan.`
    );
    if (!confirm) return;

    setIsProcessing(true);
    try {
      await deleteTasks(selectedIds);
      setSelectedIds([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSingleRestore = async (id: string) => {
    setIsProcessing(true);
    try {
      await restoreTasks([id]);
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSingleDelete = async (id: string) => {
    const confirm = window.confirm(
      "Apakah Anda yakin ingin menghapus permanen tugas ini?"
    );
    if (!confirm) return;

    setIsProcessing(true);
    try {
      await deleteTask(id);
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto w-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b-2 border-primary pb-4">
        <div>
          <h1 className="text-[32px] md:text-[40px] font-black uppercase tracking-tight text-primary flex items-center gap-3">
            <span className="material-symbols-outlined text-[36px] md:text-[44px]">
              archive
            </span>
            Arsip Tugas
          </h1>
          <p className="text-[14px] uppercase font-bold text-on-surface-variant tracking-[0.05em] mt-1">
            Riwayat semua tugas yang telah diselesaikan
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-secondary-container text-on-secondary-container px-4 py-2 neo-border-3 font-bold text-[14px] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            Total Selesai:{" "}
            {tasks.filter((t) => t.status === "completed").length}
          </div>
        </div>
      </div>

      {/* Search Filter & Bulk Action Toolbar */}
      <div className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Cari tugas di arsip..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="p-3 text-[14px] md:text-[16px] neo-input w-full bg-surface-container-low"
        />

        {completedTasks.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-container-lowest p-3 neo-border">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={handleToggleSelectAll}
                className="w-5 h-5 accent-primary cursor-pointer"
              />
              <span className="text-[14px] font-bold uppercase tracking-wider">
                Pilih Semua ({selectedIds.length} dipilih)
              </span>
            </label>

            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBatchRestore}
                  disabled={isProcessing}
                  className="px-3 py-1.5 bg-category-green text-on-primary font-bold uppercase text-[12px] neo-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active-press flex items-center gap-1.5 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    settings_backup_restore
                  </span>
                  Pulihkan ({selectedIds.length})
                </button>
                <button
                  onClick={handleBatchDelete}
                  disabled={isProcessing}
                  className="px-3 py-1.5 bg-error text-on-error font-bold uppercase text-[12px] neo-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active-press flex items-center gap-1.5 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    delete_forever
                  </span>
                  Hapus Permanen ({selectedIds.length})
                </button>
              </div>
            )}
          </div>
        )}
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
            <span className="material-symbols-outlined text-[18px]">
              arrow_back
            </span>
            Kembali ke Beranda
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {completedTasks.map((task) => {
            const isSelected = selectedIds.includes(task.id);
            const taskCats = task.categoryIds
              .map((id) => categoryMap.get(id))
              .filter(Boolean);

            return (
              <div
                key={task.id}
                className={`p-4 neo-border flex gap-3 md:gap-4 items-start relative group transition-colors ${
                  isSelected
                    ? "bg-secondary-container/40 border-primary"
                    : "bg-surface-container-lowest hover:bg-surface-container-low"
                }`}
              >
                {/* Selection Checkbox */}
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleToggleSingle(task.id)}
                  className="w-5 h-5 mt-1 accent-primary cursor-pointer flex-shrink-0"
                  aria-label="Pilih tugas untuk tindakan massal"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-[18px] leading-[24px] font-medium text-primary line-through mb-1 break-words">
                      {task.title}
                    </h4>
                  </div>

                  {task.description && (
                    <p className="text-[14px] text-on-surface-variant mb-2 break-words">
                      {task.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 items-center mt-2">
                    <PriorityChip
                      isImportant={task.isImportant}
                      isUrgent={task.isUrgent}
                    />

                    {taskCats.map((c) =>
                      c ? <CategoryChip key={c.id} category={c} /> : null
                    )}

                    <span className="text-[12px] leading-[14px] font-bold text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">
                        event
                      </span>
                      {task.date}
                    </span>

                    {task.startTime && (
                      <span className="text-[12px] leading-[14px] font-bold text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">
                          schedule
                        </span>
                        {task.startTime}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex items-center gap-1 self-center md:self-start">
                  <button
                    onClick={() => handleSingleRestore(task.id)}
                    disabled={isProcessing}
                    className="p-1.5 bg-surface neo-border hover:bg-category-green hover:text-on-primary transition-colors text-on-surface-variant active-press"
                    title="Pulihkan ke daftar tugas aktif"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      settings_backup_restore
                    </span>
                  </button>
                  <button
                    onClick={() => handleSingleDelete(task.id)}
                    disabled={isProcessing}
                    className="p-1.5 bg-surface neo-border hover:bg-error hover:text-on-error transition-colors text-on-surface-variant active-press"
                    title="Hapus permanen"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      delete_forever
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

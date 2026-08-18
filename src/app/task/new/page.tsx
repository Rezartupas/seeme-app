"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTaskContext } from "@/lib/task-context";

export default function NewTaskPage() {
  const router = useRouter();
  const { addTask, categories, addCategory, deleteCategory } = useTaskContext();

  const getTodayLocal = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(getTodayLocal());
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reminderAt, setReminderAt] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [isImportant, setIsImportant] = useState(false);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("#9d27b0");
  const [submitting, setSubmitting] = useState(false);

  const toggleCat = (id: string) => {
    setSelectedCats((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;
    setSubmitting(true);

    try {
      await addTask({
        title: title.trim(),
        description: description.trim() || undefined,
        date,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        reminderAt: reminderAt ? new Date(reminderAt).toISOString() : undefined,
        isUrgent,
        isImportant,
        status: "pending",
        categoryIds: selectedCats,
      });
      router.push("/");
    } catch (err) {
      console.error("Gagal menambah tugas:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    await addCategory({ name: newCatName.trim(), color: newCatColor });
    setNewCatName("");
    setShowNewCat(false);
  };

  return (
    <div className="flex-1 p-[16px] md:p-[32px] w-full max-w-4xl mx-auto flex flex-col justify-start mt-4 md:mt-8">
      <div className="bg-surface-container-lowest p-6 md:p-10 mb-8 relative neo-border-3 neo-shadow-lg">
        {/* Tag */}
        <div className="absolute -top-5 -left-5 bg-secondary-container border-2 border-primary p-2 text-[20px] leading-[24px] font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-10 transform -rotate-2 uppercase">
          TAMBAH TUGAS
        </div>

        <form className="flex flex-col gap-8 mt-6" onSubmit={handleSubmit}>
          {/* Judul */}
          <div className="flex flex-col gap-2">
            <label className="text-[20px] leading-[24px] font-bold uppercase tracking-tight" htmlFor="title">
              Judul <span className="text-error">*</span>
            </label>
            <input
              className="bg-surface-container-low p-4 text-[18px] leading-[26px] font-medium neo-input w-full placeholder-outline"
              id="title"
              placeholder="Masukkan judul tugas..."
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Deskripsi */}
          <div className="flex flex-col gap-2">
            <label className="text-[20px] leading-[24px] font-bold uppercase tracking-tight" htmlFor="description">
              Deskripsi
            </label>
            <textarea
              className="bg-surface-container-low p-4 text-[16px] leading-[24px] neo-input w-full resize-y placeholder-outline"
              id="description"
              placeholder="Tambah detail..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Tanggal & Waktu */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t-2 border-primary pt-6 border-b-2 pb-6">
            <div className="flex flex-col gap-2">
              <label className="text-[14px] leading-[16px] uppercase font-bold tracking-[0.05em] flex items-center gap-2" htmlFor="date">
                <span className="material-symbols-outlined">calendar_today</span>
                Tanggal <span className="text-error">*</span>
              </label>
              <input
                className="bg-surface-container-lowest p-3 text-[16px] leading-[24px] neo-input w-full"
                id="date"
                required
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="flex gap-4">
              <div className="flex flex-col gap-2 flex-1">
                <label className="text-[14px] leading-[16px] uppercase font-bold tracking-[0.05em] flex items-center gap-2" htmlFor="time-start">
                  <span className="material-symbols-outlined">schedule</span>
                  Mulai
                </label>
                <input
                  className="bg-surface-container-lowest p-3 text-[16px] leading-[24px] neo-input w-full"
                  id="time-start"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2 flex-1">
                <label className="text-[14px] leading-[16px] uppercase font-bold tracking-[0.05em] flex items-center gap-2" htmlFor="time-end">
                  <span className="material-symbols-outlined">update</span>
                  Selesai
                </label>
                <input
                  className="bg-surface-container-lowest p-3 text-[16px] leading-[24px] neo-input w-full"
                  id="time-end"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Pengingat Telegram Bebas (Custom Datetime) */}
          <div className="flex flex-col gap-2">
            <label className="text-[14px] leading-[16px] uppercase font-bold tracking-[0.05em] flex items-center gap-2" htmlFor="reminder-at">
              <span className="material-symbols-outlined">notifications_active</span>
              Waktu Pengingat Telegram (Opsional)
            </label>
            <input
              className="bg-surface-container-lowest p-3 text-[16px] leading-[24px] neo-input w-full md:w-1/2"
              id="reminder-at"
              type="datetime-local"
              value={reminderAt}
              onChange={(e) => setReminderAt(e.target.value)}
            />
            <p className="text-[12px] text-on-surface-variant">
              Bot Telegram akan mengirim notifikasi otomatis ke chat Anda pada waktu yang ditentukan.
            </p>
          </div>

          {/* Matriks Eisenhower */}
          <div className="flex flex-col gap-4">
            <h3 className="text-[20px] leading-[24px] font-bold uppercase tracking-tight border-b-2 border-primary pb-2 inline-block w-fit">
              Matriks Eisenhower
            </h3>
            <div className="flex gap-6 flex-wrap">
              <button
                type="button"
                className={`flex items-center cursor-pointer p-3 border-2 border-primary transition-all ${
                  isUrgent
                    ? "bg-priority-urgent text-on-primary shadow-none translate-x-1 translate-y-1"
                    : "bg-surface-container-low hover:bg-surface-container shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                }`}
                onClick={() => setIsUrgent(!isUrgent)}
              >
                <div className="text-[14px] leading-[16px] uppercase font-bold tracking-[0.05em] flex items-center gap-1">
                  <span className={`material-symbols-outlined ${isUrgent ? "" : "text-priority-urgent"}`}>warning</span>
                  Mendesak
                </div>
              </button>
              <button
                type="button"
                className={`flex items-center cursor-pointer p-3 border-2 border-primary transition-all ${
                  isImportant
                    ? "bg-priority-important text-primary shadow-none translate-x-1 translate-y-1"
                    : "bg-surface-container-low hover:bg-surface-container shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                }`}
                onClick={() => setIsImportant(!isImportant)}
              >
                <div className="text-[14px] leading-[16px] uppercase font-bold tracking-[0.05em] flex items-center gap-1">
                  <span className={`material-symbols-outlined ${isImportant ? "" : "text-priority-important"}`}>star</span>
                  Penting
                </div>
              </button>
            </div>
          </div>

          {/* Kategori */}
          <div className="flex flex-col gap-2 mt-4">
            <label className="text-[20px] leading-[24px] font-bold uppercase tracking-tight">Kategori</label>
            <div className="flex flex-wrap gap-3 mt-2">
              {categories.map((cat) => {
                const isSelected = selectedCats.includes(cat.id);
                return (
                  <div
                    key={cat.id}
                    className={`border-2 border-primary text-[14px] leading-[16px] uppercase font-bold tracking-[0.05em] transition-all inline-flex items-center neo-shadow-sm ${
                      isSelected
                        ? "text-white"
                        : "text-primary bg-surface-container-lowest"
                    }`}
                    style={isSelected ? { backgroundColor: cat.color } : {}}
                  >
                    <button
                      type="button"
                      onClick={() => toggleCat(cat.id)}
                      className="px-3 py-2 cursor-pointer flex-1 text-left"
                    >
                      {cat.name}
                    </button>
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        const confirm = window.confirm(`Hapus kategori "${cat.name}"?`);
                        if (confirm) {
                          setSelectedCats((prev) => prev.filter((id) => id !== cat.id));
                          await deleteCategory(cat.id);
                        }
                      }}
                      className="px-2 py-2 hover:bg-black/20 text-current cursor-pointer transition-colors border-l border-primary/30"
                      title={`Hapus kategori ${cat.name}`}
                      aria-label={`Hapus kategori ${cat.name}`}
                    >
                      <span className="material-symbols-outlined text-[16px] align-middle">close</span>
                    </button>
                  </div>
                );
              })}
              <button
                type="button"
                onClick={() => setShowNewCat(!showNewCat)}
                className="px-4 py-2 border-2 border-primary text-[14px] leading-[16px] uppercase font-bold tracking-[0.05em] text-primary bg-surface-container-lowest hover:bg-secondary-container transition-colors neo-shadow-sm"
              >
                + Tambah Baru
              </button>
            </div>
            {showNewCat && (
              <div className="flex gap-2 mt-2 items-end">
                <input
                  className="neo-input p-2 text-[14px] flex-1"
                  placeholder="Nama kategori"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                />
                <input
                  type="color"
                  value={newCatColor}
                  onChange={(e) => setNewCatColor(e.target.value)}
                  className="w-10 h-10 border-2 border-primary cursor-pointer"
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="px-4 py-2 bg-primary text-on-primary neo-border text-[14px] font-bold uppercase"
                >
                  Tambah
                </button>
              </div>
            )}
          </div>

          {/* Tombol Aksi */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-8 border-t-2 border-primary">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-secondary-container text-on-secondary-container text-[20px] leading-[24px] font-bold uppercase py-4 px-6 neo-border-3 neo-shadow-lg active-press disabled:opacity-50"
            >
              {submitting ? "Menyimpan..." : "Simpan Tugas"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="sm:w-1/3 bg-surface-container-highest text-on-surface text-[20px] leading-[24px] font-bold uppercase py-4 px-6 border-[3px] border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

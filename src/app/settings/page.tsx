"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTaskContext } from "@/lib/task-context";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { user, profile, categories, deleteCategory, updateProfileName, refreshData } = useTaskContext();
  const [linkCode, setLinkCode] = useState("");
  const [generating, setGenerating] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);

  const displayName =
    profile?.name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Pengguna";

  const [nameInput, setNameInput] = useState(displayName);
  const [savingName, setSavingName] = useState(false);
  const [username, setUsername] = useState(profile?.username ?? "");
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  const [prevProfileUsername, setPrevProfileUsername] = useState(profile?.username);
  if (profile?.username !== prevProfileUsername) {
    setPrevProfileUsername(profile?.username);
    if (profile?.username) {
      setUsername(profile.username);
    }
  }

  const [prevDisplayName, setPrevDisplayName] = useState(displayName);
  if (displayName !== prevDisplayName) {
    setPrevDisplayName(displayName);
    setNameInput(displayName);
  }

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    setSavingName(true);
    try {
      await updateProfileName(nameInput.trim());
      setIsEditingName(false);
    } finally {
      setSavingName(false);
    }
  };

  const handleSaveUsername = async () => {
    if (!username.trim() || !user) return;
    setUsernameSaving(true);
    setUsernameError(null);
    const { error } = await supabase
      .from("profiles")
      .update({ username: username.trim().toLowerCase() })
      .eq("id", user.id);
    if (error) {
      if (error.message.includes("unique") || error.message.includes("duplicate")) {
        setUsernameError("Username sudah dipakai");
      } else {
        setUsernameError("Gagal menyimpan");
      }
    } else {
      await refreshData();
    }
    setUsernameSaving(false);
  };

  const handleGenerateCode = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/telegram/generate-code", {
        method: "POST",
      });
      const data = await res.json();
      if (data.code) {
        setLinkCode(data.code);
      }
    } catch (err) {
      console.error("Gagal generate kode Telegram:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user) return;
    await supabase
      .from("profiles")
      .update({ telegram_chat_id: null })
      .eq("id", user.id);
    await refreshData();
    setLinkCode("");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const telegramConnected = Boolean(profile?.telegram_chat_id);
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "seeme_robot";

  return (
    <div className="flex-1 p-[16px] md:p-[32px] max-w-2xl mx-auto w-full">
      <header className="mb-8">
        <h2 className="text-[24px] md:text-[32px] leading-[28px] md:leading-[38px] font-bold text-primary uppercase border-b-4 border-primary inline-block pb-2">
          Pengaturan
        </h2>
      </header>

      {/* Profil */}
      <section className="neo-border neo-shadow p-6 mb-6 bg-surface-container-lowest">
        <h3 className="text-[20px] leading-[24px] font-bold uppercase mb-4 border-b-2 border-primary pb-2">
          Profil Akun
        </h3>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-primary text-on-primary flex items-center justify-center neo-border-3 text-[24px] font-bold shrink-0">
            {displayName.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            {isEditingName ? (
              <form onSubmit={handleSaveName} className="flex flex-col sm:flex-row gap-2 mt-1">
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="neo-input p-2 text-[16px] bg-surface-container-low font-bold"
                  placeholder="Masukkan nama..."
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={savingName}
                    className="px-3 py-1.5 bg-secondary-container text-on-secondary-container font-bold uppercase text-[12px] neo-border active-press disabled:opacity-50"
                  >
                    {savingName ? "Menyimpan..." : "Simpan"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNameInput(displayName);
                      setIsEditingName(false);
                    }}
                    className="px-3 py-1.5 bg-surface text-on-surface font-bold uppercase text-[12px] neo-border active-press"
                  >
                    Batal
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-[20px] font-black text-primary">{displayName}</p>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="p-1 hover:bg-secondary-container rounded neo-border text-on-surface-variant transition-colors flex items-center justify-center"
                  title="Ubah nama profil"
                  aria-label="Ubah nama profil"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                </button>
              </div>
            )}
            <p className="text-[14px] text-on-surface-variant mt-0.5">{user?.email || "Tidak ada email"}</p>
          </div>
        </div>

        {/* Username Field */}
        <div className="flex flex-col gap-2 mb-6 border-t-2 border-primary/20 pt-4">
          <label className="text-[14px] font-bold uppercase tracking-[0.05em]" htmlFor="username">
            Username
          </label>
          <div className="flex gap-2">
            <input
              id="username"
              className="flex-1 bg-surface-container-low p-3 text-[16px] neo-input font-bold"
              placeholder="contoh: budi123"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={30}
            />
            <button
              onClick={handleSaveUsername}
              disabled={usernameSaving || !username.trim()}
              className="px-4 py-2 border-2 border-primary bg-secondary-container font-bold text-[13px] uppercase tracking-[0.04em] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50"
            >
              {usernameSaving ? "…" : "Simpan"}
            </button>
          </div>
          {usernameError && (
            <div className="text-[12px] text-error font-bold">{usernameError}</div>
          )}
          <div className="text-[11px] text-on-surface-variant">
            Username digunakan agar teman bisa menemukan akunmu melalui pencarian
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="px-6 py-3 bg-surface-container-highest text-on-surface neo-border text-[14px] uppercase font-bold tracking-[0.05em] active-press neo-shadow-sm hover:bg-error hover:text-on-error transition-colors"
        >
          Keluar (Logout)
        </button>
      </section>

      {/* Integrasi Telegram */}
      <section className="neo-border neo-shadow p-6 mb-6 bg-surface-container-lowest">
        <h3 className="text-[20px] leading-[24px] font-bold uppercase mb-4 border-b-2 border-primary pb-2 flex items-center gap-2">
          <span className="material-symbols-outlined">send</span>
          Integrasi Telegram Bot (@{botUsername})
        </h3>

        {telegramConnected ? (
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2 text-category-green">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
              <span className="text-[16px] font-bold">
                Terhubung (Chat ID: {profile?.telegram_chat_id})
              </span>
            </div>
            <button
              onClick={handleDisconnect}
              className="px-4 py-2 bg-error-container text-on-error-container neo-border text-[14px] uppercase font-bold tracking-[0.05em] active-press"
            >
              Putuskan Sambungan
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-[16px] leading-[24px] text-on-surface-variant">
              Hubungkan akun Telegram untuk menerima pengingat tugas secara otomatis melalui bot{" "}
              <strong>@{botUsername}</strong>.
            </p>

            {linkCode ? (
              <div className="bg-secondary-fixed p-5 neo-border flex flex-col gap-3">
                <p className="text-[14px] uppercase font-bold">Kode verifikasi (berlaku 10 menit):</p>
                <div className="text-[48px] leading-[52px] font-black text-primary tracking-[0.25em] text-center bg-surface p-2 neo-border">
                  {linkCode}
                </div>
                <p className="text-[14px] text-on-surface-variant">
                  Buka bot Telegram <a href={`https://t.me/${botUsername}`} target="_blank" rel="noreferrer" className="underline font-bold text-primary">t.me/{botUsername}</a>, lalu kirim:
                </p>
                <code className="bg-primary text-on-primary px-4 py-3 text-[16px] font-bold block text-center neo-border select-all">
                  /start {linkCode}
                </code>
                <p className="text-[12px] text-on-surface-variant text-center">
                  Setelah mengirim pesan di Telegram, refresh halaman ini untuk melihat status terbaru.
                </p>
              </div>
            ) : (
              <button
                onClick={handleGenerateCode}
                disabled={generating}
                className="px-6 py-3 bg-priority-delegate text-on-primary neo-border-3 neo-shadow active-press text-[14px] uppercase font-bold tracking-[0.05em] flex items-center gap-2 w-fit disabled:opacity-50"
              >
                <span className="material-symbols-outlined">link</span>
                {generating ? "Membuat Kode..." : "Hubungkan Telegram"}
              </button>
            )}
          </div>
        )}
      </section>

      {/* Kategori Tersimpan */}
      <section className="neo-border neo-shadow p-6 mb-6 bg-surface-container-lowest">
        <h3 className="text-[20px] leading-[24px] font-bold uppercase mb-4 border-b-2 border-primary pb-2 flex items-center gap-2">
          <span className="material-symbols-outlined">label</span>
          Daftar Kategori Aktif ({categories.length})
        </h3>
        {categories.length === 0 ? (
          <p className="text-[14px] text-on-surface-variant">Belum ada kategori tersimpan.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <span
                key={cat.id}
                className="text-[14px] font-bold uppercase pl-3 pr-2 py-1 neo-border text-on-primary inline-flex items-center gap-2"
                style={{ backgroundColor: cat.color }}
              >
                <span>{cat.name}</span>
                <button
                  onClick={async () => {
                    const confirm = window.confirm(`Hapus kategori "${cat.name}"?`);
                    if (confirm) {
                      await deleteCategory(cat.id);
                    }
                  }}
                  className="hover:bg-black/20 rounded px-1 transition-colors leading-none cursor-pointer"
                  title="Hapus kategori"
                  aria-label={`Hapus kategori ${cat.name}`}
                >
                  <span className="material-symbols-outlined text-[16px] align-middle">close</span>
                </button>
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Pintasan Arsip */}
      <section className="neo-border neo-shadow p-6 bg-surface-container-lowest flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-[20px] leading-[24px] font-bold uppercase flex items-center gap-2">
            <span className="material-symbols-outlined">archive</span>
            Arsip Tugas
          </h3>
          <p className="text-[14px] text-on-surface-variant mt-1">
            Lihat riwayat tugas-tugas yang telah Anda selesaikan.
          </p>
        </div>
        <Link
          href="/archive"
          className="px-6 py-3 bg-secondary-container text-on-secondary-container neo-border text-[14px] uppercase font-bold tracking-[0.05em] active-press neo-shadow-sm flex items-center gap-2"
        >
          Buka Arsip
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </Link>
      </section>
    </div>
  );
}

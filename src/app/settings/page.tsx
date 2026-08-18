"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTaskContext } from "@/lib/task-context";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { user, profile, categories, refreshData } = useTaskContext();
  const [linkCode, setLinkCode] = useState("");
  const [generating, setGenerating] = useState(false);

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

      {/* Pintasan Arsip */}
      <section className="neo-border neo-shadow p-6 mb-6 bg-surface-container-lowest flex items-center justify-between flex-wrap gap-4">
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

      {/* Profil */}
      <section className="neo-border neo-shadow p-6 mb-6 bg-surface-container-lowest">
        <h3 className="text-[20px] leading-[24px] font-bold uppercase mb-4 border-b-2 border-primary pb-2">
          Profil Akun
        </h3>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-primary text-on-primary flex items-center justify-center neo-border-3 text-[24px] font-bold">
            {user?.email ? user.email.slice(0, 2).toUpperCase() : "SM"}
          </div>
          <div>
            <p className="text-[18px] font-bold">{user?.email?.split("@")[0] || "Pengguna"}</p>
            <p className="text-[14px] text-on-surface-variant">{user?.email || "Tidak ada email"}</p>
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
      <section className="neo-border neo-shadow p-6 bg-surface-container-lowest">
        <h3 className="text-[20px] leading-[24px] font-bold uppercase mb-4 border-b-2 border-primary pb-2 flex items-center gap-2">
          <span className="material-symbols-outlined">label</span>
          Daftar Kategori Aktif ({categories.length})
        </h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <span
              key={cat.id}
              className="text-[14px] font-bold uppercase px-3 py-1 neo-border text-on-primary"
              style={{ backgroundColor: cat.color }}
            >
              {cat.name}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

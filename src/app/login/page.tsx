"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setInfoMsg("");
    setLoading(true);

    try {
      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        if (data.session) {
          router.push("/");
          router.refresh();
        } else {
          setInfoMsg("Registrasi berhasil! Silakan cek email Anda untuk konfirmasi.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/");
        router.refresh();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan autentikasi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <h1 className="text-[48px] leading-[52px] font-black tracking-widest text-primary">
          SEE ME
        </h1>
        <p className="text-[14px] leading-[16px] uppercase font-bold text-on-surface-variant tracking-[0.05em] mt-1">
          Manifesto Produktivitas & Pengingat
        </p>
      </div>

      {/* Card Form */}
      <div className="w-full max-w-md bg-surface-container-lowest p-6 md:p-8 neo-border-3 neo-shadow-lg relative">
        <div className="absolute -top-4 -left-4 bg-secondary-container border-2 border-primary px-3 py-1 font-bold text-[14px] uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transform -rotate-2">
          {isRegister ? "DAFTAR AKUN" : "MASUK APLIKASI"}
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-error-container text-on-error-container border-2 border-error text-[14px] font-bold">
            {errorMsg}
          </div>
        )}

        {infoMsg && (
          <div className="mb-4 p-3 bg-secondary-fixed text-on-secondary-fixed border-2 border-primary text-[14px] font-bold">
            {infoMsg}
          </div>
        )}

        <form onSubmit={handleAuth} className="flex flex-col gap-6 mt-4">
          <div className="flex flex-col gap-2">
            <label className="text-[14px] uppercase font-bold tracking-[0.05em]" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              className="p-3 text-[16px] neo-input w-full bg-surface-container-low"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[14px] uppercase font-bold tracking-[0.05em]" htmlFor="password">
              Kata Sandi
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              className="p-3 text-[16px] neo-input w-full bg-surface-container-low"
              placeholder="Minimal 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-secondary-container text-on-secondary-container text-[16px] font-bold uppercase tracking-wider neo-border-3 neo-shadow-lg active-press transition-all mt-2 disabled:opacity-50"
          >
            {loading ? "Memproses..." : isRegister ? "Daftar Sekarang" : "Masuk"}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-6 pt-4 border-t-2 border-primary text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setErrorMsg("");
              setInfoMsg("");
            }}
            className="text-[14px] font-bold text-on-surface-variant hover:text-primary underline uppercase tracking-wide"
          >
            {isRegister
              ? "Sudah punya akun? Masuk di sini"
              : "Belum punya akun? Buat akun baru"}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Email atau kata sandi tidak valid");
      }
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
          MASUK APLIKASI
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-error-container text-on-error-container border-2 border-error text-[14px] font-bold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-6 mt-4">
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
              placeholder="Masukkan kata sandi..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-secondary-container text-on-secondary-container text-[16px] font-bold uppercase tracking-wider neo-border-3 neo-shadow-lg active-press transition-all mt-2 disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>

        {/* Akses Eksklusif Info */}
        <div className="mt-6 pt-4 border-t-2 border-primary text-center">
          <p className="text-[12px] text-on-surface-variant font-medium">
            🔒 Akses eksklusif. Akun didaftarkan langsung oleh administrator.
          </p>
        </div>
      </div>
    </div>
  );
}

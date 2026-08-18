import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Telegram sends message updates
    const message = body.message;
    if (!message || !message.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id;
    const text = message.text.trim();
    const adminSupabase = createAdminClient();

    // Handle /start <code>
    if (text.startsWith("/start")) {
      const parts = text.split(" ");
      const code = parts[1]?.trim();

      if (!code) {
        await sendTelegramMessage(
          chatId,
          `👋 <b>Halo! Selamat datang di See Me Reminder Bot.</b>\n\nUntuk menghubungkan akun, silakan buka menu <b>Pengaturan</b> di web app, klik <b>Hubungkan Telegram</b>, lalu kirim kode unik di sini:\n<code>/start &lt;kode_anda&gt;</code>`
        );
        return NextResponse.json({ ok: true });
      }

      // Look up profile by valid code
      const now = new Date().toISOString();
      const { data: profile, error } = await adminSupabase
        .from("profiles")
        .select("id, email")
        .eq("telegram_link_code", code)
        .gt("telegram_link_code_expires_at", now)
        .single();

      if (error || !profile) {
        await sendTelegramMessage(
          chatId,
          `❌ <b>Kode tidak valid atau sudah kedaluwarsa.</b>\n\nSilakan generate kode baru melalui halaman Pengaturan di web app See Me Reminder.`
        );
        return NextResponse.json({ ok: true });
      }

      // Link telegram_chat_id and clear code
      await adminSupabase
        .from("profiles")
        .update({
          telegram_chat_id: String(chatId),
          telegram_link_code: null,
          telegram_link_code_expires_at: null,
        })
        .eq("id", profile.id);

      await sendTelegramMessage(
        chatId,
        `✅ <b>Berhasil Terhubung!</b>\n\nAkun Anda (<code>${profile.email}</code>) kini telah tersambung dengan bot See Me Reminder.\nAnda akan menerima notifikasi otomatis saat pengingat tugas jatuh tempo.\n\nKetik <code>/help</code> untuk melihat daftar perintah.`
      );

      return NextResponse.json({ ok: true });
    }

    // Handle /done <task_id>
    if (text.startsWith("/done")) {
      const parts = text.split(" ");
      const taskId = parts[1]?.trim();

      if (!taskId) {
        await sendTelegramMessage(
          chatId,
          `ℹ️ <b>Format salah.</b> Gunakan: <code>/done &lt;id_tugas&gt;</code>`
        );
        return NextResponse.json({ ok: true });
      }

      // Find user with this chat_id
      const { data: profile } = await adminSupabase
        .from("profiles")
        .select("id")
        .eq("telegram_chat_id", String(chatId))
        .single();

      if (!profile) {
        await sendTelegramMessage(
          chatId,
          `⚠️ Akun Telegram Anda belum terhubung dengan akun web app See Me Reminder.`
        );
        return NextResponse.json({ ok: true });
      }

      const { data: updatedTask, error } = await adminSupabase
        .from("tasks")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("id", taskId)
        .eq("user_id", profile.id)
        .select("title")
        .single();

      if (error || !updatedTask) {
        await sendTelegramMessage(
          chatId,
          `❌ Tugas dengan ID <code>${taskId}</code> tidak ditemukan atau bukan milik Anda.`
        );
      } else {
        await sendTelegramMessage(
          chatId,
          `🎉 <b>Tugas Selesai!</b>\n\n"<s>${updatedTask.title}</s>" telah ditandai sebagai selesai di See Me Reminder.`
        );
      }

      return NextResponse.json({ ok: true });
    }

    // Handle /help
    if (text.startsWith("/help")) {
      await sendTelegramMessage(
        chatId,
        `🤖 <b>See Me Reminder Bot — Bantuan Perintah:</b>\n\n` +
          `• <code>/start &lt;kode&gt;</code> — Hubungkan akun web app\n` +
          `• <code>/done &lt;id_tugas&gt;</code> — Tandai tugas selesai langsung dari chat\n` +
          `• <code>/help</code> — Menampilkan pesan bantuan ini`
      );
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error processing Telegram webhook:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTelegramMessage } from "@/lib/telegram";

export async function GET(request: NextRequest) {
  return handleCron(request);
}

export async function POST(request: NextRequest) {
  return handleCron(request);
}

interface DueTaskItem {
  id: string;
  title: string;
  description: string | null;
  date: string;
  start_time: string | null;
  end_time: string | null;
  is_important: boolean;
  is_urgent: boolean;
  reminder_at: string | null;
  user_id: string;
  profiles: {
    telegram_chat_id: string | null;
    email: string | null;
  };
  task_categories?: {
    categories?: {
      name: string;
    };
  }[];
}

async function handleCron(request: NextRequest) {
  // Verify Bearer CRON_SECRET
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminSupabase = createAdminClient();
  const now = new Date().toISOString();

  try {
    const { data: rawTasks, error: taskError } = await adminSupabase
      .from("tasks")
      .select(`
        id,
        title,
        description,
        date,
        start_time,
        end_time,
        is_important,
        is_urgent,
        reminder_at,
        user_id,
        profiles!inner (
          telegram_chat_id,
          email
        ),
        task_categories (
          categories (
            name
          )
        )
      `)
      .eq("status", "pending")
      .eq("reminder_sent", false)
      .not("reminder_at", "is", null)
      .lte("reminder_at", now);

    if (taskError) {
      console.error("Error fetching due reminder tasks:", taskError);
      return NextResponse.json({ error: taskError.message }, { status: 500 });
    }

    const dueTasks = (rawTasks || []) as unknown as DueTaskItem[];

    if (dueTasks.length === 0) {
      return NextResponse.json({ message: "No reminders due", processed: 0 });
    }

    let sentCount = 0;

    for (const task of dueTasks) {
      const chatId = task.profiles?.telegram_chat_id;

      if (!chatId) {
        await adminSupabase
          .from("tasks")
          .update({ reminder_sent: true, updated_at: now })
          .eq("id", task.id);
        continue;
      }

      // Format quadrant
      let quadrantText = "⬜ <b>Kuadran:</b> Eliminasi (Tidak Mendesak & Tidak Penting)";
      if (task.is_important && task.is_urgent) {
        quadrantText = "🔴 <b>Kuadran:</b> Kerjakan Dulu (Mendesak & Penting)";
      } else if (task.is_important && !task.is_urgent) {
        quadrantText = "🟡 <b>Kuadran:</b> Jadwalkan (Tidak Mendesak & Penting)";
      } else if (!task.is_important && task.is_urgent) {
        quadrantText = "🔵 <b>Kuadran:</b> Delegasikan (Mendesak & Tidak Penting)";
      }

      // Format categories
      const catNames = task.task_categories
        ?.map((tc) => tc.categories?.name)
        .filter(Boolean)
        .join(", ");

      const message =
        `⏰ <b>PENGINGAT TUGAS — SEE ME REMINDER</b>\n\n` +
        `📌 <b>Judul:</b> ${task.title}\n` +
        (task.description ? `📝 <b>Deskripsi:</b> ${task.description}\n` : "") +
        `📅 <b>Tanggal:</b> ${task.date}\n` +
        (task.start_time ? `🕒 <b>Waktu:</b> ${task.start_time}${task.end_time ? ` - ${task.end_time}` : ""}\n` : "") +
        (catNames ? `🏷️ <b>Kategori:</b> ${catNames}\n` : "") +
        `${quadrantText}\n\n` +
        `✅ <i>Tandai selesai sekarang:</i>\n<code>/done ${task.id}</code>`;

      const result = await sendTelegramMessage(chatId, message);

      if (result.ok) {
        sentCount++;
      }

      // Mark as sent
      await adminSupabase
        .from("tasks")
        .update({ reminder_sent: true, updated_at: now })
        .eq("id", task.id);
    }

    return NextResponse.json({
      message: "Reminders processed successfully",
      processed: dueTasks.length,
      sent: sentCount,
    });
  } catch (error) {
    console.error("Error in reminder cron handler:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

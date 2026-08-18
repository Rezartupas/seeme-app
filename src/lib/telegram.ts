const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function sendTelegramMessage(chatId: string | number, text: string) {
  if (!BOT_TOKEN) {
    console.error("TELEGRAM_BOT_TOKEN is not configured.");
    return { ok: false, description: "Bot token not configured" };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
      }),
    });
    return await res.json();
  } catch (error) {
    console.error("Error sending Telegram message:", error);
    return { ok: false, error };
  }
}

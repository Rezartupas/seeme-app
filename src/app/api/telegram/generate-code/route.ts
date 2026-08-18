import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Generate 6-digit random code
  const linkCode = String(Math.floor(100000 + Math.random() * 900000));
  // Expires in 10 minutes
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from("profiles")
    .update({
      telegram_link_code: linkCode,
      telegram_link_code_expires_at: expiresAt,
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ code: linkCode, expiresAt });
}

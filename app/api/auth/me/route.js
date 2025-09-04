// /app/api/auth/me/route.js
export const runtime = "edge";

import { getCookie } from "@/lib/session";

export async function GET() {
  try {
    const raw = getCookie("sess");
    if (!raw) return new Response(JSON.stringify({ ok: false }), { headers: { "Content-Type": "application/json" } });

    const json = JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
    if (json?.user) {
      return new Response(JSON.stringify({ ok: true, user: json.user }), { headers: { "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ ok: false }), { headers: { "Content-Type": "application/json" } });
  } catch {
    return new Response(JSON.stringify({ ok: false }), { headers: { "Content-Type": "application/json" } });
  }
}

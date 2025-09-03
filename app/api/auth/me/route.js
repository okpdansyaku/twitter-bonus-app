// /app/api/auth/me/route.js
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();

  if (session.user) {
    return Response.json({ ok: true, user: session.user });
  }
  return Response.json({ ok: false });
}

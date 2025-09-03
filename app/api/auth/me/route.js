import { getSession } from "@/lib/session";

export async function GET(req) {
  const session = await getSession(req);
  const user = session.get("user"); // callbackで保存した { id, username, name, ... }

  if (!user) {
    return Response.json({ ok: false, user: null });
  }
  return Response.json({ ok: true, user });
}

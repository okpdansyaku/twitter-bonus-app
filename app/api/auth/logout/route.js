import { getSession } from "@/lib/session";

export async function POST(req) {
  const session = await getSession(req);
  session.destroy();                // セッション破棄
  // 返り値は自由。必要ならトップへリダイレクト
  return Response.json({ ok: true });
}

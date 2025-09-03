// /app/api/auth/logout/route.js
import { getSession } from "@/lib/session";

export async function GET(request) {
  const session = await getSession();
  await session.destroy();

  // 終了後はトップへリダイレクト
  return Response.redirect(new URL("/", request.url));
}

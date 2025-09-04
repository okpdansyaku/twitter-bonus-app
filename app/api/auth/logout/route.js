// /app/api/auth/logout/route.js
export const runtime = "edge";

import { deleteCookie } from "@/lib/session";

export async function GET(request) {
  deleteCookie("sess");
  deleteCookie("pkce_verifier");
  deleteCookie("oauth_state");
  return Response.redirect(new URL("/", request.url));
}

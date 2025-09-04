// /app/api/auth/start/route.js
export const runtime = "nodejs";

import { getSession } from "@/lib/session";
import { randomBytes, createHash } from "crypto";

function base64url(buf) {
  return Buffer.from(buf)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

export async function GET() {
  try {
    if (!process.env.TW_CLIENT_ID || !process.env.TW_CALLBACK_URL) {
      return Response.json(
        { ok: false, error: "missing env TW_CLIENT_ID/TW_CALLBACK_URL" },
        { status: 500 }
      );
    }

    // 1) PKCE: verifier & challenge(S256)
    const verifier = base64url(randomBytes(64)); // 86文字前後
    const challenge = base64url(createHash("sha256").update(verifier).digest());

    // 2) CSRF state
    const state = base64url(randomBytes(24));

    // 3) セッション保存
    const session = await getSession();
    session.pkce_verifier = verifier;
    session.oauth_state = state;
    await session.save();

    // 4) 認可URL
    const authz = new URL("https://twitter.com/i/oauth2/authorize");
    authz.searchParams.set("response_type", "code");
    authz.searchParams.set("client_id", process.env.TW_CLIENT_ID);
    authz.searchParams.set("redirect_uri", process.env.TW_CALLBACK_URL);
    authz.searchParams.set("scope", ["tweet.read", "users.read", "offline.access"].join(" "));
    authz.searchParams.set("state", state);
    authz.searchParams.set("code_challenge", challenge);
    authz.searchParams.set("code_challenge_method", "S256");

    return Response.redirect(authz.toString());
  } catch (e) {
    console.error("[auth/start] error:", e);
    return Response.json({ ok: false, error: "start_failed" }, { status: 500 });
  }
}

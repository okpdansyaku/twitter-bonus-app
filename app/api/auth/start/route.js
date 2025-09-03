import { NextResponse } from "next/server";
import crypto from "crypto";

// base64url 変換（PKCE用）
const b64url = (buf) =>
  buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

export async function GET() {
  const clientId = process.env.TW_CLIENT_ID;
  const redirectUri = process.env.TW_CALLBACK_URL;
  if (!clientId || !redirectUri) {
    return NextResponse.json({ ok: false, error: "Missing env" }, { status: 500 });
  }

  // PKCE: code_verifier と code_challenge(S256)
  const codeVerifier = b64url(crypto.randomBytes(32));                       // 43〜128文字
  const codeChallenge = b64url(crypto.createHash("sha256").update(codeVerifier).digest());

  // CSRF対策
  const state = b64url(crypto.randomBytes(16));

  // 認可URL（必要スコープだけ）
  const scopes = "tweet.read users.read";
  const url = new URL("https://twitter.com/i/oauth2/authorize");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", scopes);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");

  // 本番ドメインで有効な HttpOnly Cookie に保存（10分）
  const res = NextResponse.redirect(url.toString());
  res.cookies.set("oauth_state", state,        { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 600 });
  res.cookies.set("pkce_verifier", codeVerifier,{ httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 600 });

  // （デバッグ用）発行したURLをログに出す → Vercel / Runtime Logs で見られる
  console.log("[auth/start] authorize_url:", url.toString());
  return res;
}

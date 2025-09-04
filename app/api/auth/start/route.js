// /app/api/auth/start/route.js
import { getSession } from "@/lib/session";
import crypto from "crypto";

/**
 * 必須:
 * - TW_CLIENT_ID
 * - TW_CALLBACK_URL 例: https://okp-d-rt-bonus.vercel.app/api/auth/callback
 */

function base64url(buf) {
  return buf.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

export async function GET(request) {
  // 1) ランダムな code_verifier を生成（43〜128文字推奨）
  const verifier = base64url(crypto.randomBytes(64));

  // 2) S256 で code_challenge を生成
  const challenge = base64url(crypto.createHash("sha256").update(verifier).digest());

  // 3) CSRF対策の state も生成
  const state = base64url(crypto.randomBytes(24));

  // 4) セッションに保存
  const session = await getSession();
  session.pkce_verifier = verifier;
  session.oauth_state = state;
  await session.save();

  // 5) 認可エンドポイントへ
  const authz = new URL("https://twitter.com/i/oauth2/authorize");
  authz.searchParams.set("response_type", "code");
  authz.searchParams.set("client_id", process.env.TW_CLIENT_ID);
  authz.searchParams.set("redirect_uri", process.env.TW_CALLBACK_URL);
  authz.searchParams.set("scope", ["tweet.read", "users.read", "offline.access"].join(" "));
  authz.searchParams.set("state", state);
  authz.searchParams.set("code_challenge", challenge);
  authz.searchParams.set("code_challenge_method", "S256");

  return Response.redirect(authz.toString());
}

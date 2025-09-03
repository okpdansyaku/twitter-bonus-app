// app/api/auth/start/route.js
import crypto from "crypto";
import { cookies } from "next/headers";

const AUTH_URL = "https://twitter.com/i/oauth2/authorize";

// Base64URL 変換
function b64url(buf) {
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

// PKCE: code_verifier / code_challenge 生成
function createPkce() {
  const verifier = b64url(crypto.randomBytes(32)); // 43〜128 文字
  const challenge = b64url(crypto.createHash("sha256").update(verifier).digest());
  return { verifier, challenge };
}

// state 生成
function createState() {
  return b64url(crypto.randomBytes(24));
}

// Cookie 共通オプション
const cookieOpts = {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 10, // 10分
};

export async function GET(request) {
  const id = process.env.TW_CLIENT_ID;
  const callback = process.env.TW_CALLBACK_URL;

  // 必須環境変数チェック
  if (!id || !callback) {
    return new Response(JSON.stringify({ ok: false, error: "Missing env" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  // PKCE & state を発行し Cookie に保存
  const { verifier, challenge } = createPkce();
  const state = createState();
  const jar = cookies();
  jar.set("pv_code_verifier", verifier, cookieOpts);
  jar.set("pv_state", state, cookieOpts);

  // 必要スコープ：最小限（必要に応じて追加）
  const scope = [
    "tweet.read",
    "users.read",
    // "offline.access", // リフレッシュトークンが欲しい場合は追加
  ].join(" ");

  // 認可エンドポイントへ
  const url = new URL(AUTH_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", id);
  url.searchParams.set("redirect_uri", callback);
  url.searchParams.set("scope", scope);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");

  return Response.redirect(url.toString(), 302);
}

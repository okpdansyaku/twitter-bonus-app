// /app/api/auth/start/route.js
export const runtime = "edge";

import { setCookie } from "@/lib/session";

function b64urlFromBytes(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
async function s256(input) {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return b64urlFromBytes(new Uint8Array(hash));
}

export async function GET() {
  try {
    if (!process.env.TW_CLIENT_ID || !process.env.TW_CALLBACK_URL) {
      return new Response(JSON.stringify({ ok: false, error: "missing env" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // PKCE: verifier & challenge
    const rand = new Uint8Array(64);
    crypto.getRandomValues(rand);
    const verifier = b64urlFromBytes(rand);
    const challenge = await s256(verifier);

    // CSRF: state
    const st = new Uint8Array(24);
    crypto.getRandomValues(st);
    const state = b64urlFromBytes(st);

    // Cookieに保存（HttpOnly / SameSite=Lax）
    setCookie("pkce_verifier", verifier, { maxAgeSec: 600 });
    setCookie("oauth_state", state, { maxAgeSec: 600 });

    // 認可URL
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
    return new Response(JSON.stringify({ ok: false, error: "start_failed", detail: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

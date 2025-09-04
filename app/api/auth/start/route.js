// /app/api/auth/start/route.js
export const runtime = "edge";

import { getSession } from "@/lib/session";

function b64urlFromBytes(bytes) {
  let str = "";
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
async function s256(challengeText) {
  const data = new TextEncoder().encode(challengeText);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return b64urlFromBytes(new Uint8Array(hash));
}

export async function GET() {
  try {
    if (!process.env.TW_CLIENT_ID || !process.env.TW_CALLBACK_URL) {
      return new Response(
        JSON.stringify({ ok: false, error: "missing env TW_CLIENT_ID/TW_CALLBACK_URL" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // PKCE: verifier（43～128） & challenge(S256)
    const rand = new Uint8Array(64);
    crypto.getRandomValues(rand);
    const verifier = b64urlFromBytes(rand);
    const challenge = await s256(verifier);

    // CSRF state
    const stateBytes = new Uint8Array(24);
    crypto.getRandomValues(stateBytes);
    const state = b64urlFromBytes(stateBytes);

    // セッション保存
    const session = await getSession();
    session.pkce_verifier = verifier;
    session.oauth_state = state;
    await session.save();

    // 認可URL
    const auth

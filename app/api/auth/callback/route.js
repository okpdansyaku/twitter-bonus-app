// /app/api/auth/callback/route.js
export const runtime = "nodejs";

import { getSession } from "@/lib/session";

const TOKEN_URL = "https://api.twitter.com/2/oauth2/token";
const USER_URL = "https://api.twitter.com/2/users/me";

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const returnedState = url.searchParams.get("state");
    if (!code) return Response.json({ ok: false, error: "missing code" }, { status: 400 });

    const session = await getSession();
    const verifier = session.pkce_verifier;
    const savedState = session.oauth_state;

    if (!verifier) {
      return Response.json({ ok: false, error: "missing verifier in session" }, { status: 400 });
    }
    if (!savedState || savedState !== returnedState) {
      return Response.json({ ok: false, error: "state mismatch" }, { status: 400 });
    }
    if (!process.env.TW_CLIENT_ID || !process.env.TW_CALLBACK_URL) {
      return Response.json(
        { ok: false, error: "missing env TW_CLIENT_ID/TW_CALLBACK_URL" },
        { status: 500 }
      );
    }

    // PKCE トークン交換（Basic 認証は不要）
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.TW_CLIENT_ID,
      redirect_uri: process.env.TW_CALLBACK_URL,
      code,
      code_verifier: verifier,
    });

    const tokenRes = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!tokenRes.ok) {
      const t = await tokenRes.text();
      return Response.json(
        { ok: false, error: "token exchange failed", detail: t },
        { status: 400 }
      );
    }

    const tokenJson = await tokenRes.json();
    const accessToken = tokenJson.access_token;

    // 自分のユーザー情報
    const userRes = await fetch(`${USER_URL}?user.fields=protected`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!userRes.ok) {
      const t = await userRes.text();
      return Response.json(
        { ok: false, error: "fetch user failed", detail: t },
        { status: 400 }
      );
    }
    const { data: u } = await userRes.json();

    // セッション保存
    session.user = {
      id: u.id,
      username: u.username,
      name: u.name,
      protected: u.protected,
    };
    session.access_token = accessToken;
    delete session.pkce_verifier;
    delete session.oauth_state;
    await session.save();

    return Response.redirect(new URL("/", request.url));
  } catch (e) {
    console.error("[auth/callback] error:", e);
    return Response.json({ ok: false, error: "callback_failed" }, { status: 500 });
  }
}

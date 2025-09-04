// /app/api/auth/callback/route.js
export const runtime = "edge";

import { getSession } from "@/lib/session";

const TOKEN_URL = "https://api.twitter.com/2/oauth2/token";
const USER_URL  = "https://api.twitter.com/2/users/me";

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const returnedState = url.searchParams.get("state");
    if (!code) {
      return new Response(JSON.stringify({ ok: false, error: "missing code" }), {
        status: 400, headers: { "Content-Type": "application/json" },
      });
    }

    const session = await getSession();
    const verifier   = session.pkce_verifier;
    const savedState = session.oauth_state;

    if (!verifier) {
      return new Response(JSON.stringify({ ok:false, error:"missing verifier in session" }), {
        status: 400, headers: { "Content-Type": "application/json" },
      });
    }
    if (!savedState || savedState !== returnedState) {
      return new Response(JSON.stringify({ ok:false, error:"state mismatch" }), {
        status: 400, headers: { "Content-Type": "application/json" },
      });
    }

    // トークン交換（PKCE。Basic認証は不要）
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
      return new Response(JSON.stringify({ ok:false, error:"token exchange failed", detail:t }), {
        status: 400, headers: { "Content-Type": "application/json" },
      });
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
      return new Response(JSON.stringify({ ok:false, error:"fetch user failed", detail:t }), {
        status: 400, headers: { "Content-Type": "application/json" },
      });
    }
    const { data: u } = await userRes.json();

    // セッション保存
    session.user = { id: u.id, username: u.username, name: u.name, protected: u.protected };
    session.access_token = accessToken;
    delete session.pkce_verifier;
    delete session.oauth_state;
    await session.save();

    return Response.redirect(new URL("/", request.url));
  } catch (e) {
    return new Response(JSON.stringify({ ok:false, error:"callback_failed", detail:String(e?.message||e) }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
}

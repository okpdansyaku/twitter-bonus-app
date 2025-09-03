import { NextResponse } from "next/server";
import { Buffer } from "buffer";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code  = searchParams.get("code");
  const state = searchParams.get("state");
  const stateCookie = request.cookies.get("oauth_state")?.value;
  const codeVerifier = request.cookies.get("pkce_verifier")?.value;

  // パラメータと state 検証
  if (!code || !state || !stateCookie || state !== stateCookie) {
    return NextResponse.json({ ok: false, step: "state", error: "invalid_state_or_code" }, { status: 400 });
  }
  if (!codeVerifier) {
    return NextResponse.json({ ok: false, step: "pkce", error: "missing_code_verifier" }, { status: 400 });
  }

  const clientId = process.env.TW_CLIENT_ID;
  const clientSecret = process.env.TW_CLIENT_SECRET;
  const redirectUri = process.env.TW_CALLBACK_URL;
  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json({ ok: false, step: "env", error: "missing_env" }, { status: 500 });
  }

  // --- 認可コード → アクセストークン（PKCE: code_verifier を送る）---
  const tokenRes = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      // 機密クライアントなので Basic 認証でOK（付けない場合は client_id を body に含める）
      Authorization: "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
    cache: "no-store",
  });

  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    console.error("token error:", tokenRes.status, text);
    return NextResponse.json({ ok: false, step: "token", status: tokenRes.status, error: text }, { status: 400 });
  }

  const token = await tokenRes.json();
  const accessToken = token.access_token;

  // --- 動作確認: /2/users/me を呼ぶ（鍵アカ情報も一緒に） ---
  const meRes = await fetch(
    "https://api.twitter.com/2/users/me?user.fields=protected,username,name",
    { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" }
  );

  if (!meRes.ok) {
    const text = await meRes.text();
    console.error("me error:", meRes.status, text);
    return NextResponse.json({ ok: false, step: "me", status: meRes.status, error: text }, { status: 400 });
  }

  const me = await meRes.json();

  // 後片付け（state / verifier を破棄）
  const res = NextResponse.json({
    ok: true,
    user: me?.data ?? null,
    hint: "本番では access_token を安全なストアに保存して使います",
  });
  res.cookies.set("oauth_state", "", { path: "/", maxAge: 0 });
  res.cookies.set("pkce_verifier", "", { path: "/", maxAge: 0 });
  return res;
}

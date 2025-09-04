// /app/api/auth/callback/route.js
import { getSession } from "@/lib/session";

const TOKEN_URL = "https://api.twitter.com/2/oauth2/token";
const USER_URL = "https://api.twitter.com/2/users/me";

/**
 * 必須:
 * - TW_CLIENT_ID
 * - TW_CLIENT_SECRET（サーバ側なので持っていてOK）
 * - TW_CALLBACK_URL
 * - SESSION_PASSWORD
 */
export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");

  if (!code) {
    return Response.json({ ok: false, error: "missing code" }, { status: 400 });
  }

  // セッションから PKCE / state を取得
  const session = await getSession();
  const verifier = session.pkce_verifier;
  const savedState = session.oauth_state;

  if (!verifier) {
    return Response.json({ ok: false, error: "missing verifier in session" }, { status: 400 });
  }
  if (!savedState || savedState !== returnedState) {
    return Response.json({ ok: false, error: "state mismatch" }, { status: 400 });
  }

  // トークン交換（PKCE）
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
    // PKCE なので Authorization ヘッダは不要。client_id + code_verifier でOK。
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

  // セッション保存（後で使う）
  session.user = {
    id: u.id,
    username: u.username,
    name: u.name,
    protected: u.protected,
  };
  session.access_token = accessToken;

  // 使い終わった PKCE / state は掃除
  delete session.pkce_verifier;
  delete session.oauth_state;

  await session.save();

  // トップへ
  return Response.redirect(new URL("/", request.url));
}

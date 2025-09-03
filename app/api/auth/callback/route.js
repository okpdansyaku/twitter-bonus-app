// /app/api/auth/callback/route.js
import { getSession } from "@/lib/session";

/**
 * 期待する環境変数
 * - TW_CLIENT_ID
 * - TW_CLIENT_SECRET
 * - TW_CALLBACK_URL（例: https://okp-d-rt-bonus.vercel.app/api/auth/callback）
 * - SESSION_PASSWORD（/lib/session.js で使用）
 */
const TOKEN_URL = "https://api.twitter.com/2/oauth2/token";
const USER_URL = "https://api.twitter.com/2/users/me";

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const codeVerifier = url.searchParams.get("code_verifier") || undefined;

  if (!code) {
    return Response.json({ ok: false, error: "missing code" }, { status: 400 });
  }

  // ▼ トークン交換（PKCE / S256）
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: process.env.TW_CALLBACK_URL,
    client_id: process.env.TW_CLIENT_ID,
    code_verifier: codeVerifier ?? "", // start 側で保存しておいた verifier を渡す実装でもOK
  });

  const tokenRes = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(
          `${process.env.TW_CLIENT_ID}:${process.env.TW_CLIENT_SECRET}`
        ).toString("base64"),
    },
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

  // ▼ ユーザー情報を取得（認証テスト）
  const userRes = await fetch(`${USER_URL}?user.fields=protected`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!userRes.ok) {
    const t = await userRes.text();
    return Response.json(
      { ok: false, error: "fetch user failed", detail: t },
      { status: 400 }
    );
  }

  const userJson = await userRes.json();
  const u = userJson.data;

  // ▼ セッションに保存
  const session = await getSession();
  session.user = {
    id: u.id,
    username: u.username,
    name: u.name,
    protected: u.protected,
  };
  // 本番では DB 等に保存推奨。最小構成のためセッションに保存するなら暗号強度の高い SESSION_PASSWORD を必須に。
  session.access_token = accessToken;

  await session.save();

  // ▼ トップへ戻す
  return Response.redirect(new URL("/", request.url));
}

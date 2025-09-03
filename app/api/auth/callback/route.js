// app/api/auth/callback/route.js
import { getSession } from "@/lib/session";

function redirectWithError(req, code, message) {
  const u = new URL("/", req.url);
  if (code) u.searchParams.set("error", code);
  if (message) u.searchParams.set("message", message);
  return Response.redirect(u); // 302
}

export async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const err = url.searchParams.get("error");
  const errDesc = url.searchParams.get("error_description");

  // 1) ユーザーが拒否した / エラー戻り
  if (err) {
    return redirectWithError(req, err, errDesc ?? "authorization failed");
  }

  // 2) 必須 ENV
  if (
    !process.env.TW_CLIENT_ID ||
    !process.env.TW_CLIENT_SECRET ||
    !process.env.TW_CALLBACK_URL
  ) {
    return redirectWithError(req, "missing_env", "Required env vars are not set");
  }

  // 3) セッションから PKCE と state を取り出す
  const session = await getSession(req);
  const expectedState = session.get("oauth_state");
  const codeVerifier = session.get("pkce_verifier");

  if (!expectedState || state !== expectedState) {
    return redirectWithError(req, "bad_state", "Invalid OAuth state");
  }
  if (!code || !codeVerifier) {
    return redirectWithError(req, "missing_code", "Missing code or verifier");
  }

  try {
    // 4) 認可コードをアクセストークンに交換
    const tokenParams = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.TW_CLIENT_ID,
      redirect_uri: process.env.TW_CALLBACK_URL,
      code,
      code_verifier: codeVerifier,
    });

    const tokenRes = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenParams,
    });

    const tokenJson = await tokenRes.json();

    if (!tokenRes.ok) {
      // Twitter 側のエラーレスポンスをメッセージに入れる
      return redirectWithError(
        req,
        "token_exchange_failed",
        tokenJson?.error_description || tokenJson?.error || "token error"
      );
    }

    const {
      access_token,
      refresh_token,
      expires_in, // 秒
      token_type,
      scope,
    } = tokenJson;

    // 5) アカウント情報を取得
    const meRes = await fetch(
      "https://api.twitter.com/2/users/me?user.fields=protected,name,username",
      {
        headers: { Authorization: `Bearer ${access_token}` },
        cache: "no-store",
      }
    );
    const meJson = await meRes.json();

    if (!meRes.ok || !meJson?.data) {
      return redirectWithError(req, "me_failed", "Failed to fetch user");
    }

    const user = meJson.data; // { id, username, name, protected }

    // 6) セッション保存
    session.set("user", {
      id: user.id,
      username: user.username,
      name: user.name,
      protected: Boolean(user.protected),
    });

    // トークンも必要に応じて保存（本番は暗号化ストア推奨）
    session.set("token", {
      access_token,
      refresh_token,
      token_type,
      scope,
      // 失効時刻をミリ秒で保存
      expires_at: Date.now() + (Number(expires_in) || 0) * 1000,
    });

    // 使い終わった PKCE / state は消す
    session.set("pkce_verifier", undefined);
    session.set("oauth_state", undefined);

    await session.save();

    // 7) ホームへリダイレクト
    return Response.redirect(new URL("/", req.url));
  } catch (e) {
    console.error("[callback] unexpected error", e);
    return redirectWithError(req, "callback_exception", "Unexpected error");
  }
}

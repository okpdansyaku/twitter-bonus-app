// /app/api/bonus/check/route.js
export const runtime = "edge";

import { requireAuth } from "@/lib/auth";
import { extractTweetId, urlForTweet } from "@/lib/bonus";

const RETWEETED_BY = (id) => `https://api.twitter.com/2/tweets/${id}/retweeted_by`;

/**
 * クエリ: ?tweetId=123 or ?tweetId=https://twitter.com/.../status/123
 * 戻り: { ok: true, eligible: boolean, url: string, tweetId: string }
 */
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("tweetId");
    const tweetId = extractTweetId(q || "");
    if (!tweetId) {
      return new Response(JSON.stringify({ ok: false, error: "invalid_tweet_id" }), {
        status: 400, headers: { "Content-Type": "application/json" }
      });
    }

    const sess = requireAuth();
    if (!sess) {
      return new Response(JSON.stringify({ ok: false, error: "not_authenticated" }), {
        status: 401, headers: { "Content-Type": "application/json" }
      });
    }

    const targetUrl = urlForTweet(tweetId);

    // 方式: /2/tweets/:id/retweeted_by で現在ユーザーIDが含まれるかを探す
    // （最大数ページまでスキャン／見つかり次第終了）
    let eligible = false;
    let next = undefined;
    let safety = 0;

    while (!eligible && safety < 10) { // 安全のため最大10ページ
      const apiUrl = new URL(RETWEETED_BY(tweetId));
      apiUrl.searchParams.set("max_results", "100");
      apiUrl.searchParams.set("user.fields", "id");
      if (next) apiUrl.searchParams.set("pagination_token", next);

      const res = await fetch(apiUrl.toString(), {
        headers: { Authorization: `Bearer ${sess.access_token}` },
        cache: "no-store",
      });

      if (!res.ok) {
        const t = await res.text();
        return new Response(JSON.stringify({ ok: false, error: "twitter_api_error", detail: t }), {
          status: 400, headers: { "Content-Type": "application/json" }
        });
      }

      const j = await res.json();
      const list = j?.data || [];
      eligible = !!list.find(u => u.id === sess.user.id);
      next = j?.meta?.next_token || undefined;
      safety += 1;

      if (!next) break; // もうページ無し
    }

    return new Response(JSON.stringify({
      ok: true,
      eligible,
      url: eligible ? targetUrl : null,
      tweetId,
    }), { headers: { "Content-Type": "application/json" } });

  } catch (e) {
    return new Response(JSON.stringify({ ok:false, error:"check_failed", detail:String(e) }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }
}

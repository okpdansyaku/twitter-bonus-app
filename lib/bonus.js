// /lib/bonus.js

/**
 * ここに「ツイートID => 特別ページURL」を登録します。
 * 例: "1870000000000000000": { url: "/special/launch" }
 *
 * ※ とりあえず最小構成としてコード内に直書き。
 *    後でCMSやDBに差し替えてOKです。
 */
export const BONUS_MAP = {
  // 例:
  // "1870000000000000000": { url: "/special/launch" },
  "1963001596373303785": { url: "/special/okp3rd-campaign" },
};

/** マップに無ければ /special/[tweetId] を既定URLとして返す */
export function urlForTweet(tweetId) {
  return (BONUS_MAP[tweetId]?.url) || `/special/${tweetId}`;
}
// /lib/bonus.js の extractTweetId を置き換え
export function extractTweetId(input) {
  if (!input) return null;

  // 1) まず decode（%xx や + を素直に戻す）
  let s = String(input).trim();
  try {
    s = decodeURIComponent(s.replace(/\+/g, "%20")); // 念のため + もスペース化
  } catch (_) {}

  // 2) URLなら /status/<id> を優先して抜く
  try {
    const u = new URL(s);
    const m1 = u.pathname.match(/(?:status|statuses)\/(\d{10,25})/);
    if (m1 && m1[1]) return m1[1];
  } catch (_) {
    // URLでなければ無視
  }

  // 3) 文字列全体から長い数字列を最後の手段として拾う
  const m2 = s.match(/\d{10,25}/);
  if (m2 && m2[0]) return m2[0];

  // 4) 純粋に数字だけが来ていた場合
  if (/^\d+$/.test(s)) return s;

  return null;
}

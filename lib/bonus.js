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
/** ツイートURLや埋め込みURLから数値IDだけを抜き出す */
export function extractTweetId(input) {
  if (!input) return null;

  // まずは URL エンコードされている場合をデコード
  let s = String(input).trim();
  try {
    s = decodeURIComponent(s);
  } catch (_) {
    // 失敗しても無視
  }

  // URL として解釈できる場合は /status/<id> の末尾を取る
  try {
    const url = new URL(s);
    const parts = url.pathname.split("/");
    const id = parts.pop() || parts.pop(); // 末尾 or 末尾が空ならその前
    if (/^\d+$/.test(id)) return id;
  } catch (_) {
    // URL でない場合は下の数値直書き判定へ
  }

  // 直接 数字だけが渡された場合
  if (/^\d+$/.test(s)) return s;

  return null;
}

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
  const trimmed = input.trim();
  // 完全に数字だけならそのまま
  if (/^\d{5,}$/.test(trimmed)) return trimmed;
  // URL から /status/123... を抽出
  const m = trimmed.match(/status\/(\d{5,})/);
  return m ? m[1] : null;
}

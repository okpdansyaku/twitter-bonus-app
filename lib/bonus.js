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

  // もし URL が来た場合
  try {
    const url = new URL(input);
    const parts = url.pathname.split("/");
    const id = parts.pop() || parts.pop(); // 末尾のID部分
    if (/^\d+$/.test(id)) return id;
  } catch (e) {
    // input が URL でない場合は無視
  }

  // 数字だけの場合
  if (/^\d+$/.test(input)) {
    return input;
  }

  return null;
}
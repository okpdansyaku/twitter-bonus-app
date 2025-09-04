// /app/special/okp3rd-campaign/page.js
export const runtime = "edge";

export default function Okp3rdCampaignPage() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>🎁 OKP3rd キャンペーン特典</h1>
      <p>リツイートありがとう！このページは <b>@Okp3rd</b> の対象投稿をRTした人だけに公開しています。</p>

      <section style={{ marginTop: 16 }}>
        <h2>特典リンク</h2>
        <ul>
          <li><a href="https://example.com/bonus-file.pdf" target="_blank" rel="noreferrer">限定PDF</a></li>
          <li><a href="https://example.com/hidden-video" target="_blank" rel="noreferrer">限定動画</a></li>
        </ul>
      </section>

      <p style={{ marginTop: 24, opacity: 0.7 }}>
        （このページの中身は自由に編集してください）
      </p>
    </main>
  );
}

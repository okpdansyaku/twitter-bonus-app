// /app/special/okp3rd-campaign/page.js
export const runtime = "edge";

export default function Okp3rdCampaignPage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>🎁 OKP3rd キャンペーン特典</h1>
      <p>リツイートありがとうございます！</p>

      <p>このページは <b>対象ツイートをRT</b> してくれた方だけが見られる限定コンテンツです。</p>

      <section style={{ marginTop: 24 }}>
        <h2>特典リンク</h2>
        <ul>
          <li>
            <a href="https://example.com/bonus-file.pdf" target="_blank">
              限定PDFをダウンロード
            </a>
          </li>
        </ul>
      </section>
    </main>
  );
}

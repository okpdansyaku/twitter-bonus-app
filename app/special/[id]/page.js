// /app/special/[id]/page.js
export const runtime = "edge";

export default function SpecialPage({ params }) {
  const { id } = params;
  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>🎉 特別ページ</h1>
      <p>このページは、ツイート <code>{id}</code> をリツイートしてくれた人だけのページです。</p>
      <p>（ここに限定コンテンツやリンクを配置してください）</p>
    </main>
  );
}

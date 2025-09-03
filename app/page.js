// app/page.js
export default function Home() {
  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Twitter Bonus App</h1>
      <p>ログインしてボーナス機能を試す</p>
      <a
        href="/api/auth/start"
        style={{
          display: "inline-block",
          padding: "10px 20px",
          background: "#1DA1F2",
          color: "white",
          borderRadius: "5px",
          textDecoration: "none",
          marginTop: "20px",
        }}
      >
        Twitterでログイン
      </a>
    </main>
  );
}

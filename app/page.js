// /app/page.js
"use client";

import { useEffect, useState } from "react";

export default function Page() {
  const [me, setMe] = useState({ loading: true, ok: false, user: null });

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/auth/me", { cache: "no-store" });
        const j = await r.json();
        setMe({ loading: false, ...j });
      } catch (e) {
        setMe({ loading: false, ok: false, user: null });
      }
    })();
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <h1>Twitter Bonus App</h1>
      <p>ログインしてボーナス機能を試す</p>

      {me.loading ? (
        <p>読み込み中...</p>
      ) : me.ok ? (
        <>
          <p>
            ログイン中：<b>@{me.user.username}</b>（{me.user.name}）
          </p>
          <a
            href="/api/auth/logout"
            style={{
              display: "inline-block",
              padding: "10px 16px",
              background: "#444",
              color: "#fff",
              borderRadius: 6,
              textDecoration: "none",
            }}
          >
            ログアウト
          </a>
        </>
      ) : (
        <a
          href="/api/auth/start"
          style={{
            display: "inline-block",
            padding: "10px 16px",
            background: "#1d9bf0",
            color: "#fff",
            borderRadius: 6,
            textDecoration: "none",
          }}
        >
          Twitterでログイン
        </a>
      )}
    </main>
  );
}

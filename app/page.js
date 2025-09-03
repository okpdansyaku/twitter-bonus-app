"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (d.ok) setUser(d.user);
      setLoading(false);
    });
  }, []);

  const onLogin = () => {
    // そのまま start へ
    window.location.href = "/api/auth/start";
  };

  const onLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  };

  if (loading) return null;

  return (
    <main className="p-10 text-white">
      <h1 className="text-4xl font-bold mb-6">リツイートボーナス</h1>

      {!user ? (
        <>
          <p className="mb-6">ログインしてボーナス機能を試す</p>
          <button
            onClick={onLogin}
            className="bg-sky-600 hover:bg-sky-500 px-6 py-3 rounded-lg font-semibold"
          >
            Twitterでログイン
          </button>
        </>
      ) : (
        <>
          <p className="mb-4">
            ようこそ <b>{user.name}</b> (@{user.username})
          </p>
          <button
            onClick={onLogout}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded"
          >
            ログアウト
          </button>
        </>
      )}
    </main>
  );
}

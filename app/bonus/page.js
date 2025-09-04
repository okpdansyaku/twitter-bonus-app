 // /app/bonus/page.js
 "use client";
 
-import { useState } from "react";
+import { useEffect, useState } from "react";
 
 export default function BonusPage() {
   const [input, setInput] = useState("");
   const [result, setResult] = useState(null);
   const [loading, setLoading] = useState(false);
 
   async function check() {
     setLoading(true);
     setResult(null);
     try {
       const r = await fetch(`/api/bonus/check?tweetId=${encodeURIComponent(input)}`, { cache: "no-store" });
       const j = await r.json();
       setResult(j);
     } catch (e) {
       setResult({ ok: false, error: String(e) });
     } finally {
       setLoading(false);
     }
   }
+
+  // ?tweet=... が来たら自動入力＆自動チェック
+  useEffect(() => {
+    const p = new URLSearchParams(window.location.search);
+    const t = p.get("tweet");
+    if (t) {
+      setInput(t);
+      // 少し遅延させてからチェック
+      setTimeout(() => check(), 300);
+    }
+  }, []);
 
   return (
     <main style={{ padding: 24, fontFamily: "system-ui" }}>
       <h1>リツイート特別リンク チェッカー</h1>
       <p>対象のツイートURL または ツイートID を入力して「チェック」。</p>
       <div style={{ display: "flex", gap: 8 }}>
         <input
           value={input}
           onChange={e => setInput(e.target.value)}
           placeholder="https://twitter.com/.../status/123456789 or 123456789"
           style={{ flex: 1, padding: 10, borderRadius: 6, border: "1px solid #666", background: "#111", color: "#fff" }}
         />
         <button onClick={check} disabled={loading} style={{ padding: "10px 16px", borderRadius: 6 }}>
           {loading ? "チェック中..." : "チェック"}
         </button>
       </div>
 
       {result && (
         <div style={{ marginTop: 16 }}>
           {result.ok ? (
             result.eligible ? (
               <div>
                 <p>✅ RTを確認できました。特別ページはこちら：</p>
                 <a href={result.url} style={{ color: "#1d9bf0", textDecoration: "underline" }}>{result.url}</a>
               </div>
             ) : (
               <div>
                 <p>❌ まだRTが確認できませんでした。</p>
                 <p>RT後、数秒～数十秒で反映されます。もう一度「チェック」してください。</p>
               </div>
             )
           ) : (
             <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(result, null, 2)}</pre>
           )}
         </div>
       )}
     </main>
   );
 }

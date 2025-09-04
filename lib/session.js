// /lib/session.js
import { cookies } from "next/headers";

// Base64URL helpers（EdgeでもNodeでも動く）
export function b64urlEncode(str) {
  return Buffer.from(str, "utf8")
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}
export function b64urlDecode(str) {
  // padding 補正
  const pad = 4 - (str.length % 4 || 4);
  const fixed = str.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad === 4 ? 0 : pad);
  return Buffer.from(fixed, "base64").toString("utf8");
}

// セキュアな Cookie セット/取得/削除
export function setCookie(name, value, { maxAgeSec = 60 * 60 * 24 * 7 } = {}) {
  cookies().set(name, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSec,
  });
}

export function getCookie(name) {
  const v = cookies().get(name)?.value;
  return v ?? null;
}

export function deleteCookie(name) {
  cookies().delete(name);
}

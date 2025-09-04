// /lib/auth.js
import { getCookie } from "@/lib/session";

export function readSess() {
  const raw = getCookie("sess");
  if (!raw) return null;
  try {
    return JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

/** 認証必須のAPIで使うヘルパー */
export function requireAuth() {
  const s = readSess();
  if (!s?.access_token || !s?.user?.id) return null;
  return s;
}

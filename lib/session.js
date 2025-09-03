// /lib/session.js
import { getIronSession } from "iron-session/edge";
import { cookies } from "next/headers";

/**
 * 重要：
 * Vercel / .env.local に SESSION_PASSWORD をセットしてください。
 * 例）SESSION_PASSWORD="a_very_long_and_random_secret_at_least_32_chars"
 */
export const sessionOptions = {
  cookieName: "okp_sess",
  password: process.env.SESSION_PASSWORD,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  },
};

export async function getSession() {
  // App Router の Route Handler では edge 版 + cookies() を使うのが簡単です
  return getIronSession(cookies(), sessionOptions);
}

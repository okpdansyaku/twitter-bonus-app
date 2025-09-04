// /lib/session.js
import { getIronSession } from "iron-session/edge";
import { cookies } from "next/headers";

/**
 * 必須:
 * - SESSION_PASSWORD（32文字以上のランダム）
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
  return getIronSession(cookies(), sessionOptions);
}

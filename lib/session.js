// lib/session.js
import { getIronSession } from "iron-session/edge";

export const sessionOptions = {
  cookieName: "okp_session",
  password: process.env.SESSION_SECRET, // Vercel に設定する
  cookieOptions: {
    secure: true,
  },
};

export function getSession(req) {
  return getIronSession(req, {}, sessionOptions);
}

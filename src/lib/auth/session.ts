import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { env } from "@/lib/env";
import type { Session } from "@/types/db";

const COOKIE_NAME = "sesi_ekskul";
const ADMIN_MAX_AGE = 60 * 60 * 12; // 12 jam
const PIC_MAX_AGE = 60 * 60 * 24 * 7; // 7 hari

function key(): Uint8Array {
  return new TextEncoder().encode(env("SESSION_SECRET"));
}

export async function signSession(session: Session): Promise<string> {
  const maxAge = session.kind === "admin" ? ADMIN_MAX_AGE : PIC_MAX_AGE;
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${maxAge}s`)
    .setSubject(session.id)
    .sign(key());
}

export async function setSessionCookie(session: Session): Promise<void> {
  const token = await signSession(session);
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: session.kind === "admin" ? ADMIN_MAX_AGE : PIC_MAX_AGE,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    if (payload.kind !== "admin" && payload.kind !== "pic") return null;
    return {
      kind: payload.kind,
      id: String(payload.id),
      nama: String(payload.nama ?? ""),
      username: payload.username ? String(payload.username) : undefined,
      nis: payload.nis ? String(payload.nis) : undefined,
    };
  } catch {
    return null;
  }
}

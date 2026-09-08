import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "./prisma";

const COOKIE = "eprofile_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 días

function secret(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error("SESSION_SECRET no está configurado (ver .env.example).");
  }
  return new TextEncoder().encode(s);
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());

  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export function destroySession() {
  cookies().set(COOKIE, "", { path: "/", maxAge: 0 });
}

export type SessionUser = {
  id: string;
  email: string;
  role: "STUDENT" | "PLATFORM_ADMIN";
  active: boolean;
  student: { id: string; slug: string } | null;
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const uid = payload.uid as string;
    const user = await prisma.user.findUnique({
      where: { id: uid },
      include: { student: { select: { id: true, slug: true } } },
    });
    if (!user || !user.active) return null;
    return {
      id: user.id,
      email: user.email,
      role: user.role as SessionUser["role"],
      active: user.active,
      student: user.student,
    };
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requirePlatformAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "PLATFORM_ADMIN") redirect("/login");
  return user;
}

/**
 * Autoriza la administración del perfil identificado por `slug`.
 * Permite: el propio estudiante dueño del slug, o cualquier PLATFORM_ADMIN.
 * Cualquier otro caso => redirige (aislamiento entre estudiantes).
 */
export async function requireProfileAccess(slug: string) {
  const user = await requireUser();
  if (user.role === "PLATFORM_ADMIN") return { user, actingAsAdmin: true };
  if (user.student && user.student.slug === slug)
    return { user, actingAsAdmin: false };
  redirect("/login");
}

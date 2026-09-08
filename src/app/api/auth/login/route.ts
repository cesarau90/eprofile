import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { createSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!email || !password) {
    return NextResponse.json({ error: "Escribe tu correo y contraseña." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { student: { select: { slug: true } } },
  });

  if (!user) {
    return NextResponse.json({ error: "Correo o contraseña incorrectos." }, { status: 401 });
  }
  if (!user.active) {
    return NextResponse.json(
      { error: "Esta cuenta está desactivada. Contacta al administrador." },
      { status: 403 },
    );
  }
  if (!(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: "Correo o contraseña incorrectos." }, { status: 401 });
  }

  await createSession(user.id);

  const redirect =
    user.role === "PLATFORM_ADMIN"
      ? "/admin"
      : user.student
        ? `/${user.student.slug}/admin`
        : "/";

  return NextResponse.json({ ok: true, redirect });
}

import { NextRequest, NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";
import { siteUrl } from "@/lib/settings";

/**
 * Cerrar sesión SOLO por POST: destruir la cookie es una operación con efecto
 * secundario y no debe ocurrir en un GET (los navegadores y Next hacen
 * prefetch/prerender de los GET, lo que cerraba la sesión sin querer al
 * recargar el panel tras crear una cuenta).
 */
export async function POST(req: NextRequest) {
  destroySession();
  return NextResponse.redirect(new URL("/login", req.nextUrl.origin || siteUrl()), {
    status: 303,
  });
}

// Un GET a /logout no cierra sesión; solo lleva al login.
export async function GET(req: NextRequest) {
  return NextResponse.redirect(new URL("/login", req.nextUrl.origin || siteUrl()));
}

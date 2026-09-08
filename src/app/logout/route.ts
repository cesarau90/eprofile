import { NextRequest, NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";
import { siteUrl } from "@/lib/settings";

function doLogout(req: NextRequest) {
  destroySession();
  return NextResponse.redirect(new URL("/login", req.nextUrl.origin || siteUrl()));
}

export const GET = doLogout;
export const POST = doLogout;

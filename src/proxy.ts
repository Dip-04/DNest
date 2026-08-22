import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const protectedPrefixes = ["/home", "/moments", "/together", "/plans", "/us", "/notes", "/questions", "/notifications", "/settings", "/onboarding"];

export async function proxy(request: NextRequest) {
  const needsSession = protectedPrefixes.some(prefix => request.nextUrl.pathname.startsWith(prefix));
  if (!needsSession) return NextResponse.next();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next();
  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, { cookies: { getAll: () => request.cookies.getAll(), setAll: values => { values.forEach(({name,value})=>request.cookies.set(name,value)); response=NextResponse.next({request}); values.forEach(({name,value,options})=>response.cookies.set(name,value,options)); } } });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const next = new URL("/sign-in", request.url); next.searchParams.set("next", request.nextUrl.pathname); return NextResponse.redirect(next);
  }
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"] };

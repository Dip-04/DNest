import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  isGuestOnlyPage,
  isPrivatePage,
  isProtectedApi,
} from "@/lib/route-access";

function copyCookies(from: NextResponse, to: NextResponse): NextResponse {
  from.cookies.getAll().forEach((cookie) => to.cookies.set(cookie));
  return to;
}

function signInRedirect(
  request: NextRequest,
  response: NextResponse,
  message: string,
): NextResponse {
  const target = new URL("/sign-in", request.url);
  target.searchParams.set(
    "next",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );
  target.searchParams.set("error", message);
  target.searchParams.set("_toast", crypto.randomUUID());
  return copyCookies(response, NextResponse.redirect(target));
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const privatePage = isPrivatePage(pathname);
  const protectedApi = isProtectedApi(pathname);
  const guestOnlyPage = isGuestOnlyPage(pathname);
  if (!privatePage && !protectedApi && !guestOnlyPage)
    return NextResponse.next();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    if (protectedApi)
      return NextResponse.json(
        { error: "Authentication is not configured." },
        { status: 503 },
      );
    if (privatePage) {
      const target = new URL("/sign-in", request.url);
      target.searchParams.set(
        "error",
        "DNest authentication is temporarily unavailable. Please try again shortly.",
      );
      return NextResponse.redirect(target);
    }
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (values) => {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (!user) {
    if (protectedApi)
      return copyCookies(
        response,
        NextResponse.json(
          { error: "Authentication required." },
          { status: 401 },
        ),
      );
    if (privatePage) {
      if (pathname === "/reset-password") {
        const target = new URL("/forgot-password", request.url);
        target.searchParams.set(
          "error",
          "Request a fresh password-reset link to continue.",
        );
        return copyCookies(response, NextResponse.redirect(target));
      }
      const hadSessionCookie = request.cookies
        .getAll()
        .some(
          (cookie) =>
            cookie.name.startsWith("sb-") && cookie.name.includes("auth-token"),
        );
      return signInRedirect(
        request,
        response,
        error && hadSessionCookie
          ? "Your session expired. Please sign in again."
          : "Please sign in to open your private Nest.",
      );
    }
    return response;
  }

  if (guestOnlyPage)
    return copyCookies(
      response,
      NextResponse.redirect(new URL("/home", request.url)),
    );
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$).*)",
  ],
};

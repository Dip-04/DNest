export const privatePagePrefixes = [
  "/home",
  "/moments",
  "/together",
  "/plans",
  "/us",
  "/notes",
  "/questions",
  "/notifications",
  "/settings",
  "/connect-android",
  "/onboarding",
  "/reset-password",
] as const;

export const guestOnlyPrefixes = [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
] as const;

export function matchesRoute(
  pathname: string,
  prefixes: readonly string[],
): boolean {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isPrivatePage(pathname: string): boolean {
  return matchesRoute(pathname, privatePagePrefixes);
}

export function isGuestOnlyPage(pathname: string): boolean {
  return matchesRoute(pathname, guestOnlyPrefixes);
}

export function isProtectedApi(pathname: string): boolean {
  return pathname === "/api" || pathname.startsWith("/api/");
}

export function safeNextPath(
  value: FormDataEntryValue | string | null | undefined,
  fallback = "/home",
): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//")
  )
    return fallback;
  try {
    const url = new URL(value, "https://dnest.invalid");
    if (url.origin !== "https://dnest.invalid") return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

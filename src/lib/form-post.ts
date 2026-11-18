import { NextResponse } from "next/server";

export function rejectsCrossSitePost(request: Request) {
  const site = request.headers.get("sec-fetch-site");
  if (site === "same-origin" || site === "same-site" || site === "none") return false;

  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim()
    || request.headers.get("host");
  if (!origin || !host) return true;
  try {
    return new URL(origin).host !== host;
  } catch {
    return true;
  }
}

export function redirectTo(request: Request, path: string, params?: Record<string, string>) {
  const url = new URL(path, publicOrigin(request));
  for (const [key, value] of Object.entries(params ?? {})) {
    url.searchParams.set(key, value);
  }
  return NextResponse.redirect(url, 303);
}

export function isNextRedirect(error: unknown) {
  return typeof error === "object"
    && error !== null
    && "digest" in error
    && String((error as { digest: unknown }).digest).startsWith("NEXT_REDIRECT");
}

function publicOrigin(request: Request) {
  const requestUrl = new URL(request.url);
  const host = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim()
    || request.headers.get("host")
    || requestUrl.host;
  const proto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim()
    || requestUrl.protocol.replace(":", "");
  return `${proto}://${host}`;
}

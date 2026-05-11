import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = ["/dashboard", "/invoices", "/quotes", "/expenses", "/services", "/clients", "/reports", "/settings", "/onboarding"];
const AUTH_PAGES = ["/auth/login", "/auth/signup"];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // If Supabase env vars are missing, pass all requests through to avoid blocking the app.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnon) {
    return NextResponse.next({ request });
  }

  try {
    const { createServerClient } = await import("@supabase/ssr");
    let response = NextResponse.next({ request });

    const supabase = createServerClient(supabaseUrl, supabaseAnon, {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();

    const isProtected = PROTECTED.some(p => pathname.startsWith(p));
    const isAuthPage  = AUTH_PAGES.some(p => pathname.startsWith(p));

    if (isProtected && !user) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
    if (isAuthPage && user) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return response;
  } catch {
    // Auth check failed — let the request through rather than showing 500.
    return NextResponse.next({ request });
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};

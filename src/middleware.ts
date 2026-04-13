import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/middleware"

// Routes that don't require authentication
const PUBLIC_ROUTES = ["/login", "/signup", "/auth"]
// Routes that authenticated users shouldn't see (redirect to /explore)
const AUTH_ROUTES = ["/login", "/signup"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Run Supabase session refresh on every request
  const supabaseResponse = createClient(request)

  // Check if current route is public
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route))

  if (isPublicRoute) {
    return supabaseResponse
  }

  // For protected routes, verify the user session
  // We need to re-create a fresh client to read cookies from the (possibly updated) response
  const { createServerClient } = await import("@supabase/ssr")
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll() {
          // noop — cookies already handled by createClient above
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Not authenticated → redirect to login
  if (!user) {
    const loginUrl = new URL("/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Authenticated user visiting auth-only pages → redirect to explore
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route))
  if (isAuthRoute) {
    return NextResponse.redirect(new URL("/explore", request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}

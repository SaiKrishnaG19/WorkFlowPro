import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getSessionFromRequest } from "./lib/auth"

// Define protected routes
const protectedRoutes = ["/dashboard", "/mcl-reports", "/problem-reports", "/discussions", "/manager"]

const adminRoutes = ["/admin"]
const managerRoutes = ["/manager"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  if (!isProtectedRoute) {
    return NextResponse.next()
  }

  // Get session from request
  const session = await getSessionFromRequest(request)

  // console.log("SESSION IN MIDDLEWARE:", session)

    // Check if session is valid
  if (!session?.empId) {
    const loginUrl = new URL("/", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }


  // Check role-based access
  if (adminRoutes.some((route) => pathname.startsWith(route)) && session.role !== "Admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  if (managerRoutes.some((route) => pathname.startsWith(route)) && !["Manager"].includes(session.role)) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
}

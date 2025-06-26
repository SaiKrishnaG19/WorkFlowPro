import { SignJWT, jwtVerify } from "jose"
import type { NextRequest } from "next/server"
import type { User } from "./database"

// This is only used in server components
let getServerCookies: () => Promise<{ get: (name: string) => { value: string | undefined } | undefined, set: (name: string, value: string, options: any) => void, delete: (name: string) => void }>

if (typeof window === 'undefined') {
  getServerCookies = async () => {
    const { cookies } = await import('next/headers')
    return cookies()
  }
}

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key")

export interface SessionUser {
  empId: string
  name: string
  email: string
  role: "User" | "Manager" | "Admin"
  [key: string]: unknown //index signature
}

export async function createSession(user: User): Promise<string> {
  const payload: SessionUser = {
    empId: user.emp_id,
    name: user.name,
    email: user.email,
    role: user.role,
  }

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secret)

  return token
}

export async function verifySession(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as SessionUser
  } catch (error) {
    console.error("Token verification failed:", error)
    return null
  }
}

export async function getSession(): Promise<SessionUser | null> {
  if (typeof window === 'undefined') {
    const cookieStore = await getServerCookies()
    const token = cookieStore.get("session")?.value

    if (!token) {
      return null
    }

    return await verifySession(token)
  } else {
    // For client-side usage
    const response = await fetch('/api/auth/session', { credentials: 'include' })
    const data = await response.json()
    return data.session
  }
}

export async function setSessionCookie(token: string): Promise<void> {
  if (typeof window === 'undefined') {
    const cookieStore = await getServerCookies()
    cookieStore.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    })
  }
  // Client-side cookie setting is handled by the server response
}

export async function clearSession(): Promise<void> {
  if (typeof window === 'undefined') {
    const cookieStore = await getServerCookies()
    cookieStore.delete("session")
  } else {
    // For client-side usage
    await fetch('/api/auth/logout', { 
      method: 'POST',
      credentials: 'include'
    })
  }
}

export function getSessionFromRequest(request: NextRequest): Promise<SessionUser | null> {
  const token = request.cookies.get("session")?.value
  if (!token) {
    return Promise.resolve(null)
  }
  return verifySession(token)
}

// Role-based access control
export function hasPermission(userRole: string, requiredRole: string): boolean {
  const roleHierarchy = { User: 1, Manager: 2, Admin: 3 }
  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0
  const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0
  return userLevel >= requiredLevel
}

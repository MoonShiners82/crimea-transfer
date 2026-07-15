export const ROLE_HIERARCHY: Record<string, string[]> = {
  admin: ["admin", "dispatcher", "driver", "user"],
  dispatcher: ["dispatcher"],
  driver: ["driver"],
  user: ["user"],
}

export function hasRole(userRole: string, requiredRoles: string | string[]): boolean {
  const allowed = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
  return allowed.includes(userRole)
}

export const PROTECTED_ROUTES: Record<string, string[]> = {
  "/admin": ["admin"],
  "/dispatcher": ["dispatcher"],
  "/driver": ["driver"],
  "/driver/profile": ["driver"],
  "/driver/register": ["user", "driver", "admin"],
  "/booking": ["user", "admin"],
  "/bookings": ["user", "admin"],
}

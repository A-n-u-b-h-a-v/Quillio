import { NextResponse } from "next/server";
import { AuthenticatedUser } from "./auth";
import Tenant from "@/models/Tenant";

import { SUBSCRIPTION_PLANS } from "./constants/subscription";
import { NextRequest } from "next/server";

import { getAuthenticatedUser } from "./getAuthenticatedUser";

/**
 * Returns NextResponse if user is null, otherwise void.
 */
function requireAuth(user: AuthenticatedUser | null): NextResponse | undefined {
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

/**
 * Returns NextResponse if user.role !== "admin", otherwise void.
 */
function requireAdmin(user: AuthenticatedUser | null): NextResponse | undefined {
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
  }
}

/**
 * Returns NextResponse if user has no tenantId, otherwise void.
 */
function requireTenant(user: AuthenticatedUser | null): NextResponse | undefined {
  if (!user?.tenantId) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 400 });
  }
}

/**
 * Ensure tenant has not exceeded free plan note limits.
 * Returns NextResponse if limit reached, otherwise void.
 */
async function requireNoteLimit(user: AuthenticatedUser | null): Promise<NextResponse | null> {
  if (!user?.tenantId) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 400 });
  }

  const tenant = await Tenant.findById(user.tenantId).lean();
  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 400 });
  }

  if (tenant.subscriptionPlan === SUBSCRIPTION_PLANS.FREE && tenant.notesCount >= 3) {
    return NextResponse.json(
      { error: "Free plan note limit reached. Upgrade to Pro." },
      { status: 403 }
    );
  }

  return null; // under limit, route can continue
}

/**
 * Global middleware wrapper that extracts authenticated user and applies common checks
 * Returns { user, error } where error is a NextResponse if something failed
 */
export async function withAuth(
  req: NextRequest,
  options: {
    requireAuth?: boolean;
    requireAdmin?: boolean;
    requireTenant?: boolean;
    requireNoteLimit?: boolean;
  } = {}
): Promise<{ user: AuthenticatedUser | null; error: NextResponse | null }> {
  const user = await getAuthenticatedUser(req);

  // Check authentication
  if (options.requireAuth !== false) {
    const authError = requireAuth(user);
    if (authError) return { user: null, error: authError };
  }

  // Check admin role
  if (options.requireAdmin) {
    const adminError = requireAdmin(user);
    if (adminError) return { user: null, error: adminError };
  }

  // Check tenant
  if (options.requireTenant !== false) {
    const tenantError = requireTenant(user);
    if (tenantError) return { user: null, error: tenantError };
  }

  // Check note limits
  if (options.requireNoteLimit) {
    const limitError = await requireNoteLimit(user);
    if (limitError) return { user: null, error: limitError };
  }

  return { user, error: null };
}
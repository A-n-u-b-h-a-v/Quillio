import { NextRequest, NextResponse } from "next/server";
import Tenant from "@/models/Tenant";
import { withAuth } from "@/lib/middleware";
import { tenantCreationInput } from "@/schemas/zodTypes";
import { SUBSCRIPTION_PLANS } from "@/lib/constants/subscription";

// Create a new tenant (Admin only)
export async function POST(req: NextRequest) {
  const { user, error } = await withAuth(req, { requireAdmin: true, requireAuth: true });
  if (error) return error;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json();
  const parsed = tenantCreationInput.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existingTenant = await Tenant.findOne({ slug: parsed.data.slug });

  if (existingTenant) {
    return NextResponse.json({ error: "Slug already exists. Please choose another slug." }, { status: 400 });
  }

  const tenant = await Tenant.create({
    title: parsed.data.name,
    slug: parsed.data.slug,
    subscriptionPlan: parsed.data.subscriptionPlan || SUBSCRIPTION_PLANS.FREE,
  });

  return NextResponse.json(tenant, { status: 201 });
}

// Fetch current user's tenant
export async function GET(req: NextRequest) {
  // All authenticated users can fetch their own tenant
  const { user, error } = await withAuth(req, { requireAuth: true, requireTenant: true });
  if (error) return error;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Return only the current user's tenant
  const tenant = await Tenant.findById(user.tenantId).lean();
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  return NextResponse.json(tenant);
}

import { NextResponse, NextRequest } from "next/server";
import Tenant from "@/models/Tenant";
import { withAuth } from "@/lib/middleware";
import { SUBSCRIPTION_PLANS } from "@/lib/constants/subscription";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { user, error } = await withAuth(req, { 
    requireAdmin: true,
    requireAuth: true,
    requireTenant: true,
  });

  if (error) return error;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params; // ✅ Await params
  const tenant = await Tenant.findOne({ slug });

  if (!tenant) {
    return NextResponse.json(
      { error: "Tenant not found" },
      { status: 404 }
    );
  }

  if (tenant.subscriptionPlan === SUBSCRIPTION_PLANS.PRO) {
    return NextResponse.json({ message: "Tenant already on Pro plan" });
  }

  tenant.subscriptionPlan = SUBSCRIPTION_PLANS.PRO;
  await tenant.save();

  return NextResponse.json({
    message: `Tenant ${tenant.title} upgraded to Pro plan successfully`,
    subscriptionPlan: tenant.subscriptionPlan,
    slug: tenant.slug,
  });
}

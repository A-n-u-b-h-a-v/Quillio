import { NextRequest, NextResponse } from "next/server";
import Tenant from "@/models/Tenant";
import { withAuth } from "@/lib/middleware";

// GET /api/admin/tenants - List all tenants (Admin only)
export async function GET(req: NextRequest) {
  const { user, error } = await withAuth(req, { 
    requireAdmin: true, 
    requireAuth: true 
  });
  
  if (error) return error;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Return all tenants for admin
  const tenants = await Tenant.find().lean();
  return NextResponse.json(tenants);
}

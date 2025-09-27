import { NextRequest, NextResponse } from "next/server";
import User from "@/models/User";
import { withAuth } from "@/lib/middleware";

export async function GET(req: NextRequest) {
  const { user, error } = await withAuth(req, { 
    requireAuth: true,
    requireTenant: true
    // Note: No requireAdmin - any authenticated user can access this
  });
  
  if (error) return error;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get the full user details from database
  const fullUser = await User.findById(user._id)
    .select("-passwordHash")
    .lean();

  if (!fullUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      _id: fullUser._id,
      firstName: fullUser.firstName,
      lastName: fullUser.lastName,
      email: fullUser.email,
      role: fullUser.role,
      tenantId: fullUser.tenantId
    }
  });
}
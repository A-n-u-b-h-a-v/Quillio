import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/db";
import Tenant from "@/models/Tenant";
import User from "@/models/User";
import { SUBSCRIPTION_PLANS } from "@/lib/constants/subscription";
import { USER_ROLES } from "@/lib/constants/user";
import { hashPassword } from "@/utils/hash";

export async function POST(req: NextRequest) {
  try {
    await connectMongoDB();

    const json = await req.json();
    const { organization, admin } = json;

    // Validate required fields
    if (!organization?.name || !organization?.slug || !admin?.firstName || !admin?.email || !admin?.password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if organization slug already exists
    const existingTenant = await Tenant.findOne({ slug: organization.slug });
    if (existingTenant) {
      return NextResponse.json({ error: "Organization slug already exists" }, { status: 400 });
    }

    // Check if admin email already exists
    const existingUser = await User.findOne({ email: admin.email });
    if (existingUser) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }

    // Create tenant
    const tenant = await Tenant.create({
      title: organization.name,
      slug: organization.slug,
      subscriptionPlan: SUBSCRIPTION_PLANS.FREE,
      notesCount: 0,
    });

    // Hash password
    const passwordHash = await hashPassword(admin.password);

    // Create admin user
    const user = await User.create({
      firstName: admin.firstName,
      lastName: admin.lastName || "",
      email: admin.email,
      passwordHash,
      role: USER_ROLES.ADMIN,
      tenantId: tenant._id,
    });

    return NextResponse.json({
      message: "Organization and admin user created successfully",
      tenant: {
        id: tenant._id,
        title: tenant.title,
        slug: tenant.slug,
        subscriptionPlan: tenant.subscriptionPlan
      },
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    }, { status: 201 });

  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Failed to create organization" }, { status: 500 });
  }
}

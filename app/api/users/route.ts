import { NextRequest, NextResponse } from "next/server";
import User from "@/models/User";
import { userCreationInput } from "@/schemas/zodTypes";
import { withAuth } from "@/lib/middleware";
import { USER_ROLES } from "@/lib/constants/user";
import { hashPassword } from "@/utils/hash";

export async function GET(req: NextRequest) {

    const { user, error } = await withAuth(req, { 
        requireAdmin:true,requireAuth:true,requireTenant:true
      });
      
      if (error) return error;
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const users = await User.find({ tenantId: user.tenantId })
    .select("-passwordHash")
    .lean();

  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
    const { user, error } = await withAuth(req, { 
       requireAdmin:true,requireAuth:true,requireTenant:true
      });
      
      if (error) return error;
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json();
  const parsed = userCreationInput.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Check email uniqueness within tenant
  const existingUser = await User.findOne({ email: parsed.data.email, tenantId: user.tenantId });
  if (existingUser) {
    return NextResponse.json({ error: "Email already exists in tenant" }, { status: 400 });
  }

  // Generate temporary password (will be returned to admin)
  const tempPassword = Math.random().toString(36).slice(-8); 
  const passwordHash = await hashPassword(tempPassword);

  const newUser = await User.create({
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName || "",
    email: parsed.data.email,
    role: parsed.data.role || USER_ROLES.MEMBER,
    tenantId: user.tenantId,
    passwordHash,
  });

  return NextResponse.json(
    {
      message: "User created successfully. Provide the temporary password to the user.",
      tempPassword, 
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role,
      },
    },
    { status: 201 }
  );
}

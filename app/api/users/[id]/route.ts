import { NextRequest, NextResponse } from "next/server";
import User from "@/models/User";
import { userCreationInput } from "@/schemas/zodTypes";
import {  withAuth } from "@/lib/middleware";

// Update user details (admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
    const { user, error } = await withAuth(req, { 
        requireAdmin:true,requireAuth:true,requireTenant:true
      });
      
      if (error) return error;
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  

  const json = await req.json();

  // Only allow updating firstName, lastName, email, role
  const updateSchema = userCreationInput.partial();
  const parsed = updateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Find the user to update, must be in same tenant
  const { id } = await params;
const userToUpdate = await User.findOne({ _id: id, tenantId: user.tenantId });

  if (!userToUpdate) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // If updating email, check for uniqueness within tenant
  if (
    parsed.data.email &&
    parsed.data.email !== userToUpdate.email
  ) {
    const existing = await User.findOne({
      email: parsed.data.email,
      tenantId: user.tenantId,
      _id: { $ne: id },
    });
    if (existing) {
      return NextResponse.json({ error: "Email already exists in tenant" }, { status: 400 });
    }
  }

  // Update fields
  if (parsed.data.firstName !== undefined) userToUpdate.firstName = parsed.data.firstName;
  if (parsed.data.lastName !== undefined) userToUpdate.lastName = parsed.data.lastName;
  if (parsed.data.email !== undefined) userToUpdate.email = parsed.data.email;
  if (parsed.data.role !== undefined) userToUpdate.role = parsed.data.role;

  await userToUpdate.save();

  return NextResponse.json({
    message: "User updated successfully",
    user: {
      id: userToUpdate._id,
      firstName: userToUpdate.firstName,
      lastName: userToUpdate.lastName,
      email: userToUpdate.email,
      role: userToUpdate.role,
    },
  });
}

// Delete a user (admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
    const { user, error } = await withAuth(req, { 
        requireAdmin:true,requireAuth:true,requireTenant:true
      });
      
      if (error) return error;
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const { id } = await params;
  // Prevent self-deletion
  if (user._id?.toString() === id) {
    return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
  }

  const userToDelete = await User.findOne({ _id: id, tenantId: user.tenantId });
  if (!userToDelete) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await userToDelete.deleteOne();

  return NextResponse.json({ message: "User deleted successfully" }, { status: 200 });
}

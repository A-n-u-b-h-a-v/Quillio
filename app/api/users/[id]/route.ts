import { NextRequest, NextResponse } from "next/server";
import User from "@/models/User";
import { userCreationInput } from "@/schemas/zodTypes";
import { withAuth } from "@/lib/middleware";

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
  const { id } = await params;

  const validation = userCreationInput.safeParse(json);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid input", details: validation.error.flatten() },
      { status: 400 }
    );
  }

  const { firstName, lastName, email, password, role } = validation.data;

  try {
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if email is already taken by another user
    const emailExists = await User.findOne({
      email,
      _id: { $ne: id },
      tenantId: user.tenantId,
    });

    if (emailExists) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    // Update user
    existingUser.firstName = firstName;
    existingUser.lastName = lastName;
    existingUser.email = email;
    existingUser.role = role;

    if (password) {
      const bcrypt = require("bcryptjs");
      existingUser.passwordHash = await bcrypt.hash(password, 10);
    }

    await existingUser.save();

    return NextResponse.json({
      message: "User updated successfully",
      user: {
        id: existingUser._id,
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
        email: existingUser.email,
        role: existingUser.role,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// Delete user (admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await withAuth(req, {
    requireAdmin: true,
    requireAuth: true,
    requireTenant: true,
  });

  if (error) return error;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const userToDelete = await User.findById(id);
    if (!userToDelete) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent admin from deleting themselves
    if (userToDelete._id?.toString() === user._id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    await User.findByIdAndDelete(id);

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}

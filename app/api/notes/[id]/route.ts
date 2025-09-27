import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/db";
import Notes from "@/models/Notes";
import Tenant from "@/models/Tenant";
import { withAuth } from "@/lib/middleware";
import { notesInput } from "@/schemas/zodTypes";
import User from "@/models/User";

// GET /notes/:id - Retrieve a specific note
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await withAuth(req, {
    requireAuth: true,
    requireTenant: true,
  });

  if (error) return error;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    await connectMongoDB();

    const note = await Notes.findOne({
      _id: id,
      tenant: user.tenantId, // Changed from tenantId to tenant
    }).populate("createdBy", "firstName lastName email")
      .populate("createdFor", "firstName lastName email");

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json(note);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch note" },
      { status: 500 }
    );
  }
}

// PUT /notes/:id - Update a note
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await withAuth(req, {
    requireAuth: true,
    requireTenant: true,
  });

  if (error) return error;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    await connectMongoDB();

    const json = await req.json();
    const validation = notesInput.safeParse(json);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { title, content, priority, assignedTo } = validation.data;

    const note = await Notes.findOne({
      _id: id,
      tenant: user.tenantId, // Changed from tenantId to tenant
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // If assignedTo is provided, validate it exists in the tenant
    if (assignedTo) {
      const assignedUser = await User.findOne({
        _id: assignedTo,
        tenantId: user.tenantId,
      });

      if (!assignedUser) {
        return NextResponse.json(
          { error: "Assigned user not found in tenant" },
          { status: 400 }
        );
      }
    }

    note.title = title;
    note.content = content;
    note.priority = priority;
    if (assignedTo) {
      (note as any).createdFor = assignedTo;
    } else {
      (note as any).createdFor = null;
    }

    await note.save();

    return NextResponse.json({
      message: "Note updated successfully",
      note,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update note" },
      { status: 500 }
    );
  }
}

// DELETE /notes/:id - Delete a note
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await withAuth(req, {
    requireAuth: true,
    requireTenant: true,
  });

  if (error) return error;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    await connectMongoDB();

    const note = await Notes.findOne({
      _id: id,
      tenant: user.tenantId, // Changed from tenantId to tenant
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    await Notes.findByIdAndDelete(id);

    // Decrement notesCount in tenant
    await Tenant.findByIdAndUpdate(user.tenantId, {
      $inc: { notesCount: -1 },
    });

    return NextResponse.json({ message: "Note deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete note" },
      { status: 500 }
    );
  }
}

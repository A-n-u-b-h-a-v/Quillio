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
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const note = await Notes.findById(id)
      .populate("createdBy", "firstName lastName email")
      .populate("createdFor", "firstName lastName email")
      .lean();

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Ensure the note belongs to the same tenant
    if (note.tenant.toString() !== user.tenantId.toString()) {
      return NextResponse.json(
        { error: "Cannot access note from another tenant" },
        { status: 403 }
      );
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error("Error fetching note:", error);
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
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json();
  const updateSchema = notesInput.partial();
  const parsed = updateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Find the note
  const { id } = await params;
const note = await Notes.findById(id)
  if (!note) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  // Ensure the note belongs to the same tenant
  if (note.tenant.toString() !== user.tenantId.toString()) {
    return NextResponse.json(
      { error: "Cannot update note from another tenant" },
      { status: 403 }
    );
  }

  // Validate assigned user if provided
  let assignedUser: any = null;
  if (parsed.data.assignedTo) {
    assignedUser = await User.findOne({
      _id: parsed.data.assignedTo,
      tenantId: user.tenantId,
    })
      .select("_id firstName role tenantId")
      .lean();

    if (!assignedUser) {
      return NextResponse.json(
        { error: "Assigned user not found in tenant" },
        { status: 400 }
      );
    }
  }

  // Update the note
  if (parsed.data.title !== undefined) note.title = parsed.data.title;
  if (parsed.data.content !== undefined) note.content = parsed.data.content;
  if (parsed.data.priority !== undefined) note.priority = parsed.data.priority;
  if (parsed.data.assignedTo !== undefined)
    note.createdFor = assignedUser?._id || null;

  await note.save();

  return NextResponse.json(note, { status: 200 });
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
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
const note = await Notes.findById(id)
  if (!note) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  // Ensure the note belongs to the same tenant
  if (note.tenant.toString() !== user.tenantId.toString()) {
    return NextResponse.json(
      { error: "Cannot delete note from another tenant" },
      { status: 403 }
    );
  }

  await note.deleteOne();

  // Decrement tenant's notesCount atomically
  await Tenant.findByIdAndUpdate(
    user.tenantId,
    { $inc: { notesCount: -1 } },
    { new: true }
  );

  return NextResponse.json(
    { message: "Note deleted successfully" },
    { status: 200 }
  );
}

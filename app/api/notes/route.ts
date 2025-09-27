import { NextRequest, NextResponse } from "next/server";
import Notes from "@/models/Notes";
import User from "@/models/User";
import Tenant from "@/models/Tenant";
import { notesInput } from "@/schemas/zodTypes";
import { withAuth } from "@/lib/middleware";
import { NOTE_PRIORITIES } from "@/lib/constants/notes";

// GET /notes - List all notes for current tenant

export async function GET(req: NextRequest) {
  const { user, error } = await withAuth(req, { 
    requireAuth: true,
    requireTenant: true
    // Note: No requireAdmin - any authenticated user can access this
  });
  
  if (error) return error;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get all notes for the current tenant
  const notes = await Notes.find({ tenant: user.tenantId })
    .populate("createdBy", "firstName lastName")
    .populate("createdFor", "firstName lastName")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json(notes);
}

// POST /notes - Create a note
export async function POST(req: NextRequest) {
  const { user, error } = await withAuth(req, { 
    requireNoteLimit: true,
    requireAuth: true,
    requireTenant: true
  });
  
  if (error) return error;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json();
  const parsed = notesInput.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Validate assigned user if provided
  let assignedUser: any = null;
  if (parsed.data.assignedTo) {
    assignedUser = await User.findOne({
      _id: parsed.data.assignedTo,
      tenantId: user.tenantId,
    }).select("_id firstName role tenantId").lean();

    if (!assignedUser) {
      return NextResponse.json({ error: "Assigned user not found in tenant" }, { status: 400 });
    }
  }

  // Create the note
  // Note: The notesCount will be automatically incremented by the post-save hook in the Notes model
  const note = await Notes.create({
    title: parsed.data.title,
    content: parsed.data.content,
    priority: parsed.data.priority || NOTE_PRIORITIES.MEDIUM,
    tenant: user.tenantId,
    createdBy: user._id,
    createdFor: assignedUser?._id || null,
  });

  return NextResponse.json(note, { status: 201 });
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 200 });
}

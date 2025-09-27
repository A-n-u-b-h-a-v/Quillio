import mongoose from "mongoose";
import type { NoteDocument } from "@/Types/Notes";
import { NOTE_PRIORITIES } from "@/lib/constants/notes";
import Tenant from "./Tenant";

const NoteSchema = new mongoose.Schema<NoteDocument>({
  title: { type: String, required: true },
  content: { type: String, required: true },
  priority: { type: String, enum: Object.values(NOTE_PRIORITIES), default: NOTE_PRIORITIES.MEDIUM },
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true }, // Changed from "tenants" to "Tenant"
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Changed from "users" to "User"
  createdFor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // Changed from "users" to "User"
}, { timestamps: true });

NoteSchema.index({ tenant: 1 });
NoteSchema.index({ tenant: 1, createdBy: 1 });

NoteSchema.post("save", async function (doc) {
  await Tenant.findByIdAndUpdate(doc.tenant, { $inc: { notesCount: 1 } });
});

// ✅ Decrement notesCount after deleting a note
NoteSchema.post("deleteOne", { document: true, query: false }, async function (doc) {
  await Tenant.findByIdAndUpdate(doc.tenant, { $inc: { notesCount: -1 } });
});

// Explicitly set collection name to 'notes'
export default mongoose.models.Note as mongoose.Model<NoteDocument> 
  || mongoose.model<NoteDocument>("Note", NoteSchema, 'notes');

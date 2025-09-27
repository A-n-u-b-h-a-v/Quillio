import { NotePriority } from "@/lib/constants/notes";
import mongoose, { Document, Types } from "mongoose";

interface NoteSchemaType {
  title: string;
  content: string;
  priority: NotePriority;
  tenant: Types.ObjectId;
  createdBy: Types.ObjectId;
  createdFor?: Types.ObjectId | null;
}

export interface NoteDocument extends NoteSchemaType, Document {}

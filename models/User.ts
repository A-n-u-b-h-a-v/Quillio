import mongoose from "mongoose";
import type { UserDocument } from "@/Types/User";
import { USER_ROLES } from "@/lib/constants/user";

const UserSchema = new mongoose.Schema<UserDocument>({
  firstName: { type: String, required: true },
  lastName: { type: String },
  email: { type: String, required: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: Object.values(USER_ROLES), default: USER_ROLES.MEMBER, required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true } // Changed from 'tenants' to 'Tenant'
}, { timestamps: true });

UserSchema.index({ tenantId: 1 });
UserSchema.index({ email: 1, tenantId: 1 }, { unique: true });

// Explicitly set collection name to 'users'
export default mongoose.models.User as mongoose.Model<UserDocument> 
  || mongoose.model<UserDocument>('User', UserSchema, 'users');

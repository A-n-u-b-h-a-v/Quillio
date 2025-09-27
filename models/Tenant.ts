import mongoose from "mongoose";
import type { TenantDocument } from "@/Types/Tenant";
import { SUBSCRIPTION_PLANS } from "@/lib/constants/subscription";

const TenantSchema = new mongoose.Schema<TenantDocument>({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true }, 
  subscriptionPlan: {
    type: String,
    enum: Object.values(SUBSCRIPTION_PLANS),
    default: SUBSCRIPTION_PLANS.FREE,
  },
  notesCount: { type: Number, default: 0 }
}, { timestamps: true });



// Explicitly set collection name to 'tenants'
export default mongoose.models.Tenant as mongoose.Model<TenantDocument> 
  || mongoose.model<TenantDocument>('Tenant', TenantSchema, 'tenants');
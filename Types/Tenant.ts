import { SubscriptionPlan } from "@/lib/constants/subscription";
import { Document } from "mongoose";

interface TenantSchemaType{
    title:string;
    slug:string;
    subscriptionPlan:SubscriptionPlan;
    notesCount: number

}
export interface TenantDocument extends TenantSchemaType,Document{}
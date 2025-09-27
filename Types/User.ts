import { UserRole } from "@/lib/constants/user";
import { Document, Types } from "mongoose";

interface UserSchemaType{
    firstName:string;
    lastName?:string;
    email:string;
    passwordHash:string;
    role:UserRole
    tenantId:Types.ObjectId
}


export interface UserDocument extends UserSchemaType,Document{}
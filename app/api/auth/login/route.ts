import { NextRequest, NextResponse } from "next/server";
import User from "@/models/User";
import Tenant from "@/models/Tenant";
import { signinInput } from "@/schemas/zodTypes";
import { connectMongoDB } from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
    try {
        console.log("🔍 Starting login process...");
        
        // Check environment variables first
        if (!process.env.MONGODB_URI) {
            console.error("❌ MONGODB_URI not set");
            return NextResponse.json({ error: "Database configuration error" }, { status: 500 });
        }
        
        if (!process.env.JWT_SECRET) {
            console.error("❌ JWT_SECRET not set");
            return NextResponse.json({ error: "JWT configuration error" }, { status: 500 });
        }
        
        console.log("✅ Environment variables loaded");
        
        await connectMongoDB();
        console.log("✅ Database connected");
        
        const json = await req.json();
        const validation = signinInput.safeParse(json);
        
        if (!validation.success) {
            console.log("❌ Validation failed:", validation.error);
            return NextResponse.json(
                { error: "Invalid input", details: validation.error.flatten() },
                { status: 400 }
            );
        }
        
        const { email, password } = validation.data;
        console.log("🔍 Looking for user:", email);
        
        const user = await User.findOne({ email }).populate('tenantId');
        
        if (!user) {
            console.log("❌ User not found:", email);
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }
        
        console.log("✅ User found, checking password");
        
        // Use passwordHash field from the model
        const valid = await bcrypt.compare(password, user.passwordHash as string);
        
        if (!valid) {
            console.log("❌ Invalid password for user:", email);
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }
        
        console.log("✅ Password valid, generating token");
        
        if (user._id) {
            const token = jwt.sign(
                { 
                    userId: user._id, 
                    tenantId: user.tenantId,
                    role: user.role 
                },
                process.env.JWT_SECRET as string,
                { expiresIn: '7d' }
            );
            
            console.log("✅ Login successful for user:", email);
            
            return NextResponse.json({
                message: "Login successful",
                token,
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role,
                    tenantId: user.tenantId,
                }
            });
        }
        
        return NextResponse.json({ error: "Login failed" }, { status: 500 });
        
    } catch (error) {
        console.error("❌ Login error:", error);
        
        // Properly handle the unknown error type
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        
        return NextResponse.json({ 
            error: "Internal server error", 
            details: process.env.NODE_ENV === 'development' ? errorMessage : undefined 
        }, { status: 500 });
    }
}


import { NextRequest, NextResponse } from "next/server";
import User from "@/models/User";
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
        console.log("📝 Request body:", json);
        
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
        
        // Remove populate for now to avoid schema issues
        const user = await User.findOne({ email });
        console.log("👤 User found:", user ? "Yes" : "No");
        
        if (!user) {
            console.log("❌ User not found:", email);
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }
        
        console.log("✅ User found, checking password");
        console.log("🔑 User passwordHash exists:", !!user.passwordHash);
        
        // Use passwordHash field from the model
        const valid = await bcrypt.compare(password, user.passwordHash as string);
        console.log("🔐 Password valid:", valid);
        
        if (!valid) {
            console.log("❌ Invalid password for user:", email);
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }
        
        console.log("✅ Password valid, generating token");
        
        if (user._id) {
            // Create JWT payload
            const payload = { 
                userId: String(user._id), 
                tenantId: String(user.tenantId),
                role: user.role 
            };
            
            console.log("🎫 JWT payload:", payload);
            
            const token = jwt.sign(
                payload,
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
        console.error("❌ Error stack:", error instanceof Error ? error.stack : 'No stack trace');
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        
        return NextResponse.json({ 
            error: "Internal server error", 
            details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
            stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
        }, { status: 500 });
    }
}


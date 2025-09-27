import { NextRequest, NextResponse } from "next/server";
import User from "@/models/User";
import { connectMongoDB } from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
    try {
        console.log("🔍 Starting debug login process...");
        
        await connectMongoDB();
        console.log("✅ Database connected");
        
        const { email, password } = await req.json();
        console.log("📝 Email:", email);
        console.log("📝 Password length:", password?.length);
        
        // Find user WITHOUT populate to avoid schema issues
        const user = await User.findOne({ email });
        console.log("👤 User found:", !!user);
        
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        
        console.log("👤 User details:", {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            hasPasswordHash: !!user.passwordHash,
            passwordHashLength: user.passwordHash?.length,
            tenantId: user.tenantId
        });
        
        // Test password comparison
        console.log("🔐 Testing password comparison...");
        const valid = await bcrypt.compare(password, user.passwordHash as string);
        console.log("🔐 Password valid:", valid);
        
        if (!valid) {
            return NextResponse.json({ error: "Invalid password" }, { status: 401 });
        }
        
        // Test JWT generation
        console.log("🎫 Testing JWT generation...");
        const payload = { 
            userId: user._id.toString(), 
            tenantId: user.tenantId.toString(),
            role: user.role 
        };
        
        console.log("🎫 JWT payload:", payload);
        
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET as string,
            { expiresIn: '7d' }
        );
        console.log("🎫 JWT generated successfully, length:", token.length);
        
        return NextResponse.json({
            message: "Debug login successful",
            token: token.substring(0, 20) + "...", // Only show first 20 chars
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                tenantId: user.tenantId,
            }
        });
        
    } catch (error) {
        console.error("❌ Debug login error:", error);
        console.error("❌ Error name:", error instanceof Error ? error.name : 'Unknown');
        console.error("❌ Error message:", error instanceof Error ? error.message : 'Unknown');
        console.error("❌ Error stack:", error instanceof Error ? error.stack : 'No stack');
        
        return NextResponse.json({
            error: "Debug login failed",
            errorName: error instanceof Error ? error.name : 'Unknown',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            errorStack: error instanceof Error ? error.stack : 'No stack trace'
        }, { status: 500 });
    }
}

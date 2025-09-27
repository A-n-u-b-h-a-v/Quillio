import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
    try {
        console.log("🔍 Simple login test starting...");
        
        await connectMongoDB();
        console.log("✅ Database connected");
        
        const { email, password } = await req.json();
        console.log("📝 Email:", email);
        
        // Find user WITHOUT populate
        const user = await User.findOne({ email });
        console.log("👤 User found:", !!user);
        
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        
        console.log("👤 User details:", {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            hasPasswordHash: !!user.passwordHash
        });
        
        // Test password comparison
        const valid = await bcrypt.compare(password, user.passwordHash as string);
        console.log("🔐 Password valid:", valid);
        
        if (!valid) {
            return NextResponse.json({ error: "Invalid password" }, { status: 401 });
        }
        
        return NextResponse.json({
            message: "Simple login successful",
            user: {
                id: user._id,
                firstName: user.firstName,
                email: user.email,
                role: user.role
            }
        });
        
    } catch (error) {
        console.error("❌ Simple login error:", error);
        
        return NextResponse.json({
            error: "Simple login failed",
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            errorName: error instanceof Error ? error.name : 'Unknown'
        }, { status: 500 });
    }
}

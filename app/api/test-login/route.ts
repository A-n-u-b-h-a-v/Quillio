import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/db";
import User from "@/models/User";

export async function POST(req: NextRequest) {
    try {
        console.log("🧪 Testing simple login...");
        
        await connectMongoDB();
        console.log("✅ Database connected");
        
        const { email } = await req.json();
        console.log("🔍 Looking for user:", email);
        
        const user = await User.findOne({ email });
        console.log("👤 User found:", user ? "Yes" : "No");
        
        if (user) {
            console.log("👤 User details:", {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                hasPasswordHash: !!user.passwordHash
            });
        }
        
        return NextResponse.json({
            message: "Test completed",
            userFound: !!user,
            user: user ? {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                hasPasswordHash: !!user.passwordHash
            } : null
        });
        
    } catch (error) {
        console.error("❌ Test login error:", error);
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        
        return NextResponse.json({
            error: "Test failed",
            details: errorMessage
        }, { status: 500 });
    }
}

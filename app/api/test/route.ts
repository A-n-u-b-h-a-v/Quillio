import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/db";

export async function GET() {
    try {
        console.log("🧪 Testing API...");
        
        // Test environment variables
        const envCheck = {
            MONGODB_URI: process.env.MONGODB_URI ? "✅ Set" : "❌ Missing",
            JWT_SECRET: process.env.JWT_SECRET ? "✅ Set" : "❌ Missing",
            NODE_ENV: process.env.NODE_ENV || "Not set"
        };
        
        console.log("Environment check:", envCheck);
        
        // Test database connection
        await connectMongoDB();
        console.log("✅ Database connected successfully");
        
        return NextResponse.json({
            status: "success",
            message: "API is working",
            environment: envCheck,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error("❌ Test API error:", error);
        
        // Properly handle the unknown error type
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        
        return NextResponse.json({
            status: "error",
            message: errorMessage,
            environment: {
                MONGODB_URI: process.env.MONGODB_URI ? "✅ Set" : "❌ Missing",
                JWT_SECRET: process.env.JWT_SECRET ? "✅ Set" : "❌ Missing",
                NODE_ENV: process.env.NODE_ENV || "Not set"
            }
        }, { status: 500 });
    }
}

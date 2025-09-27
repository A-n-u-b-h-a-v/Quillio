import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/db";
import { SUBSCRIPTION_PLANS } from "@/lib/constants/subscription";
import { USER_ROLES } from "@/lib/constants/user";
import Tenant from "@/models/Tenant";
import User from "@/models/User";
import { hashPassword } from "@/utils/hash";

export async function POST(req: NextRequest) {
    try {
        console.log("🌱 Starting production database seeding...");
        
        // Add a simple security check (you can remove this later)
        const { secret } = await req.json();
        if (secret !== "seed-production-2024") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        
        await connectMongoDB();
        console.log("✅ Connected to MongoDB");
        
        // Clear existing data (optional - remove this if you want to keep existing data)
        await User.deleteMany({});
        await Tenant.deleteMany({});
        console.log("🧹 Cleared existing data");
        
        // Create tenants
        const acmeTenant = await Tenant.create({
            title: "Acme Corporation",
            slug: "acme",
            subscriptionPlan: SUBSCRIPTION_PLANS.FREE,
            notesCount: 0,
        });
        
        const globexTenant = await Tenant.create({
            title: "Globex Corporation",
            slug: "globex",
            subscriptionPlan: SUBSCRIPTION_PLANS.FREE,
            notesCount: 0,
        });
        
        console.log("✅ Created tenants");
        
        const passwordHash = await hashPassword("password");
        
        const users = [
            { firstName: "Admin", lastName: "User", email: "admin@acme.test", passwordHash, role: USER_ROLES.ADMIN, tenantId: acmeTenant._id },
            { firstName: "Regular", lastName: "User", email: "user@acme.test", passwordHash, role: USER_ROLES.MEMBER, tenantId: acmeTenant._id },
            { firstName: "Admin", lastName: "User", email: "admin@globex.test", passwordHash, role: USER_ROLES.ADMIN, tenantId: globexTenant._id },
            { firstName: "Regular", lastName: "User", email: "user@globex.test", passwordHash, role: USER_ROLES.MEMBER, tenantId: globexTenant._id },
        ];
        
        await User.insertMany(users);
        console.log("✅ Created users");
        
        return NextResponse.json({
            message: "Database seeded successfully!",
            users: [
                "admin@acme.test / password / Admin / Acme",
                "user@acme.test / password / Member / Acme", 
                "admin@globex.test / password / Admin / Globex",
                "user@globex.test / password / Member / Globex"
            ]
        });
        
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        
        return NextResponse.json({
            error: "Seeding failed",
            details: errorMessage
        }, { status: 500 });
    }
}

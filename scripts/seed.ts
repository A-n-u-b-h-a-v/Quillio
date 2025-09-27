// scripts/seed.ts
import dotenv from "dotenv";
dotenv.config({ path: '.env.local' }); // Must be first

import mongoose from "mongoose";
import { connectMongoDB } from "../lib/db";
import { SUBSCRIPTION_PLANS } from "../lib/constants/subscription";
import { USER_ROLES } from "../lib/constants/user";
import Tenant from "../models/Tenant";
import User from "../models/User";
import { hashPassword } from "../utils/hash";

async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...");

    if (process.env.NODE_ENV === "production") {
      throw new Error("❌ Seeding is disabled in production!");
    }


    await connectMongoDB();
    console.log("✅ Connected to MongoDB");

    // Clear existing data
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

    const passwordHash = await hashPassword("password");

    const users = [
      { firstName: "Admin", lastName: "User", email: "admin@acme.test", passwordHash, role: USER_ROLES.ADMIN, tenantId: acmeTenant._id },
      { firstName: "Regular", lastName: "User", email: "user@acme.test", passwordHash, role: USER_ROLES.MEMBER, tenantId: acmeTenant._id },
      { firstName: "Admin", lastName: "User", email: "admin@globex.test", passwordHash, role: USER_ROLES.ADMIN, tenantId: globexTenant._id },
      { firstName: "Regular", lastName: "User", email: "user@globex.test", passwordHash, role: USER_ROLES.MEMBER, tenantId: globexTenant._id },
    ];

    await User.insertMany(users);

    console.log("🎉 Database seeded successfully!");
    console.log("========================");
    console.log("Test Users:");
    console.log("admin@acme.test / password / Admin / Acme");
    console.log("user@acme.test / password / Member / Acme");
    console.log("admin@globex.test / password / Admin / Globex");
    console.log("user@globex.test / password / Member / Globex");
    console.log("========================");
  } catch (err) {
    console.error("❌ Seeding failed:", err);
  } finally {
    await mongoose.connection.close();
    console.log("🔒 MongoDB connection closed");
    process.exit(0);
  }
}

// Run seed
seedDatabase();

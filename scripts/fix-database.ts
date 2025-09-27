// scripts/fix-database.ts
import dotenv from "dotenv";
dotenv.config({ path: '.env.local' });

import mongoose from "mongoose";
import { connectMongoDB } from "../lib/db";

async function fixDatabase() {
  try {
    console.log("🔧 Fixing database collections...");

    if (process.env.NODE_ENV === "production") {
      throw new Error("❌ Database fixing is disabled in production!");
    }

    await connectMongoDB();
    console.log("✅ Connected to MongoDB");

    // Get the database
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("❌ Database connection not found");
    }

    // List all collections
    const collections = await db.listCollections().toArray();
    console.log("📋 Current collections:", collections.map(c => c.name));

    // Drop all collections to start fresh
    for (const collection of collections) {
      await db.collection(collection.name).drop();
      console.log(`🗑️  Dropped collection: ${collection.name}`);
    }

    console.log("✅ Database cleared successfully!");
    console.log("🌱 Now run: npm run seed");
    
  } catch (err) {
    console.error("❌ Database fixing failed:", err);
  } finally {
    await mongoose.connection.close();
    console.log("🔒 MongoDB connection closed");
    process.exit(0);
  }
}

// Run fix
fixDatabase();

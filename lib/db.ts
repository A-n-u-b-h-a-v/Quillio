// lib/db.ts
import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error("❌ MONGODB_URI not set in .env.local");
}

let cached: { conn: mongoose.Connection | null; promise: Promise<mongoose.Connection> | null } = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectMongoDB(): Promise<mongoose.Connection> {
  if (cached.conn) return cached.conn;
  if(MONGODB_URI){
    if (!cached.promise) {
      cached.promise = mongoose.connect(MONGODB_URI).then((m) => m.connection);
    }
  }

  cached.conn = await cached.promise;
  return cached.conn!; // assert non-null
}

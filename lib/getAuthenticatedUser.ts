import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "./db";
import { getUserFromToken, AuthenticatedUser } from "./auth";

export async function getAuthenticatedUser(req: NextRequest): Promise<AuthenticatedUser | null> {
  await connectMongoDB();

  const token = req.cookies.get("token")?.value;
  if (!token) {
    return null; // Return null instead of throwing
  }

  const user = (await getUserFromToken(token)) as AuthenticatedUser | null;
  if (!user) {
    return null; // Return null instead of throwing
  }

  return user;
}

import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "./db";
import { getUserFromToken, AuthenticatedUser } from "./auth";

export async function getAuthenticatedUser(req: NextRequest): Promise<AuthenticatedUser | null> {
  await connectMongoDB();

  // Check for token in cookies first
  let token = req.cookies.get("token")?.value;
  
  // If no cookie token, check Authorization header
  if (!token) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }
  }

  if (!token) {
    return null;
  }

  const user = (await getUserFromToken(token)) as AuthenticatedUser | null;
  if (!user) {
    return null;
  }

  return user;
}

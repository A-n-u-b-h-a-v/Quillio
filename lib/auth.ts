import jwt from "jsonwebtoken";
import { connectMongoDB } from "./db";
import User from "@/models/User";


export interface AuthenticatedUser {
    _id: string;
    firstName: string;
    role: 'admin' | 'member';
    tenantId: string;
  }
   

export interface JwtPayload {
  userId: string;
  firstName: string;
  role: 'admin' | 'member';
  tenantId: string;
}

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET must be defined in environment variables");
}


export const generateToken = (payload: JwtPayload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};


export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    throw new Error("Invalid Token");
  }
};


export async function getUserFromToken(token: string): Promise<AuthenticatedUser | null> {
    if (!token) return null;
  
    token = token.trim();
    if (token.startsWith("Bearer ")) token = token.slice(7).trim();
  
    let data: JwtPayload;
    try {
      data = verifyToken(token);
    } catch {
      return null;
    }
  
    if (!data?.userId) return null;
  
    await connectMongoDB();
  
    const user = await User.findById(data.userId)
      .select("_id firstName role tenantId")
      .lean();
  
    if (!user) return null;
  
    const authUser: AuthenticatedUser = {
      _id: user._id.toString(),
      firstName: user.firstName,
      role: user.role,
      tenantId: user.tenantId.toString(),
    };
  
    return authUser;
  }
  

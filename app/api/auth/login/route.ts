import { NextRequest, NextResponse } from "next/server";
import User from "@/models/User";
import Tenant from "@/models/Tenant";
import { signinInput } from "@/schemas/zodTypes";
import { connectMongoDB } from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
    try {
        await connectMongoDB();
        
        const json = await req.json();
        const validation = signinInput.safeParse(json);
        
        if (!validation.success) {
            return NextResponse.json(
                { error: "Invalid input", details: validation.error.flatten() },
                { status: 400 }
            );
        }
        
        const { email, password } = validation.data;
        
        const user = await User.findOne({ email }).populate('tenantId');
        
        if (!user) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }
        
        // Use passwordHash field from the model
        const valid = await bcrypt.compare(password, user.passwordHash as string);
        
        if (!valid) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }
        
        if (user._id) {
            const token = jwt.sign(
                { 
                    userId: user._id, 
                    tenantId: user.tenantId,
                    role: user.role 
                },
                process.env.JWT_SECRET as string,
                { expiresIn: '7d' }
            );
            
            return NextResponse.json({
                message: "Login successful",
                token,
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role,
                    tenantId: user.tenantId,
                }
            });
        }
        
        return NextResponse.json({ error: "Login failed" }, { status: 500 });
        
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}


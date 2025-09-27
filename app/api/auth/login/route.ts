import { NextRequest, NextResponse } from "next/server"
import { connectMongoDB } from "@/lib/db"
import { User, Tenant } from "@/models"
import bcrypt from 'bcryptjs'
import { generateToken } from '@/lib/auth'
import { signinInput } from "@/schemas/zodTypes"

export async function POST(req: NextRequest) {
    await connectMongoDB()

    const json = await req.json()

    const parsed = signinInput.safeParse(json)
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    const { email, password } = parsed.data
    
    console.log('Looking for user with email:', email);
    const user = await User.findOne({ email }).populate('tenantId');
    console.log('Found user:', user ? 'Yes' : 'No');
    if (user) {
        console.log('User details:', {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            role: user.role,
            tenantId: user.tenantId,
            hasPasswordHash: !!user.passwordHash
        });
    }
    if (!user) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }
    
    // Use passwordHash field from the model
    const valid = await bcrypt.compare(password, user.passwordHash);
    console.log('Password valid:', valid);
    
    if (!valid) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }
    
    if (user._id) {
        const token = generateToken({
            userId: user._id.toString(),
            firstName: user.firstName,
            role: user.role,
            tenantId: user.tenantId.toString()
        })

        const response = NextResponse.json({
            message: "Logged In",
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                tenantId: user.tenantId
            }
        }, { status: 200 })
    
        response.cookies.set("token", token, { 
            httpOnly: true, 
            path: '/', 
            secure: process.env.NODE_ENV === 'production', 
            sameSite: 'lax' 
        })
        return response
    }
    
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
}


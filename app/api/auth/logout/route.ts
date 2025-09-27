import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const response = NextResponse.json({ message: "Logged out" }, { status: 200 });
    response.cookies.set("token", "", {
        httpOnly: true,
        path: "/",
        expires: new Date(0),
    });
    return response;
}

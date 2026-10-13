import { NextResponse } from "next/server";

export async function POST() {
    return NextResponse.json(
        { 
            error: "Direct manual registration is disabled. All new accounts must register using Google Sign-In, followed by password setup." 
        },
        { status: 403 }
    );
}


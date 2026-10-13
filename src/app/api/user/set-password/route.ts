import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { encode, decode } from "next-auth/jwt";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id && !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized. Please log in again." }, { status: 401 });
    }

    const body = await req.json();
    const { password, confirmPassword } = body;

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Look up target user by ID or Email
    const dbUser = await prisma.user.findFirst({
      where: {
        OR: [
          ...(session.user.id ? [{ id: session.user.id }] : []),
          ...(session.user.email ? [{ email: session.user.email }] : []),
        ],
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User account not found." }, { status: 404 });
    }

    // 1. Update password in the User table
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { password: hashedPassword },
    });

    const response = NextResponse.json({
      success: true,
      message: "Password set successfully.",
    });

    // 2. Update the active session in DB and write updated cookie with hasPassword = true
    const secret = process.env.NEXTAUTH_SECRET || "";
    const activeSession = await prisma.session.findFirst({
      where: {
        userId: dbUser.id,
        expires: { gt: new Date() },
      },
      orderBy: { expires: "desc" },
    });

    if (activeSession && secret) {
      try {
        const decoded = await decode({ token: activeSession.sessionToken, secret });
        if (decoded) {
          const targetExpiresAt = Math.floor(activeSession.expires.getTime() / 1000);
          const remainingSeconds = Math.max(1, targetExpiresAt - Math.floor(Date.now() / 1000));

          const updatedTokenPayload = {
            ...decoded,
            hasPassword: true,
          };

          const updatedJwt = await encode({
            token: updatedTokenPayload,
            secret,
            maxAge: remainingSeconds,
          });

          // Update active session in DB
          await prisma.session.update({
            where: { id: activeSession.id },
            data: { sessionToken: updatedJwt },
          });

          // Set updated cookie directly on the response
          const isHttps = Boolean(
            process.env.NEXTAUTH_URL?.startsWith("https://") ||
            req.headers.get("x-forwarded-proto") === "https" ||
            req.url.startsWith("https://")
          );
          const cookieName = isHttps ? "__Secure-next-auth.session-token" : "next-auth.session-token";

          response.cookies.set(cookieName, updatedJwt, {
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            secure: isHttps,
            maxAge: remainingSeconds,
          });
        }
      } catch (tokenErr) {
        console.error("Error updating session token after password set:", tokenErr);
      }
    }

    return response;
  } catch (error) {
    console.error("Error setting password:", error);
    return NextResponse.json(
      { error: "Failed to set password. Please try again." },
      { status: 500 }
    );
  }
}

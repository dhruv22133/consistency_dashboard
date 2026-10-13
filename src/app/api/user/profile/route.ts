import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET: Fetch real user profile from PostgreSQL
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        motto: true,
        dailyReminderHours: true,
        monthlyIntervalDays: true,
        yearlyIntervalMonths: true,
        createdAt: true,
        password: true,
        timezone: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { password, ...safeUser } = user;
    return NextResponse.json({
      user: {
        ...safeUser,
        hasPassword: Boolean(password && password.length > 0),
      },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT: Update user profile & motto in PostgreSQL
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      motto,
      dailyReminderHours,
      monthlyIntervalDays,
      yearlyIntervalMonths,
      timezone,
      currentPassword,
      newPassword,
    } = body;

    // Handle password change if requested
    if (newPassword) {
      if (typeof newPassword !== "string" || newPassword.length < 6) {
        return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
      }
      const existingUser = await prisma.user.findUnique({
        where: { id: session.user.id },
      });
      if (existingUser?.password) {
        const bcrypt = (await import("bcryptjs")).default;
        const isMatch = await bcrypt.compare(currentPassword || "", existingUser.password);
        if (!isMatch) {
          return NextResponse.json({ error: "Current password does not match" }, { status: 400 });
        }
      }
      const bcrypt = (await import("bcryptjs")).default;
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: session.user.id },
        data: { password: hashedPassword },
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(motto !== undefined && { motto }),
        ...(dailyReminderHours !== undefined && { dailyReminderHours: Number(dailyReminderHours) }),
        ...(monthlyIntervalDays !== undefined && { monthlyIntervalDays: Number(monthlyIntervalDays) }),
        ...(yearlyIntervalMonths !== undefined && { yearlyIntervalMonths: Number(yearlyIntervalMonths) }),
        ...(timezone !== undefined && { timezone }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        motto: true,
        dailyReminderHours: true,
        monthlyIntervalDays: true,
        yearlyIntervalMonths: true,
        timezone: true,
      },
    });

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

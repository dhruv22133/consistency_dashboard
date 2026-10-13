import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { evaluateAndDispatchUserReminder } from "@/lib/webPush";

export const dynamic = "force-dynamic";

// Background scheduler runner: Evaluates task status for users and pushes notifications
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // Security check: if CRON_SECRET is configured, require matching Bearer token OR an authenticated session
    const isSecretMatch = Boolean(cronSecret && authHeader === `Bearer ${cronSecret}`);
    let isUserAuthorized = false;

    if (!isSecretMatch) {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        isUserAuthorized = true;
      }
    }

    if (!isSecretMatch && !isUserAuthorized && cronSecret) {
      return NextResponse.json({ error: "Unauthorized. Missing or invalid authorization." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId");

    const usersWithSubscriptions = await prisma.user.findMany({
      where: {
        ...(targetUserId ? { id: targetUserId } : {}),
        pushSubscriptions: {
          some: {},
        },
      },
      select: { id: true, email: true },
    });

    const results = [];

    for (const user of usersWithSubscriptions) {
      const payload = await evaluateAndDispatchUserReminder(user.id);
      results.push({ userId: user.id, email: user.email, payload });
    }

    return NextResponse.json({
      success: true,
      evaluatedUsers: results.length,
      results,
    });
  } catch (error) {
    console.error("Error dispatching background push notifications:", error);
    return NextResponse.json({ error: "Failed to dispatch reminders" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return POST(req);
}


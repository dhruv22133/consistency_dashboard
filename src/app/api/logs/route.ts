import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET: Fetch all day logs for the logged in user from PostgreSQL
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const logs = await prisma.dayLog.findMany({
      where: { userId: session.user.id },
      orderBy: { date: "desc" },
    });

    const dayLogsRecord: Record<string, any> = {};
    for (const log of logs) {
      dayLogsRecord[log.date] = {
        date: log.date,
        totalDailyTasks: log.totalDailyTasks,
        completedDailyTasks: log.completedDailyTasks,
        completionRate: log.completionRate,
        completedTaskTitles: log.completedTaskTitles,
        missedTaskTitles: log.missedTaskTitles,
      };
    }

    return NextResponse.json({ dayLogs: dayLogsRecord });
  } catch (error) {
    console.error("Error fetching logs from DB:", error);
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}

// POST: Upsert day log for a specific date in PostgreSQL
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { date, totalDailyTasks, completedDailyTasks, completionRate, completedTaskTitles, missedTaskTitles } = body;

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    const upserted = await prisma.dayLog.upsert({
      where: {
        userId_date: {
          userId: session.user.id,
          date,
        },
      },
      update: {
        totalDailyTasks: Number(totalDailyTasks) || 0,
        completedDailyTasks: Number(completedDailyTasks) || 0,
        completionRate: Number(completionRate) || 0,
        completedTaskTitles: Array.isArray(completedTaskTitles) ? completedTaskTitles : [],
        missedTaskTitles: Array.isArray(missedTaskTitles) ? missedTaskTitles : [],
      },
      create: {
        userId: session.user.id,
        date,
        totalDailyTasks: Number(totalDailyTasks) || 0,
        completedDailyTasks: Number(completedDailyTasks) || 0,
        completionRate: Number(completionRate) || 0,
        completedTaskTitles: Array.isArray(completedTaskTitles) ? completedTaskTitles : [],
        missedTaskTitles: Array.isArray(missedTaskTitles) ? missedTaskTitles : [],
      },
    });

    return NextResponse.json({ log: upserted });
  } catch (error) {
    console.error("Error saving log to DB:", error);
    return NextResponse.json({ error: "Failed to save log" }, { status: 500 });
  }
}

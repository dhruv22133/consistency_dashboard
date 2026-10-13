import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateISO } from "@/lib/utils";

export const dynamic = "force-dynamic";

// GET: Fetch tasks for the logged in user from PostgreSQL
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const timeframe = searchParams.get("timeframe");
    const targetDate = searchParams.get("targetDate");

    const whereClause: any = { userId: session.user.id };
    if (timeframe && ["daily", "monthly", "yearly"].includes(timeframe)) {
      whereClause.timeframe = timeframe;
    }
    if (targetDate) {
      whereClause.targetDate = targetDate;
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: 250,
    });

    const formattedTasks = tasks.map((t) => ({
      id: t.id,
      title: t.title,
      timeframe: t.timeframe as "daily" | "monthly" | "yearly",
      completed: t.completed,
      streak: t.streak,
      targetDate: t.targetDate || undefined,
      completedAt: t.completedAt ? t.completedAt.toISOString() : undefined,
      createdAt: t.createdAt.toISOString(),
    }));

    return NextResponse.json({ tasks: formattedTasks });
  } catch (error) {
    console.error("Error fetching tasks from DB:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

// POST: Add task(s) for the logged in user into PostgreSQL
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const taskItems = Array.isArray(body.tasks) ? body.tasks : [body];

    if (!taskItems || taskItems.length === 0) {
      return NextResponse.json({ error: "No tasks provided" }, { status: 400 });
    }

    const todayLocalStr = formatDateISO(new Date());
    const createdTasks = [];

    for (const item of taskItems) {
      if (!item.title || typeof item.title !== "string" || !item.title.trim()) continue;
      const cleanTitle = item.title.trim().slice(0, 500); // Sanitize max title length
      const tf = item.timeframe && ["daily", "monthly", "yearly"].includes(item.timeframe)
        ? item.timeframe
        : "daily";

      const targetDate = item.targetDate || (tf === "daily" ? todayLocalStr : null);

      const created = await prisma.task.create({
        data: {
          title: cleanTitle,
          timeframe: tf,
          completed: false,
          streak: item.streak ? Number(item.streak) : 0,
          targetDate: targetDate,
          userId: session.user.id,
        },
      });

      createdTasks.push({
        id: created.id,
        title: created.title,
        timeframe: created.timeframe as "daily" | "monthly" | "yearly",
        completed: created.completed,
        streak: created.streak,
        targetDate: created.targetDate || undefined,
        completedAt: created.completedAt ? created.completedAt.toISOString() : undefined,
        createdAt: created.createdAt.toISOString(),
      });
    }

    return NextResponse.json({ tasks: createdTasks });
  } catch (error) {
    console.error("Error creating tasks in DB:", error);
    return NextResponse.json({ error: "Failed to create tasks" }, { status: 500 });
  }
}

// PATCH: Toggle task completion or update streak/title
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, completed, streak, title } = body;

    if (!id) {
      return NextResponse.json({ error: "Task ID required" }, { status: 400 });
    }

    const existing = await prisma.task.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const dataToUpdate: any = {};
    if (completed !== undefined) {
      dataToUpdate.completed = Boolean(completed);
      dataToUpdate.completedAt = completed ? new Date() : null;
    }
    if (streak !== undefined) {
      dataToUpdate.streak = Number(streak);
    }
    if (title !== undefined && typeof title === "string") {
      dataToUpdate.title = title.trim();
    }

    const updated = await prisma.task.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({
      task: {
        id: updated.id,
        title: updated.title,
        timeframe: updated.timeframe,
        completed: updated.completed,
        streak: updated.streak,
        targetDate: updated.targetDate || undefined,
        completedAt: updated.completedAt ? updated.completedAt.toISOString() : undefined,
        createdAt: updated.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error updating task in DB:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

// DELETE: Remove task by ID for current user
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Task ID required" }, { status: 400 });
    }

    const existing = await prisma.task.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task from DB:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}

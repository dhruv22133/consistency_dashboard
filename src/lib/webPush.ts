import webpush from "web-push";
import { prisma } from "@/lib/prisma";
import { formatDateISO } from "@/lib/utils";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:support@consistencydashboard.com";

if (vapidPublicKey && vapidPrivateKey) {
  try {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  } catch (err) {
    console.error("Failed to initialize VAPID details:", err);
  }
}

export { webpush };

export interface PushPayload {
  title: string;
  body: string;
  category?: "no_tasks_today" | "remaining_tasks" | "all_completed" | "monthly_digest" | "yearly_review" | "system";
  tag?: string;
  url?: string;
}

// Send push notification to all devices registered by a user
export async function sendPushNotificationToUser(userId: string, payload: PushPayload): Promise<{ sent: number; failed: number }> {
  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) {
      return { sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;

    const payloadString = JSON.stringify(payload);

    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            payloadString
          );
          sent++;
        } catch (error: unknown) {
          failed++;
          const errStatus = (error as { statusCode?: number })?.statusCode;
          console.error(`Push notification failed for subscription ${sub.id}:`, errStatus);
          // 410 Gone or 404 Not Found indicates subscription has expired or unsubscribed
          if (errStatus === 410 || errStatus === 404) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
          }
        }
      })
    );

    return { sent, failed };
  } catch (error) {
    console.error(`Error sending push notification to user ${userId}:`, error);
    return { sent: 0, failed: 0 };
  }
}

// Evaluate user's daily tasks status and send the appropriate explicit notification
export async function evaluateAndDispatchUserReminder(userId: string): Promise<PushPayload | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        dailyReminderHours: true,
        lastDailyPushAt: true,
        timezone: true,
      },
    });

    const now = new Date();

    // 1. Cooldown throttling: check if reminder was already sent within user's reminder interval
    const intervalHours = user?.dailyReminderHours || 5;
    const intervalMs = intervalHours * 60 * 60 * 1000;
    if (user?.lastDailyPushAt) {
      const elapsedMs = now.getTime() - new Date(user.lastDailyPushAt).getTime();
      if (elapsedMs < intervalMs) {
        return null; // Within cooldown window, skip to prevent spam
      }
    }

    // 2. Determine today's date in user's specific timezone
    const userTz = user?.timezone || "UTC";
    let todayStr: string;
    try {
      todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: userTz }).format(now);
    } catch {
      todayStr = formatDateISO(now);
    }

    // Fetch daily tasks for this user
    const tasks = await prisma.task.findMany({
      where: {
        userId,
        timeframe: "daily",
      },
    });

    // Filter tasks belonging to user's today
    const dailyTasksToday = tasks.filter((t) => {
      const taskDate = t.targetDate || formatDateISO(new Date(t.createdAt));
      return taskDate === todayStr;
    });

    let payload: PushPayload;

    if (dailyTasksToday.length === 0) {
      payload = {
        title: "⚠️ No Tasks Created Today",
        body: "You haven't created any daily tasks for today yet. Add your daily routine to stay consistent!",
        category: "no_tasks_today",
        tag: `no-tasks-${todayStr}`,
        url: "/",
      };
    } else {
      const remaining = dailyTasksToday.filter((t) => !t.completed);
      if (remaining.length > 0) {
        const remainingTitles = remaining.map((t) => t.title);
        const titlesPreview = remainingTitles.slice(0, 3).join(", ") + (remainingTitles.length > 3 ? "..." : "");
        payload = {
          title: `⚡ Remaining Daily Tasks (${remaining.length} Pending)`,
          body: `You have ${remaining.length} pending task(s) today: ${titlesPreview}. Complete them before midnight to maintain your streak!`,
          category: "remaining_tasks",
          tag: `pending-tasks-${todayStr}`,
          url: "/",
        };
      } else {
        // If all tasks are completed, only congratulate once per day
        const alreadyCongratulated = await prisma.notification.findFirst({
          where: {
            userId,
            title: { contains: "All Daily Tasks Completed" },
            createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          },
        });

        if (alreadyCongratulated) {
          return null;
        }

        payload = {
          title: "🎯 All Daily Tasks Completed",
          body: "Awesome! You have completed all daily tasks for today. Your consistency streak is protected!",
          category: "all_completed",
          tag: `all-completed-${todayStr}`,
          url: "/",
        };
      }
    }

    // 1. Dispatch Web Push to registered device(s)
    await sendPushNotificationToUser(userId, payload);

    // 2. Register in Notification table in DB
    await prisma.notification.create({
      data: {
        title: payload.title,
        message: payload.body,
        timeframe: "daily",
        remainingCount: payload.category === "remaining_tasks" ? dailyTasksToday.filter((t) => !t.completed).length : 0,
        userId,
        read: false,
        intervalHours,
      },
    }).catch(() => {});

    // 3. Record last push timestamp on user to enforce cooldown
    await prisma.user.update({
      where: { id: userId },
      data: { lastDailyPushAt: now },
    }).catch(() => {});

    return payload;
  } catch (error) {
    console.error("Error evaluating reminders for user:", error);
    return null;
  }
}


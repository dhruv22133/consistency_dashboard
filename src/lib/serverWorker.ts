import { prisma } from "@/lib/prisma";
import { evaluateAndDispatchUserReminder } from "@/lib/webPush";

// Background worker that runs on the Node server every 30 minutes to evaluate daily reminders
let isWorkerStarted = false;

export function initServerNotificationWorker(): void {
  if (isWorkerStarted) return;
  isWorkerStarted = true;

  console.log("[Server Worker] Consistency Notification Worker initialized.");

  // Check every 30 minutes
  const INTERVAL_MS = 30 * 60 * 1000;

  setInterval(async () => {
    try {
      const users = await prisma.user.findMany({
        where: {
          pushSubscriptions: {
            some: {},
          },
        },
        select: { id: true },
      });

      for (const user of users) {
        await evaluateAndDispatchUserReminder(user.id);
      }
    } catch (err) {
      console.error("[Server Worker] Error during scheduled push dispatch:", err);
    }
  }, INTERVAL_MS);
}

// Automatically start when loaded in Node runtime
if (typeof window === "undefined" && process.env.NODE_ENV !== "test") {
  initServerNotificationWorker();
}

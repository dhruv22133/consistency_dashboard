export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { initServerNotificationWorker } = await import("@/lib/serverWorker");
      initServerNotificationWorker();
    } catch (err) {
      console.error("[Instrumentation] Failed to initialize server notification worker:", err);
    }
  }
}

import { Task, DayLog, SystemNotification, NotificationSchedule } from "@/types";
import { INITIAL_TASKS, generateInitialDayLogs, INITIAL_NOTIFICATIONS, DEFAULT_SCHEDULE_SETTINGS } from "./mockData";

const KEYS = {
  TASKS: "consistency_dashboard_tasks_v2",
  DAY_LOGS: "consistency_dashboard_day_logs_v2",
  NOTIFICATIONS: "consistency_dashboard_notifications_v2",
  SCHEDULE: "consistency_dashboard_schedule_v2",
};

// Purge old mock data from previous versions if present
if (typeof window !== "undefined") {
  try {
    localStorage.removeItem("consistency_dashboard_tasks_v1");
    localStorage.removeItem("consistency_dashboard_day_logs_v1");
    localStorage.removeItem("consistency_dashboard_notifications_v1");
    localStorage.removeItem("consistency_dashboard_schedule_v1");
  } catch {}
}

export const Storage = {
  getTasks(): Task[] {
    if (typeof window === "undefined") return INITIAL_TASKS;
    try {
      const data = localStorage.getItem(KEYS.TASKS);
      return data ? JSON.parse(data) : INITIAL_TASKS;
    } catch {
      return INITIAL_TASKS;
    }
  },

  saveTasks(tasks: Task[]): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
    } catch (e) {
      console.error("Failed to save tasks:", e);
    }
  },

  getDayLogs(): Record<string, DayLog> {
    if (typeof window === "undefined") return generateInitialDayLogs();
    try {
      const data = localStorage.getItem(KEYS.DAY_LOGS);
      return data ? JSON.parse(data) : generateInitialDayLogs();
    } catch {
      return generateInitialDayLogs();
    }
  },

  saveDayLogs(logs: Record<string, DayLog>): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(KEYS.DAY_LOGS, JSON.stringify(logs));
    } catch (e) {
      console.error("Failed to save day logs:", e);
    }
  },

  getNotifications(): SystemNotification[] {
    if (typeof window === "undefined") return INITIAL_NOTIFICATIONS;
    try {
      const data = localStorage.getItem(KEYS.NOTIFICATIONS);
      return data ? JSON.parse(data) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  },

  saveNotifications(notifications: SystemNotification[]): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    } catch (e) {
      console.error("Failed to save notifications:", e);
    }
  },

  getScheduleSettings(): NotificationSchedule {
    if (typeof window === "undefined") return DEFAULT_SCHEDULE_SETTINGS;
    try {
      const data = localStorage.getItem(KEYS.SCHEDULE);
      return data ? JSON.parse(data) : DEFAULT_SCHEDULE_SETTINGS;
    } catch {
      return DEFAULT_SCHEDULE_SETTINGS;
    }
  },

  saveScheduleSettings(settings: NotificationSchedule): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(KEYS.SCHEDULE, JSON.stringify(settings));
    } catch (e) {
      console.error("Failed to save schedule settings:", e);
    }
  },
};

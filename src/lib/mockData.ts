import { Task, DayLog, SystemNotification, NotificationSchedule } from "@/types";

export const INITIAL_TASKS: Task[] = [];

// Helper to return initial day logs (empty by default)
export function generateInitialDayLogs(): Record<string, DayLog> {
  return {};
}

export const INITIAL_NOTIFICATIONS: SystemNotification[] = [];

export const DEFAULT_SCHEDULE_SETTINGS: NotificationSchedule = {
  dailyIntervalHours: 5,
  monthlyIntervalDays: 10,
  yearlyIntervalMonths: 3,
  lastDailyCheck: new Date().toISOString(),
  lastMonthlyCheck: new Date().toISOString(),
  lastYearlyCheck: new Date().toISOString(),
  browserNotificationsEnabled: false,
};

export type Timeframe = 'daily' | 'monthly' | 'yearly';

export interface Task {
  id: string;
  title: string;
  timeframe: Timeframe;
  completed: boolean;
  createdAt: string; // ISO String
  completedAt?: string; // ISO String
  targetDate?: string; // YYYY-MM-DD or timeframe marker
  streak?: number;
}

export interface DayLog {
  date: string; // YYYY-MM-DD
  totalDailyTasks: number;
  completedDailyTasks: number;
  completionRate: number; // 0 to 100
  completedTaskTitles: string[];
  missedTaskTitles?: string[];
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  timeframe: Timeframe | 'system';
  timestamp: string; // ISO String
  read: boolean;
  remainingCount: number;
  intervalHours?: number;
  category?: 'no_tasks_today' | 'remaining_tasks' | 'all_completed' | 'monthly_digest' | 'yearly_review' | 'system';
}

export interface NotificationSchedule {
  dailyIntervalHours: number; // 5 hours
  monthlyIntervalDays: number; // 10 days
  yearlyIntervalMonths: number; // 3 months
  lastDailyCheck: string;
  lastMonthlyCheck: string;
  lastYearlyCheck: string;
  browserNotificationsEnabled: boolean;
}

export interface DashboardStats {
  currentStreak: number;
  longestStreak: number;
  totalCompleted: number;
  consistencyRate: number; // %
  perfectDaysCount: number;
  missedDaysCount: number;
}

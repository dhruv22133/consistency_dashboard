import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { DayLog } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getMonthName(monthIndex: number): string {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return months[monthIndex];
}

export function getDayDotClass(
  completed: number,
  total: number,
  isFuture: boolean = false,
  isBeforeRegistration: boolean = false
): string {
  // Empty neutral dot for dates prior to registration
  if (isBeforeRegistration) {
    return "bg-[#c4c4c4] border border-[#b2b2b2] text-neutral-400 opacity-60";
  }

  if (isFuture) {
    return "bg-[#b8b8b8] border border-[#a8a8a8] text-neutral-600";
  }

  // If user didn't add any task, or added tasks and completed 0, mark as red (missed)
  if (total === 0 || completed === 0) {
    return "bg-red-600 border border-red-700 text-white shadow-[0_0_8px_rgba(220,38,38,0.5)]";
  }

  const rate = (completed / total) * 100;

  if (rate >= 100) {
    return "bg-[#121212] border border-black text-white shadow-sm";
  }
  if (rate >= 70) {
    return "bg-[#3e3e3e] border border-[#2e2e2e] text-white";
  }
  if (rate >= 40) {
    return "bg-[#6e6e6e] border border-[#5e5e5e] text-white";
  }
  return "bg-[#9e9e9e] border border-[#8e8e8e] text-neutral-900";
}

export function getDaysInMonth(year: number, month: number): Date[] {
  const date = new Date(year, month, 1);
  const days: Date[] = [];
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

export function getDaysForYearGrid(year: number): Date[] {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);
  const days: Date[] = [];
  const curr = new Date(startDate);

  while (curr <= endDate) {
    days.push(new Date(curr));
    curr.setDate(curr.getDate() + 1);
  }
  return days;
}

export function calculateConsistencyStats(
  dayLogs: Record<string, DayLog>,
  userRegisteredAt?: string,
  referenceDateStr?: string
): import("@/types").DashboardStats {
  const todayStr = referenceDateStr || formatDateISO(new Date());
  const regDateStr = userRegisteredAt && userRegisteredAt <= todayStr ? userRegisteredAt : todayStr;

  // Build a strict, contiguous list of calendar date strings from registration date up to todayStr
  const calendarDates: string[] = [];
  const [startYear, startMonth, startDay] = regDateStr.split("-").map(Number);
  const [endYear, endMonth, endDay] = todayStr.split("-").map(Number);

  const curr = new Date(startYear, startMonth - 1, startDay);
  const end = new Date(endYear, endMonth - 1, endDay);

  while (curr <= end) {
    calendarDates.push(formatDateISO(curr));
    curr.setDate(curr.getDate() + 1);
  }

  let perfectDaysCount = 0;
  let missedDaysCount = 0;
  let totalCompleted = 0;

  for (const date of calendarDates) {
    const log = dayLogs[date];
    const completed = log ? log.completedDailyTasks : 0;
    const total = log ? log.totalDailyTasks : 0;

    totalCompleted += completed;

    if (date < todayStr) {
      if (total > 0 && completed === total) {
        perfectDaysCount++;
      }
      if (total === 0 || completed === 0) {
        missedDaysCount++;
      }
    } else {
      if (total > 0 && completed === total) {
        perfectDaysCount++;
      }
    }
  }

  // Current Streak Calculation (walking backwards day by day from today)
  let currentStreak = 0;
  const todayLog = dayLogs[todayStr];
  const todayDone = todayLog ? todayLog.completedDailyTasks : 0;

  let checkIdx = calendarDates.length - 1;

  if (todayDone > 0) {
    while (checkIdx >= 0) {
      const d = calendarDates[checkIdx];
      const l = dayLogs[d];
      if (l && l.completedDailyTasks > 0) {
        currentStreak++;
        checkIdx--;
      } else {
        break;
      }
    }
  } else {
    // Today is still in progress; preserve streak from yesterday if yesterday was completed
    checkIdx = calendarDates.length - 2;
    while (checkIdx >= 0) {
      const d = calendarDates[checkIdx];
      const l = dayLogs[d];
      if (l && l.completedDailyTasks > 0) {
        currentStreak++;
        checkIdx--;
      } else {
        break;
      }
    }
  }

  // Longest Streak Calculation (walking forward day by day from registration date)
  let longestStreak = 0;
  let runningStreak = 0;

  for (let i = 0; i < calendarDates.length; i++) {
    const d = calendarDates[i];
    const l = dayLogs[d];
    const completed = l ? l.completedDailyTasks : 0;

    if (completed > 0) {
      runningStreak++;
      if (runningStreak > longestStreak) {
        longestStreak = runningStreak;
      }
    } else {
      if (d !== todayStr) {
        runningStreak = 0;
      }
    }
  }

  // True Consistency Rate = consistent days / total days elapsed
  const totalDaysElapsed = calendarDates.length || 1;
  const consistentDaysCount = calendarDates.filter((d) => {
    const l = dayLogs[d];
    return l && l.completedDailyTasks > 0;
  }).length;

  const consistencyRate = Math.round((consistentDaysCount / totalDaysElapsed) * 100);

  return {
    currentStreak,
    longestStreak,
    totalCompleted,
    consistencyRate: Math.max(0, Math.min(100, consistencyRate)),
    perfectDaysCount,
    missedDaysCount,
  };
}


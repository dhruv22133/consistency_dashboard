"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/Navbar";
import { StatsCards } from "@/components/StatsCards";
import { TaskArea } from "@/components/TaskArea";
import { CalendarView } from "@/components/CalendarView";
import { DotGridMatrix } from "@/components/DotGridMatrix";
import { NotificationDrawer } from "@/components/NotificationDrawer";
import { NotificationToast } from "@/components/NotificationToast";
import { AddTaskModal } from "@/components/AddTaskModal";
import { DayDetailModal } from "@/components/DayDetailModal";
import { Task, DayLog, SystemNotification, NotificationSchedule, DashboardStats, Timeframe } from "@/types";
import { Storage } from "@/lib/storage";
import { formatDateISO, calculateConsistencyStats } from "@/lib/utils";
import { Activity } from "lucide-react";
import { AuthModal } from "@/components/AuthModal";
import {
  sendNativeNotification,
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  subscribeUserToPush,
  unsubscribeUserFromPush,
} from "@/lib/notifications";

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Authentication check: redirect to /login if unauthenticated, or /set-password if password is not set
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    } else if (status === "authenticated" && session?.user && session.user.hasPassword === false) {
      router.replace("/set-password");
    }
  }, [status, session, router]);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [dayLogs, setDayLogs] = useState<Record<string, DayLog>>({});
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [userMotto, setUserMotto] = useState<string>("");
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [schedule, setSchedule] = useState<NotificationSchedule>({
    dailyIntervalHours: 5,
    monthlyIntervalDays: 10,
    yearlyIntervalMonths: 3,
    lastDailyCheck: new Date().toISOString(),
    lastMonthlyCheck: new Date().toISOString(),
    lastYearlyCheck: new Date().toISOString(),
    browserNotificationsEnabled: false,
  });

  // Determine user registration date (defaults to today for new registrations)
  const userRegisteredAt = useMemo(() => {
    if (session?.user?.createdAt) {
      return formatDateISO(new Date(session.user.createdAt));
    }
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("consistency_user_registered_at");
      if (stored) return stored;
    }
    return formatDateISO(new Date());
  }, [session]);

  // UI Modals & Pop-up Toasts
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [addTaskDefaultTimeframe, setAddTaskDefaultTimeframe] = useState<Timeframe>("daily");
  const [selectedDayLog, setSelectedDayLog] = useState<DayLog | null>(null);
  const [activeToast, setActiveToast] = useState<SystemNotification | null>(null);
  const [tasksLoading, setTasksLoading] = useState(true);

  // 1. Load initial cached state from localStorage for fast render
  useEffect(() => {
    const loadedTasks = Storage.getTasks();
    const loadedLogs = Storage.getDayLogs();
    const loadedNotifs = Storage.getNotifications();
    const loadedSchedule = Storage.getScheduleSettings();

    if (loadedTasks.length > 0) setTasks(loadedTasks);
    if (Object.keys(loadedLogs).length > 0) setDayLogs(loadedLogs);
    setNotifications(loadedNotifs);
    setSchedule(loadedSchedule);
  }, []);

  // Dynamically check browser notification permission every time user comes back to site
  useEffect(() => {
    const syncBrowserPermission = async () => {
      if (typeof window === "undefined" || !("Notification" in window)) return;
      const isGranted = Notification.permission === "granted";
      setSchedule((prev) => {
        if (prev.browserNotificationsEnabled !== isGranted) {
          const updated = { ...prev, browserNotificationsEnabled: isGranted };
          Storage.saveScheduleSettings(updated);
          return updated;
        }
        return prev;
      });

      // If user has allowed notifications, automatically ensure backend push subscription is active
      if (isGranted && status === "authenticated") {
        try {
          await subscribeUserToPush();
        } catch {
          // ignore background sync error
        }
      }
    };

    syncBrowserPermission();
    window.addEventListener("focus", syncBrowserPermission);
    document.addEventListener("visibilitychange", syncBrowserPermission);
    return () => {
      window.removeEventListener("focus", syncBrowserPermission);
      document.removeEventListener("visibilitychange", syncBrowserPermission);
    };
  }, [status]);

  // 2. Fetch real tasks and logs from PostgreSQL database
  useEffect(() => {
    if (status !== "authenticated") {
      setTasksLoading(false);
      return;
    }

    let isMounted = true;

    async function loadFromDB() {
      try {
        const [tasksRes, logsRes, profileRes, notifsRes] = await Promise.all([
          fetch("/api/tasks"),
          fetch("/api/logs"),
          fetch("/api/user/profile").catch(() => null),
          fetch("/api/notifications").catch(() => null),
        ]);

        if (profileRes && profileRes.ok) {
          const profileData = await profileRes.json();
          if (isMounted && profileData?.user) {
            if (profileData.user.motto) {
              setUserMotto(profileData.user.motto);
            }

            // Sync user's browser timezone if different
            try {
              const clientTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
              if (clientTz && profileData.user.timezone !== clientTz) {
                fetch("/api/user/profile", {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ timezone: clientTz }),
                }).catch(() => {});
              }
            } catch {}

            setSchedule((prev) => {
              const updated: NotificationSchedule = {
                ...prev,
                dailyIntervalHours: profileData.user.dailyReminderHours ?? prev.dailyIntervalHours,
                monthlyIntervalDays: profileData.user.monthlyIntervalDays ?? prev.monthlyIntervalDays,
                yearlyIntervalMonths: profileData.user.yearlyIntervalMonths ?? prev.yearlyIntervalMonths,
              };
              Storage.saveScheduleSettings(updated);
              return updated;
            });
          }
        }

        if (notifsRes && notifsRes.ok) {
          const notifsData = await notifsRes.json();
          if (isMounted && Array.isArray(notifsData.notifications)) {
            setNotifications(notifsData.notifications);
            Storage.saveNotifications(notifsData.notifications);
          }
        }

        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          if (isMounted && Array.isArray(tasksData.tasks)) {
            setTasks(tasksData.tasks);
            Storage.saveTasks(tasksData.tasks);

            // Auto-prompt daily tasks if no daily tasks exist for user today
            const todayStr = formatDateISO(new Date());
            const promptKey = `consistency_prompted_${todayStr}`;
            const promptedToday = typeof window !== "undefined" ? localStorage.getItem(promptKey) : null;
            const dailyCountToday = tasksData.tasks.filter((t: Task) => {
              if (t.timeframe !== "daily") return false;
              const taskDate = t.targetDate || (t.createdAt ? formatDateISO(new Date(t.createdAt)) : todayStr);
              return taskDate === todayStr;
            }).length;

            if (dailyCountToday === 0 && !promptedToday) {
              setAddTaskDefaultTimeframe("daily");
              setIsAddTaskOpen(true);
              if (typeof window !== "undefined") {
                localStorage.setItem(promptKey, "true");
              }
            }
          }
        }

        if (logsRes.ok) {
          const logsData = await logsRes.json();
          if (isMounted && logsData.dayLogs) {
            setDayLogs(logsData.dayLogs);
            Storage.saveDayLogs(logsData.dayLogs);
          }
        }
      } catch (err) {
        console.error("Error fetching tasks/logs from PostgreSQL:", err);
      } finally {
        if (isMounted) setTasksLoading(false);
      }
    }

    loadFromDB();

    return () => {
      isMounted = false;
    };
  }, [status]);

  // Keep today's day log updated and sync to PostgreSQL
  useEffect(() => {
    if (tasksLoading) return;

    const todayStr = formatDateISO(new Date());
    const dailyTasksToday = tasks.filter((t) => {
      if (t.timeframe !== "daily") return false;
      const taskDate = t.targetDate || (t.createdAt ? formatDateISO(new Date(t.createdAt)) : todayStr);
      return taskDate === todayStr;
    });

    const total = dailyTasksToday.length;
    const completed = dailyTasksToday.filter((t) => t.completed).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const completedTaskTitles = dailyTasksToday.filter((t) => t.completed).map((t) => t.title);
    const missedTaskTitles = dailyTasksToday.filter((t) => !t.completed).map((t) => t.title);

    const updatedLog: DayLog = {
      date: todayStr,
      totalDailyTasks: total,
      completedDailyTasks: completed,
      completionRate: rate,
      completedTaskTitles,
      missedTaskTitles,
    };

    setDayLogs((prev) => {
      const updated = { ...prev, [todayStr]: updatedLog };
      Storage.saveDayLogs(updated);
      return updated;
    });

    // Persist to PostgreSQL if authenticated and tasks exist for today
    if (status === "authenticated" && total > 0) {
      fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedLog),
      }).catch((e) => console.error("Failed to sync day log to DB:", e));
    }
  }, [tasks, tasksLoading, status]);

  // Calculate overall dashboard statistics filtered from registration date onwards
  const stats: DashboardStats = useMemo(() => {
    return calculateConsistencyStats(dayLogs, userRegisteredAt);
  }, [dayLogs, userRegisteredAt]);

  // Task Actions: Toggle completion with PostgreSQL persistence
  const handleToggleTask = async (taskId: string) => {
    let nextCompleted = false;
    let nextStreak = 0;

    setTasks((prev) => {
      const updated = prev.map((task) => {
        if (task.id === taskId) {
          nextCompleted = !task.completed;
          nextStreak = nextCompleted ? (task.streak || 0) + 1 : Math.max(0, (task.streak || 1) - 1);
          return {
            ...task,
            completed: nextCompleted,
            completedAt: nextCompleted ? new Date().toISOString() : undefined,
            streak: nextStreak,
          };
        }
        return task;
      });
      Storage.saveTasks(updated);
      return updated;
    });

    if (status === "authenticated" && !taskId.startsWith("temp-")) {
      try {
        await fetch("/api/tasks", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: taskId, completed: nextCompleted, streak: nextStreak }),
        });
      } catch (err) {
        console.error("Failed to update task in DB:", err);
      }
    }
  };

  // Task Actions: Delete task with PostgreSQL persistence
  const handleDeleteTask = async (taskId: string) => {
    setTasks((prev) => {
      const updated = prev.filter((t) => t.id !== taskId);
      Storage.saveTasks(updated);
      return updated;
    });

    if (status === "authenticated" && !taskId.startsWith("temp-")) {
      try {
        await fetch(`/api/tasks?id=${encodeURIComponent(taskId)}`, {
          method: "DELETE",
        });
      } catch (err) {
        console.error("Failed to delete task in DB:", err);
      }
    }
  };

  // Bulk add tasks handler with PostgreSQL persistence
  const handleAddTasks = async (newTasks: { title: string; timeframe: Timeframe }[]) => {
    if (newTasks.length === 0) return;

    const todayStr = formatDateISO(new Date());

    // Optimistic UI items
    const tempTasks: Task[] = newTasks.map((t, idx) => ({
      id: `temp-${Date.now()}-${idx}`,
      title: t.title,
      timeframe: t.timeframe,
      completed: false,
      createdAt: new Date().toISOString(),
      targetDate: t.timeframe === "daily" ? todayStr : undefined,
      streak: 0,
    }));

    setTasks((prev) => [...tempTasks, ...prev]);

    // Save to PostgreSQL
    if (status === "authenticated") {
      try {
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tasks: newTasks.map((t) => ({
              ...t,
              targetDate: t.timeframe === "daily" ? todayStr : undefined,
            })),
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.tasks)) {
            setTasks((prev) => {
              const withoutTemp = prev.filter((t) => !t.id.startsWith("temp-"));
              const combined = [...data.tasks, ...withoutTemp];
              Storage.saveTasks(combined);
              return combined;
            });
          }
        }
      } catch (err) {
        console.error("Failed to save tasks to database:", err);
      }
    }

    const tf = newTasks[0].timeframe;
    const scheduleDesc =
      tf === "daily"
        ? "Notification cycle set to every 5 hours."
        : tf === "monthly"
          ? "Notification cycle set to every 10 days."
          : "Notification cycle set to every 3 months.";

    const alert: SystemNotification = {
      id: `notif-${Date.now()}`,
      title: `${newTasks.length} New ${tf} Task(s) Added`,
      message: `Added ${newTasks.length} task(s). ${scheduleDesc}`,
      timeframe: tf,
      timestamp: new Date().toISOString(),
      read: false,
      remainingCount: tasks.filter((t) => t.timeframe === tf && !t.completed).length + newTasks.length,
    };

    setNotifications((prev) => [alert, ...prev]);
    setActiveToast(alert);
  };

  // Notification Actions
  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    if (status === "authenticated") {
      fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      }).catch(() => {});
    }
  };

  const handleClearNotifications = () => {
    setNotifications([]);
    Storage.saveNotifications([]);
    if (status === "authenticated") {
      fetch("/api/notifications", {
        method: "DELETE",
      }).catch(() => {});
    }
  };

  // Toggle browser push notifications with permission handling
  const handleToggleBrowserNotifications = async () => {
    if (!isNotificationSupported()) {
      alert("Browser notifications are not supported in your browser.");
      return;
    }

    const currentPermission = getNotificationPermission();

    if (currentPermission === "granted") {
      // Unsubscribe from backend Web Push alerts
      await unsubscribeUserFromPush();
      const updated: NotificationSchedule = {
        ...schedule,
        browserNotificationsEnabled: false,
      };
      setSchedule(updated);
      Storage.saveScheduleSettings(updated);
      alert("Browser push notifications unsubscribed from backend push alerts.");
      return;
    }

    if (currentPermission === "denied") {
      alert("Notification permission is blocked in your browser settings. Please click the site settings icon in your browser address bar to allow notifications.");
      return;
    }

    const permission = await requestNotificationPermission();
    if (permission === "granted") {
      // Register with backend Web Push
      await subscribeUserToPush();
      const updated: NotificationSchedule = {
        ...schedule,
        browserNotificationsEnabled: true,
      };
      setSchedule(updated);
      Storage.saveScheduleSettings(updated);

      await sendNativeNotification("🔔 Notifications Enabled", {
        body: `Consistency Dashboard will alert you every ${schedule.dailyIntervalHours || 5} hours if daily tasks remain pending.`,
      });
    } else {
      alert("Notification permission was not allowed. You can enable them anytime from your browser address bar.");
    }
  };

  // Background Notification Cycle Monitor (5 hours daily, 10 days monthly, 3 months yearly)
  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const checkScheduleCycles = () => {
      if (!schedule.browserNotificationsEnabled) return;
      if (getNotificationPermission() !== "granted") return;

      const now = Date.now();
      const todayStr = formatDateISO(new Date());

      // 1. Daily check: every schedule.dailyIntervalHours (default 5 hours)
      const lastDaily = schedule.lastDailyCheck ? new Date(schedule.lastDailyCheck).getTime() : 0;
      const dailyIntervalMs = (schedule.dailyIntervalHours || 5) * 60 * 60 * 1000;

      if (now - lastDaily >= dailyIntervalMs) {
        const dailyTasksToday = tasks.filter((t) => {
          if (t.timeframe !== "daily") return false;
          const taskDate = t.targetDate || (t.createdAt ? formatDateISO(new Date(t.createdAt)) : todayStr);
          return taskDate === todayStr;
        });
        const remainingTasks = dailyTasksToday.filter((t) => !t.completed);

        if (dailyTasksToday.length === 0) {
          const title = "⚠️ No Tasks Created Today";
          const message = "You haven't created any daily tasks for today yet. Add your daily goals now to keep your consistency streak alive!";

          sendNativeNotification(title, {
            body: message,
            tag: `daily-reminder-notasks-${todayStr}`,
          });

          const alert: SystemNotification = {
            id: `notif-${Date.now()}`,
            title,
            message,
            timeframe: "daily",
            category: "no_tasks_today",
            timestamp: new Date().toISOString(),
            read: false,
            remainingCount: 0,
            intervalHours: schedule.dailyIntervalHours,
          };

          setNotifications((prev) => [alert, ...prev]);
          setActiveToast(alert);
        } else if (remainingTasks.length > 0) {
          const title = `⚡ Remaining Daily Tasks (${remainingTasks.length} Pending)`;
          const message = `You have ${remainingTasks.length} daily task(s) remaining for today. Finish them before midnight to maintain your streak!`;

          sendNativeNotification(title, {
            body: message,
            tag: `daily-reminder-remaining-${todayStr}`,
          });

          const alert: SystemNotification = {
            id: `notif-${Date.now()}`,
            title,
            message,
            timeframe: "daily",
            category: "remaining_tasks",
            timestamp: new Date().toISOString(),
            read: false,
            remainingCount: remainingTasks.length,
            intervalHours: schedule.dailyIntervalHours,
          };

          setNotifications((prev) => [alert, ...prev]);
          setActiveToast(alert);
        } else {
          const title = "🎯 All Daily Tasks Completed";
          const message = "Awesome work! All daily tasks for today are 100% completed. Rest easy and keep up the momentum!";

          sendNativeNotification(title, {
            body: message,
            tag: `daily-reminder-completed-${todayStr}`,
          });

          const alert: SystemNotification = {
            id: `notif-${Date.now()}`,
            title,
            message,
            timeframe: "daily",
            category: "all_completed",
            timestamp: new Date().toISOString(),
            read: false,
            remainingCount: 0,
            intervalHours: schedule.dailyIntervalHours,
          };

          setNotifications((prev) => [alert, ...prev]);
          setActiveToast(alert);
        }

        const updated: NotificationSchedule = { ...schedule, lastDailyCheck: new Date().toISOString() };
        setSchedule(updated);
        Storage.saveScheduleSettings(updated);
      }

      // 2. Monthly check: every schedule.monthlyIntervalDays (default 10 days)
      const lastMonthly = schedule.lastMonthlyCheck ? new Date(schedule.lastMonthlyCheck).getTime() : 0;
      const monthlyIntervalMs = (schedule.monthlyIntervalDays || 10) * 24 * 60 * 60 * 1000;
      if (now - lastMonthly >= monthlyIntervalMs) {
        const monthlyTasks = tasks.filter((t) => t.timeframe === "monthly");
        const remainingMonthly = monthlyTasks.filter((t) => !t.completed);
        const title = "📅 Monthly Goals Progress Digest";
        const message = remainingMonthly.length > 0
          ? `You have ${remainingMonthly.length} monthly goal(s) in progress. Keep up the momentum!`
          : "Monthly check-in: Review your monthly progress and plan ahead!";

        sendNativeNotification(title, { body: message, tag: "monthly-check" });

        const alert: SystemNotification = {
          id: `notif-${Date.now()}`,
          title,
          message,
          timeframe: "monthly",
          category: "monthly_digest",
          timestamp: new Date().toISOString(),
          read: false,
          remainingCount: remainingMonthly.length,
        };
        setNotifications((prev) => [alert, ...prev]);
        setActiveToast(alert);

        const updated: NotificationSchedule = { ...schedule, lastMonthlyCheck: new Date().toISOString() };
        setSchedule(updated);
        Storage.saveScheduleSettings(updated);
      }

      // 3. Yearly check: every schedule.yearlyIntervalMonths (default 3 months)
      const lastYearly = schedule.lastYearlyCheck ? new Date(schedule.lastYearlyCheck).getTime() : 0;
      const yearlyIntervalMs = (schedule.yearlyIntervalMonths || 3) * 30 * 24 * 60 * 60 * 1000;
      if (now - lastYearly >= yearlyIntervalMs) {
        const yearlyTasks = tasks.filter((t) => t.timeframe === "yearly");
        const remainingYearly = yearlyTasks.filter((t) => !t.completed);
        const title = "🎯 Quarterly / Yearly Milestone Review";
        const message = `Milestone check-in! You have ${remainingYearly.length} long-term milestone(s) active.`;

        sendNativeNotification(title, { body: message, tag: "yearly-check" });

        const alert: SystemNotification = {
          id: `notif-${Date.now()}`,
          title,
          message,
          timeframe: "yearly",
          category: "yearly_review",
          timestamp: new Date().toISOString(),
          read: false,
          remainingCount: remainingYearly.length,
        };
        setNotifications((prev) => [alert, ...prev]);
        setActiveToast(alert);

        const updated: NotificationSchedule = { ...schedule, lastYearlyCheck: new Date().toISOString() };
        setSchedule(updated);
        Storage.saveScheduleSettings(updated);
      }
    };

    checkScheduleCycles();
    const intervalId = setInterval(checkScheduleCycles, 60 * 1000);

    const handleWake = () => checkScheduleCycles();
    window.addEventListener("visibilitychange", handleWake);
    window.addEventListener("focus", handleWake);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("visibilitychange", handleWake);
      window.removeEventListener("focus", handleWake);
    };
  }, [schedule, tasks]);

  // If loading or unauthenticated, show sleek minimal screen while redirecting
  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-[#dedede] flex items-center justify-center font-sans">
        <div className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-white border border-[#c8c8c8] shadow-sm">
          <Activity className="w-5 h-5 text-neutral-950 animate-pulse" />
          <span className="text-xs font-bold text-neutral-900 tracking-wider uppercase">Loading Consistency...</span>
        </div>
      </div>
    );
  }

  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-[#dedede] text-neutral-950 flex flex-col font-sans">

      {/* Top Navbar */}
      <Navbar
        stats={stats}
        unreadCount={unreadNotifCount}
        onOpenNotifications={() => setIsNotificationOpen(true)}
        onOpenAddTask={() => {
          setAddTaskDefaultTimeframe("daily");
          setIsAddTaskOpen(true);
        }}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-6 space-y-3.5 sm:space-y-5">

        {/* Overview Stats Cards */}
        <StatsCards stats={stats} />

        {/* Core Task Command Center Area */}
        <TaskArea
          tasks={tasks}
          onToggleTask={handleToggleTask}
          onDeleteTask={handleDeleteTask}
          onOpenAddTask={(tf) => {
            setAddTaskDefaultTimeframe(tf || "daily");
            setIsAddTaskOpen(true);
          }}
          motto={userMotto}
          schedule={schedule}
        />

        {/* GitHub-Style Contribution Heatmap Matrix (dates before registration are kept empty) */}
        <DotGridMatrix
          dayLogs={dayLogs}
          userRegisteredAt={userRegisteredAt}
          onSelectDay={(log) => setSelectedDayLog(log)}
        />

        {/* Monthly Calendar View with Task List in cells (dates before registration are kept empty) */}
        <CalendarView
          dayLogs={dayLogs}
          tasks={tasks}
          userRegisteredAt={userRegisteredAt}
          onToggleTask={handleToggleTask}
          onOpenAddTask={() => {
            setAddTaskDefaultTimeframe("daily");
            setIsAddTaskOpen(true);
          }}
          onSelectDay={(log) => setSelectedDayLog(log)}
        />

      </main>

      {/* Footer */}
      <footer className="border-t border-[#b8b8b8] bg-[#dedede] py-4 sm:py-6 text-center text-xs text-neutral-700 font-mono font-bold">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
            <Activity className="w-4 h-4 text-neutral-950 shrink-0" />
            <span className="font-bold text-neutral-950">Consistency Dashboard</span>
            <span className="hidden xs:inline sm:inline">— Urgent Alert Notification System</span>
          </div>
          <div className="text-[11px] sm:text-xs text-neutral-600">
            Built with Next.js, React, TypeScript & Tailwind CSS
          </div>
        </div>
      </footer>

      {/* On-Screen Urgent Pop-up Notification Toast */}
      <NotificationToast
        activeToast={activeToast}
        onClose={() => setActiveToast(null)}
        onOpenDrawer={() => setIsNotificationOpen(true)}
      />

      {/* Notification Drawer (Bell Icon Log) */}
      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        notifications={notifications}
        schedule={schedule}
        onMarkAsRead={handleMarkAsRead}
        onClearAll={handleClearNotifications}
        onToggleBrowserNotifications={handleToggleBrowserNotifications}
      />

      {/* Add Tasks Modal */}
      <AddTaskModal
        isOpen={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
        defaultTimeframe={addTaskDefaultTimeframe}
        onAddTasks={handleAddTasks}
      />

      {/* Day Log Details Modal */}
      <DayDetailModal
        log={selectedDayLog}
        onClose={() => setSelectedDayLog(null)}
        onOpenAddTask={() => {
          setAddTaskDefaultTimeframe("daily");
          setIsAddTaskOpen(true);
        }}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

    </div>
  );
}

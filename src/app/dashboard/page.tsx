"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { AuthModal } from "@/components/AuthModal";
import { DayLog, DashboardStats } from "@/types";
import { Storage } from "@/lib/storage";
import { formatDateISO, calculateConsistencyStats } from "@/lib/utils";
import {
  User,
  Shield,
  Bell,
  Clock,
  LogOut,
  ArrowLeft,
  AlertCircle,
  Laptop,
  Star,
  Pencil,
  Eye,
  EyeOff,
  Activity,
  Volume2,
  CheckCircle2,
  Compass,
  Calendar,
} from "lucide-react";
import {
  sendNativeNotification,
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  subscribeUserToPush,
  unsubscribeUserFromPush,
} from "@/lib/notifications";

type DashboardSection = "profile" | "cadence" | "notifications" | "security";

export default function UserDashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";

  // Redirect to /login if unauthenticated, or /set-password if password not set
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    } else if (status === "authenticated" && session?.user && session.user.hasPassword === false) {
      router.replace("/set-password");
    }
  }, [status, session, router]);

  // Active section in sidebar - clicking changes which section fields are visible
  const [activeSection, setActiveSection] = useState<DashboardSection>("profile");

  // Form State: Profile
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [motto, setMotto] = useState("");

  // Form State: Password Change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form State: Cadence & Timing
  const [dailyReminderHours, setDailyReminderHours] = useState(5);
  const [monthlyIntervalDays, setMonthlyIntervalDays] = useState(10);
  const [yearlyIntervalMonths, setYearlyIntervalMonths] = useState(3);

  // Form State: Notification Preferences
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission | "unsupported">("default");
  const [urgentAlertsEnabled, setUrgentAlertsEnabled] = useState(true);
  const [soundAlertsEnabled, setSoundAlertsEnabled] = useState(true);

  // Check browser notification permission every time user returns to site
  useEffect(() => {
    const checkBrowserPermission = () => {
      if (typeof window !== "undefined" && "Notification" in window) {
        setBrowserPermission(Notification.permission);
      } else {
        setBrowserPermission("unsupported");
      }
    };

    checkBrowserPermission();
    window.addEventListener("focus", checkBrowserPermission);
    document.addEventListener("visibilitychange", checkBrowserPermission);
    return () => {
      window.removeEventListener("focus", checkBrowserPermission);
      document.removeEventListener("visibilitychange", checkBrowserPermission);
    };
  }, []);

  // Loading & Feedback States
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSavingCadence, setIsSavingCadence] = useState(false);
  const [isSavingNotifs, setIsSavingNotifs] = useState(false);

  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState<string | null>(null);
  const [cadenceSuccessMsg, setCadenceSuccessMsg] = useState<string | null>(null);
  const [notifSuccessMsg, setNotifSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Consistency Stats state
  const [dayLogs, setDayLogs] = useState<Record<string, DayLog>>({});

  // Determine user registration date
  const userRegisteredAt = useMemo(() => {
    if (session?.user?.createdAt) {
      return formatDateISO(new Date(session.user.createdAt));
    }
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("consistency_user_registered_at");
      if (saved) return saved;
    }
    return formatDateISO(new Date());
  }, [session]);

  // Load user data & statistics
  useEffect(() => {
    // 1. Load consistency logs to compute stats
    const loadedLogs = Storage.getDayLogs();
    setDayLogs(loadedLogs);

    const loadedSchedule = Storage.getScheduleSettings();
    setDailyReminderHours(loadedSchedule.dailyIntervalHours || 5);
    setMonthlyIntervalDays(loadedSchedule.monthlyIntervalDays || 10);
    setYearlyIntervalMonths(loadedSchedule.yearlyIntervalMonths || 3);

    if (typeof window !== "undefined") {
      const savedUrgent = localStorage.getItem("consistency_urgent_alerts");
      if (savedUrgent !== null) setUrgentAlertsEnabled(savedUrgent === "true");
      const savedSound = localStorage.getItem("consistency_sound_alerts");
      if (savedSound !== null) setSoundAlertsEnabled(savedSound === "true");
    }

    // 2. Fetch authenticated profile
    if (session?.user) {
      if (session.user.name) setName(session.user.name);
      if (session.user.email) setEmail(session.user.email);

      fetch("/api/user/profile")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.user) {
            if (data.user.name) setName(data.user.name);
            if (data.user.email) setEmail(data.user.email);
            if (data.user.motto !== null && data.user.motto !== undefined) {
              setMotto(data.user.motto);
            }
            if (data.user.dailyReminderHours) {
              setDailyReminderHours(data.user.dailyReminderHours);
            }
            if (data.user.monthlyIntervalDays) {
              setMonthlyIntervalDays(data.user.monthlyIntervalDays);
            }
            if (data.user.yearlyIntervalMonths) {
              setYearlyIntervalMonths(data.user.yearlyIntervalMonths);
            }
          }
        })
        .catch((err) => {
          console.error("Failed to load user profile:", err);
        });
    }
  }, [session]);

  // Compute statistics for streak badge (filtered from registration date onwards)
  const stats: DashboardStats = useMemo(() => {
    return calculateConsistencyStats(dayLogs, userRegisteredAt);
  }, [dayLogs, userRegisteredAt]);

  // Handle Save Profile Information
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, motto }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update profile");
      }

      setProfileSuccessMsg("Profile information saved.");
      setTimeout(() => setProfileSuccessMsg(null), 4000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setErrorMsg(message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Update Password
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPassword(false);
    setPasswordSuccessMsg(null);
    setErrorMsg(null);

    if (newPassword !== confirmPassword) {
      setErrorMsg("New password and confirmation password do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg("New password must be at least 6 characters.");
      return;
    }

    setIsSavingPassword(true);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update password");
      }

      setPasswordSuccessMsg("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccessMsg(null), 4000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setErrorMsg(message);
    } finally {
      setIsSavingPassword(false);
    }
  };

  // Handle Save Timing & Cadence Settings
  const handleSaveCadence = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCadence(true);
    setCadenceSuccessMsg(null);
    setErrorMsg(null);

    try {
      const currentSchedule = Storage.getScheduleSettings();
      Storage.saveScheduleSettings({
        ...currentSchedule,
        dailyIntervalHours: dailyReminderHours,
        monthlyIntervalDays,
        yearlyIntervalMonths,
      });

      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dailyReminderHours,
          monthlyIntervalDays,
          yearlyIntervalMonths,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update cadence settings");
      }

      setCadenceSuccessMsg("Cadence rules updated.");
      setTimeout(() => setCadenceSuccessMsg(null), 4000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setErrorMsg(message);
    } finally {
      setIsSavingCadence(false);
    }
  };

  // Handle Save Notifications Preferences
  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingNotifs(true);
    setNotifSuccessMsg(null);
    setErrorMsg(null);

    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("consistency_urgent_alerts", String(urgentAlertsEnabled));
        localStorage.setItem("consistency_sound_alerts", String(soundAlertsEnabled));
      }

      setNotifSuccessMsg("Notification preferences saved.");
      setTimeout(() => setNotifSuccessMsg(null), 4000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setErrorMsg(message);
    } finally {
      setIsSavingNotifs(false);
    }
  };

  // Toggle browser push notification permission and backend subscription
  const handleToggleBrowserNotifications = async () => {
    if (!isNotificationSupported()) {
      alert("Browser notifications are not supported in your browser.");
      return;
    }

    if (browserPermission === "granted") {
      // User is already granted; unsubscribe from backend Web Push alerts
      await unsubscribeUserFromPush();
      alert("Browser push notifications have been unsubscribed from backend push alerts. To revoke browser system permissions completely, please update permissions in your browser address bar.");
      return;
    }

    if (browserPermission === "denied") {
      alert("Browser notifications are blocked in your browser settings. Please allow notifications for this site by clicking the lock/settings icon in your browser address bar.");
      return;
    }

    const permission = await requestNotificationPermission();
    setBrowserPermission(permission);

    if (permission === "granted") {
      // Register Web Push subscription on backend
      await subscribeUserToPush();
      await sendNativeNotification("🔔 Notifications Enabled", {
        body: `Consistency Dashboard will alert you every ${dailyReminderHours} hours if daily tasks remain pending.`,
      });
    } else {
      alert("Browser notifications were not allowed. You can enable them anytime from your browser address bar.");
    }
  };

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-[#dedede] flex items-center justify-center font-sans">
        <div className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-white border border-[#c8c8c8] shadow-sm">
          <Activity className="w-5 h-5 text-neutral-950 animate-pulse" />
          <span className="text-xs font-bold text-neutral-900 tracking-wider uppercase">Loading Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#dedede] text-neutral-950 flex flex-col lg:flex-row font-sans">

      {/* ======================================================== */}
      {/* 1. LEFT FULL-HEIGHT SIDE PANEL (Minimal & Premium)       */}
      {/* ======================================================== */}
      <aside className="w-full lg:w-64 bg-[#e6e6e6] border-r border-[#c8c8c8] flex flex-col justify-between shrink-0 select-none">
        <div>
          {/* Brand Logo Header */}
          <Link
            href="/"
            className="flex items-center gap-2.5 px-6 py-5 border-b border-[#c8c8c8] hover:opacity-85 transition-opacity"
          >
            <div className="w-8 h-8 rounded-xl bg-neutral-950 text-white flex items-center justify-center font-bold shadow-sm">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-extrabold tracking-wider text-neutral-950 uppercase">
              CONSISTENCY
            </span>
          </Link>

          {/* Navigation Sections */}
          <div className="p-4 space-y-6">

            {/* Section: Overview */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider px-3 block mb-1.5">
                Overview
              </span>

              <Link
                href="/"
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-neutral-700 hover:text-neutral-950 hover:bg-[#d8d8d8] transition-all flex items-center gap-2.5"
              >
                <Compass className="w-4 h-4 text-neutral-600" />
                <span>Tracker</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setActiveSection("profile");
                  setErrorMsg(null);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                  activeSection === "profile"
                    ? "bg-white text-neutral-950 shadow-xs border border-[#b8b8b8]"
                    : "text-neutral-700 hover:text-neutral-950 hover:bg-[#d8d8d8]"
                }`}
              >
                <User className="w-4 h-4 text-neutral-900" />
                <span>Profile</span>
              </button>
            </div>

            {/* Section: Preferences */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider px-3 block mb-1.5">
                Preferences
              </span>

              <button
                type="button"
                onClick={() => {
                  setActiveSection("cadence");
                  setErrorMsg(null);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center gap-2.5 ${
                  activeSection === "cadence"
                    ? "bg-white text-neutral-950 font-bold shadow-xs border border-[#b8b8b8]"
                    : "text-neutral-700 hover:text-neutral-950 hover:bg-[#d8d8d8] font-semibold"
                }`}
              >
                <Clock className="w-4 h-4 text-neutral-600" />
                <span>Timing & Cadence</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveSection("notifications");
                  setErrorMsg(null);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center gap-2.5 ${
                  activeSection === "notifications"
                    ? "bg-white text-neutral-950 font-bold shadow-xs border border-[#b8b8b8]"
                    : "text-neutral-700 hover:text-neutral-950 hover:bg-[#d8d8d8] font-semibold"
                }`}
              >
                <Bell className="w-4 h-4 text-neutral-600" />
                <span>Notifications</span>
              </button>
            </div>

            {/* Section: Security */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider px-3 block mb-1.5">
                Security
              </span>

              <button
                type="button"
                onClick={() => {
                  setActiveSection("security");
                  setErrorMsg(null);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center gap-2.5 ${
                  activeSection === "security"
                    ? "bg-white text-neutral-950 font-bold shadow-xs border border-[#b8b8b8]"
                    : "text-neutral-700 hover:text-neutral-950 hover:bg-[#d8d8d8] font-semibold"
                }`}
              >
                <Shield className="w-4 h-4 text-neutral-600" />
                <span>Password & Safety</span>
              </button>
            </div>

          </div>
        </div>

        {/* Sidebar Footer Widget */}
        <div className="p-4 border-t border-[#c8c8c8] space-y-2">
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-neutral-700 hover:text-red-700 hover:bg-[#d8d8d8] transition-colors flex items-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* 2. MAIN CONTENT AREA                                     */}
      {/* ======================================================== */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* Top Header Bar */}
        <header className="h-16 px-6 sm:px-10 border-b border-[#c8c8c8] bg-[#dedede]/80 backdrop-blur-md flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-neutral-700 hover:text-neutral-950 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to Tracker</span>
          </Link>

          {/* Right Header Status Chip */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#d2d2d2] border border-[#bcbcbc] text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-neutral-900" />
              <span>{stats.currentStreak} Days Streak</span>
            </div>

            {/* User Profile Chip */}
            <div className="flex items-center gap-2 pl-2 border-l border-[#c8c8c8]">
              <div className="w-7 h-7 rounded-full bg-neutral-950 text-white flex items-center justify-center text-xs font-extrabold shadow-sm">
                {name ? name[0].toUpperCase() : session?.user?.name ? session.user.name[0].toUpperCase() : "U"}
              </div>
              <span className="text-xs font-bold hidden md:inline text-neutral-950">
                {name || session?.user?.name || "Member"}
              </span>
            </div>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="p-6 sm:p-10 max-w-6xl w-full mx-auto space-y-6">

          {/* Page Heading - dynamically updates with active section */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 tracking-tight">
              {activeSection === "profile" && "Profile"}
              {activeSection === "cadence" && "Timing & Cadence"}
              {activeSection === "notifications" && "Notifications"}
              {activeSection === "security" && "Password & Security"}
            </h1>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-red-100 border border-red-200 text-red-900 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* 3. TWO-COLUMN CARD LAYOUT                                */}
          {/* ======================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

            {/* ---------------------------------------------------- */}
            {/* LEFT CARD: User Avatar, Identity, Rating & Action    */}
            {/* ---------------------------------------------------- */}
            <div className="lg:col-span-4 bg-white border border-[#c8c8c8] rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col items-center text-center">

              {/* User Avatar with Edit Badge Icon */}
              <div className="relative">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-gradient-to-br from-neutral-950 to-neutral-700 text-white flex items-center justify-center font-extrabold text-4xl sm:text-5xl shadow-md border-4 border-white">
                  {name ? name[0].toUpperCase() : session?.user?.name ? session.user.name[0].toUpperCase() : "U"}
                </div>

                {/* Edit Pencil Icon Badge */}
                <div
                  onClick={() => setActiveSection("profile")}
                  className="absolute -bottom-2 -right-2 p-2 rounded-full bg-neutral-900 text-white shadow-md border-2 border-white hover:bg-neutral-800 transition-colors cursor-pointer"
                  title="Edit Profile"
                >
                  <Pencil className="w-3.5 h-3.5 text-white" />
                </div>
              </div>

              {/* User Name */}
              <h2 className="text-lg sm:text-xl font-bold text-neutral-950 mt-4 tracking-tight">
                {name || session?.user?.name || "Consistent Member"}
              </h2>

              {/* Subtitle / Email */}
              <p className="text-xs text-neutral-600 font-medium mt-1 break-all">
                {email || session?.user?.email || "Account Active"}
              </p>

              {/* Streak Badge & Status Chip */}
              <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f2f2f2] border border-[#dedede] text-xs font-bold text-neutral-900 shadow-2xs">
                  <Star className="w-3.5 h-3.5 text-neutral-950 fill-neutral-950" />
                  <span>{stats.currentStreak > 0 ? `${stats.currentStreak} Days Streak` : "Active Streak"}</span>
                </span>

                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-neutral-100 text-neutral-700 border border-[#e2e2e2]">
                  Active Member
                </span>
              </div>

              {/* Join Date Badge */}
              <div className="mt-3 flex items-center gap-1.5 text-[11px] font-mono text-neutral-500">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                <span>Joined: {userRegisteredAt}</span>
              </div>

              {/* Motto / North Star Highlight */}
              {motto && (
                <div className="mt-4 p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs italic text-neutral-700 font-serif leading-relaxed text-center w-full">
                  &ldquo;{motto}&rdquo;
                </div>
              )}

              {/* Bottom Action Link */}
              <div className="border-t border-[#f0f0f0] w-full pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="text-xs font-semibold text-neutral-500 hover:text-red-700 transition-colors"
                >
                  Sign Out of Session
                </button>
              </div>
            </div>

            {/* ---------------------------------------------------- */}
            {/* RIGHT CARD: Dedicated Active Section Fields Only     */}
            {/* ---------------------------------------------------- */}
            <div className="lg:col-span-8 bg-white border border-[#c8c8c8] rounded-2xl p-6 sm:p-8 shadow-xs">

              {/* ================================================== */}
              {/* SECTION 1: PROFILE & USER INFORMATION              */}
              {/* ================================================== */}
              {activeSection === "profile" && (
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-950">Profile</h3>
                    <span className="text-xs text-neutral-500 font-medium block mt-0.5">User Information</span>
                  </div>

                  {/* Name Field */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                      Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#c8c8c8] text-xs text-neutral-950 font-medium focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all placeholder:text-neutral-400 bg-white shadow-2xs"
                    />
                  </div>

                  {/* Email Field */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      disabled
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#c8c8c8] text-xs text-neutral-950 font-medium opacity-75 cursor-not-allowed bg-neutral-100 shadow-2xs"
                    />
                  </div>

                  {/* Motto / North Star Field */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                      Consistency Motto / Personal North Star
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your personal north star or consistency motto..."
                      value={motto}
                      onChange={(e) => setMotto(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#c8c8c8] text-xs text-neutral-950 font-medium focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all placeholder:text-neutral-400 bg-white shadow-2xs"
                    />
                  </div>

                  {/* Save Now Button */}
                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="px-6 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50"
                    >
                      {isSavingProfile ? "Saving..." : "Save Now"}
                    </button>

                    {profileSuccessMsg && (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                        ✓ {profileSuccessMsg}
                      </span>
                    )}
                  </div>
                </form>
              )}

              {/* ================================================== */}
              {/* SECTION 2: TIMING & CADENCE RULES                  */}
              {/* ================================================== */}
              {activeSection === "cadence" && (
                <form onSubmit={handleSaveCadence} className="space-y-5">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-950">Timing & Cadence</h3>
                    <span className="text-xs text-neutral-500 font-medium block mt-0.5">Automated reminder check-in intervals</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Daily Check-in */}
                    <div>
                      <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                        Daily Reminder Cycle
                      </label>
                      <select
                        value={dailyReminderHours}
                        onChange={(e) => setDailyReminderHours(Number(e.target.value))}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#c8c8c8] text-xs text-neutral-950 font-bold focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all bg-white shadow-2xs"
                      >
                        <option value={3}>Every 3 Hours</option>
                        <option value={5}>Every 5 Hours (Recommended)</option>
                        <option value={8}>Every 8 Hours</option>
                      </select>
                      <span className="text-[11px] text-neutral-500 mt-1 block">Frequency for urgent daily task alerts</span>
                    </div>

                    {/* Monthly Review Cadence */}
                    <div>
                      <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                        Monthly Review Cadence
                      </label>
                      <div className="px-4 py-2.5 rounded-xl border border-[#d5d5d5] bg-neutral-50 text-xs font-mono font-bold text-neutral-700 shadow-2xs">
                        Every 10 Days
                      </div>
                      <span className="text-[11px] text-neutral-500 mt-1 block">Standard interval for monthly milestone reviews</span>
                    </div>
                  </div>

                  {/* Yearly Review Cadence */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                      Yearly Target Review Cadence
                    </label>
                    <select
                      value={yearlyIntervalMonths}
                      onChange={(e) => setYearlyIntervalMonths(Number(e.target.value))}
                      className="w-full sm:w-1/2 px-4 py-2.5 rounded-xl border border-[#c8c8c8] text-xs text-neutral-950 font-bold focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all bg-white shadow-2xs"
                    >
                      <option value={3}>Every 3 Months (Quarterly Review)</option>
                      <option value={6}>Every 6 Months (Biannual Review)</option>
                    </select>
                  </div>

                  {/* Save Cadence Button */}
                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="submit"
                      disabled={isSavingCadence}
                      className="px-6 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50"
                    >
                      {isSavingCadence ? "Saving..." : "Save Cadence"}
                    </button>

                    {cadenceSuccessMsg && (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                        ✓ {cadenceSuccessMsg}
                      </span>
                    )}
                  </div>
                </form>
              )}

              {/* ================================================== */}
              {/* SECTION 3: NOTIFICATIONS PREFERENCES               */}
              {/* ================================================== */}
              {activeSection === "notifications" && (
                <form onSubmit={handleSaveNotifications} className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-950">Notifications</h3>
                    <span className="text-xs text-neutral-500 font-medium block mt-0.5">Alert delivery & notification settings</span>
                  </div>

                  {/* Desktop Push Notifications */}
                  {/* Desktop Push Notifications */}
                  <div className="p-4 rounded-xl border border-[#c8c8c8] bg-[#fafafa] space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-neutral-200 flex items-center justify-center shrink-0">
                          <Laptop className="w-4 h-4 text-neutral-900" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-neutral-950 block">Browser Push Notifications</span>
                            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                              browserPermission === "granted"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : browserPermission === "denied"
                                ? "bg-red-100 text-red-800 border border-red-200"
                                : "bg-[#e8e8e8] text-neutral-700"
                            }`}>
                              {browserPermission === "granted" ? "Allowed" : browserPermission === "denied" ? "Blocked" : "Default"}
                            </span>
                          </div>
                          <span className="text-[11px] text-neutral-600 block">Delivered by the backend even if browser is closed or you are not logged in</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleToggleBrowserNotifications}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all shrink-0 ${
                          browserPermission === "granted"
                            ? "bg-neutral-950 text-white border-neutral-950 shadow-sm"
                            : browserPermission === "denied"
                            ? "bg-red-100 text-red-800 border-red-300"
                            : "bg-white hover:bg-neutral-100 text-neutral-800 border-[#c0c0c0]"
                        }`}
                      >
                        {browserPermission === "granted" ? "Enabled" : browserPermission === "denied" ? "Blocked" : "Enable"}
                      </button>
                    </div>

                    {browserPermission === "denied" && (
                      <p className="text-[10px] text-red-600 font-medium pt-1">
                        Browser notifications are blocked. Please click the site settings icon in your browser address bar to allow notifications.
                      </p>
                    )}
                  </div>

                  {/* Urgent Pop-up Alert Toasts */}
                  <div className="p-4 rounded-xl border border-[#c8c8c8] bg-[#fafafa] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-neutral-200 flex items-center justify-center shrink-0">
                        <Bell className="w-4 h-4 text-neutral-900" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-neutral-950 block">Urgent On-Screen Alert Toasts</span>
                        <span className="text-[11px] text-neutral-600 block">Pop up high-priority red alert cards when daily tasks are pending</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setUrgentAlertsEnabled((prev) => !prev)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        urgentAlertsEnabled
                          ? "bg-neutral-950 text-white border-neutral-950 shadow-sm"
                          : "bg-white hover:bg-neutral-100 text-neutral-800 border-[#c0c0c0]"
                      }`}
                    >
                      {urgentAlertsEnabled ? "Enabled" : "Disabled"}
                    </button>
                  </div>

                  {/* Sound Effects & Audio Cues */}
                  <div className="p-4 rounded-xl border border-[#c8c8c8] bg-[#fafafa] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-neutral-200 flex items-center justify-center shrink-0">
                        <Volume2 className="w-4 h-4 text-neutral-900" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-neutral-950 block">Audio Feedback</span>
                        <span className="text-[11px] text-neutral-600 block">Play sound cues when completing consistency milestones</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSoundAlertsEnabled((prev) => !prev)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        soundAlertsEnabled
                          ? "bg-neutral-950 text-white border-neutral-950 shadow-sm"
                          : "bg-white hover:bg-neutral-100 text-neutral-800 border-[#c0c0c0]"
                      }`}
                    >
                      {soundAlertsEnabled ? "Enabled" : "Disabled"}
                    </button>
                  </div>

                  {/* Save Notifications Button */}
                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="submit"
                      disabled={isSavingNotifs}
                      className="px-6 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50"
                    >
                      {isSavingNotifs ? "Saving..." : "Save Preferences"}
                    </button>

                    {notifSuccessMsg && (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                        ✓ {notifSuccessMsg}
                      </span>
                    )}
                  </div>
                </form>
              )}

              {/* ================================================== */}
              {/* SECTION 4: PASSWORD & SECURITY                     */}
              {/* ================================================== */}
              {activeSection === "security" && (
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-950">Password</h3>
                    <span className="text-xs text-neutral-500 font-medium block mt-0.5">Update credentials security</span>
                  </div>

                  {/* Current Password */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        placeholder="••••••••••••••••"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-[#c8c8c8] text-xs text-neutral-950 font-medium focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all placeholder:text-neutral-400 bg-white shadow-2xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-700 transition-colors"
                        title={showCurrentPassword ? "Hide password" : "Show password"}
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-[#c8c8c8] text-xs text-neutral-950 font-medium focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all placeholder:text-neutral-400 bg-white shadow-2xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-700 transition-colors"
                        title={showNewPassword ? "Hide password" : "Show password"}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-[#c8c8c8] text-xs text-neutral-950 font-medium focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all placeholder:text-neutral-400 bg-white shadow-2xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-700 transition-colors"
                        title={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Update Password Button */}
                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="submit"
                      disabled={isSavingPassword || !newPassword}
                      className="px-6 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50"
                    >
                      {isSavingPassword ? "Updating..." : "Update Password"}
                    </button>

                    {passwordSuccessMsg && (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                        ✓ {passwordSuccessMsg}
                      </span>
                    )}
                  </div>
                </form>
              )}

            </div>

          </div>

        </main>

      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

    </div>
  );
}

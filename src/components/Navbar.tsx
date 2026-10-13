"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Flame, CheckCircle2, Activity, Bell, LogIn } from "lucide-react";
import { DashboardStats } from "@/types";
import { useSession } from "next-auth/react";

interface NavbarProps {
  stats?: DashboardStats;
  unreadCount?: number;
  onOpenNotifications?: () => void;
  onOpenAddTask?: () => void;
  onOpenAuth?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  stats,
  unreadCount = 0,
  onOpenNotifications,
  onOpenAddTask,
  onOpenAuth,
}) => {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#b8b8b8] bg-[#dedede]/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Logo & Main Title */}
        <Link href="/" className="flex items-center space-x-2.5 hover:opacity-85 transition-opacity">
          <div className="w-8 h-8 rounded-xl bg-[#cecece] border border-[#b5b5b5] flex items-center justify-center text-neutral-900 shadow-sm">
            <Activity className="w-4 h-4 text-neutral-900" />
          </div>
          <span className="text-sm font-extrabold tracking-wider text-neutral-950 uppercase">
            CONSISTENCY
          </span>
        </Link>

        {/* Center Pill Badges (if stats provided) */}
        {stats && (
          <div className="hidden lg:flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 bg-[#c5c5c5] border border-[#b0b0b0] px-3.5 py-1 rounded-full text-xs font-medium text-neutral-900 shadow-sm">
              <Flame className="w-3.5 h-3.5 text-neutral-800 fill-neutral-800" />
              <span className="text-neutral-700">Streak:</span>
              <span className="font-bold font-mono text-neutral-950">{stats.currentStreak} Days</span>
            </div>

            <div className="flex items-center space-x-1.5 bg-[#c5c5c5] border border-[#b0b0b0] px-3.5 py-1 rounded-full text-xs font-medium text-neutral-900 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-neutral-800" />
              <span className="text-neutral-700">Consistency:</span>
              <span className="font-bold font-mono text-neutral-950">{stats.consistencyRate}%</span>
            </div>
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center space-x-2.5 sm:space-x-3">

          {/* Notification Bell Button */}
          {onOpenNotifications && (
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-xl bg-[#c5c5c5] hover:bg-white text-neutral-900 border border-[#b0b0b0] transition-all shadow-sm"
              title="Notifications"
            >
              <Bell className="w-4 h-4 text-neutral-900" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white font-mono font-bold text-[9px] flex items-center justify-center shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>
          )}

          {/* Add Task Button */}
          {onOpenAddTask && (
            <button
              onClick={onOpenAddTask}
              className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-4 py-1.5 rounded-full bg-white text-neutral-950 hover:bg-neutral-100 font-bold text-xs tracking-tight shadow-md transition-all active:scale-95 border border-[#a8a8a8]"
            >
              <Plus className="w-4 h-4 text-neutral-950" />
              <span className="hidden xs:inline sm:inline">Add Task</span>
              <span className="inline xs:hidden sm:hidden">Add</span>
            </button>
          )}

          {/* Dedicated User Dashboard Page Link */}
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all shadow-sm active:scale-95 ${
                pathname === "/dashboard"
                  ? "bg-neutral-950 text-white border-neutral-950"
                  : "bg-white hover:bg-neutral-100 text-neutral-950 border-[#b0b0b0]"
              }`}
              title="Dedicated User Dashboard"
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                pathname === "/dashboard" ? "bg-white text-neutral-950" : "bg-neutral-900 text-white"
              }`}>
                {session?.user?.name ? session.user.name[0].toUpperCase() : "U"}
              </div>
              <span className="text-xs font-bold hidden md:inline max-w-[100px] truncate">
                {session?.user?.name?.split(" ")[0] || "Dashboard"}
              </span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
              title="Sign In or Register"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>
          )}

        </div>

      </div>
    </header>
  );
};

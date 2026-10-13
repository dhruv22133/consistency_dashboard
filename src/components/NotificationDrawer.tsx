"use client";

import React, { useState, useEffect } from "react";
import { X, Bell, Clock, Calendar, Target, Check, Settings, AlertTriangle, CheckCircle2 } from "lucide-react";
import { SystemNotification, NotificationSchedule } from "@/types";
import { motion } from "framer-motion";

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: SystemNotification[];
  schedule: NotificationSchedule;
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  onToggleBrowserNotifications: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onClearAll,
  onToggleBrowserNotifications,
}) => {
  const [activeTab, setActiveTab] = useState<"inbox" | "schedule">("inbox");
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | "unsupported">("default");

  // Always check real browser permission directly whenever opened or focused
  useEffect(() => {
    const updatePermission = () => {
      if (typeof window !== "undefined" && "Notification" in window) {
        setPermissionStatus(Notification.permission);
      } else {
        setPermissionStatus("unsupported");
      }
    };

    updatePermission();
    window.addEventListener("focus", updatePermission);
    return () => window.removeEventListener("focus", updatePermission);
  }, [isOpen]);

  if (!isOpen) return null;

  // Helper to determine badge styling based on notification topic
  const getNotificationCategoryBadge = (n: SystemNotification) => {
    const titleLower = n.title.toLowerCase();
    const msgLower = n.message.toLowerCase();

    if (n.category === "no_tasks_today" || titleLower.includes("no tasks") || msgLower.includes("haven't created")) {
      return {
        label: "⚠️ No Tasks Created Today",
        className: "bg-amber-100 text-amber-900 border border-amber-300 font-bold",
        icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />,
      };
    }

    if (n.category === "remaining_tasks" || titleLower.includes("remaining") || msgLower.includes("pending")) {
      return {
        label: `⚡ Remaining Tasks Pending (${n.remainingCount || "Action Needed"})`,
        className: "bg-red-100 text-red-900 border border-red-300 font-bold",
        icon: <Clock className="w-3.5 h-3.5 text-red-700" />,
      };
    }

    if (n.category === "all_completed" || titleLower.includes("completed") || msgLower.includes("100%")) {
      return {
        label: "🎯 All Tasks Completed",
        className: "bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold",
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />,
      };
    }

    if (n.timeframe === "monthly") {
      return {
        label: "📅 Monthly Goals Check-in",
        className: "bg-blue-100 text-blue-900 border border-blue-200 font-bold",
        icon: <Calendar className="w-3.5 h-3.5 text-blue-700" />,
      };
    }

    if (n.timeframe === "yearly") {
      return {
        label: "🎯 Yearly Review",
        className: "bg-purple-100 text-purple-900 border border-purple-200 font-bold",
        icon: <Target className="w-3.5 h-3.5 text-purple-700" />,
      };
    }

    return {
      label: "System Alert",
      className: "bg-[#e5e5e5] text-neutral-800 border border-[#d0d0d0] font-semibold",
      icon: <Bell className="w-3.5 h-3.5 text-neutral-700" />,
    };
  };

  const isAllowed = permissionStatus === "granted";
  const isBlocked = permissionStatus === "denied";

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
      />

      {/* Drawer Panel */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative w-full max-w-md bg-[#dedede] border-l border-[#c8c8c8] text-neutral-900 h-full shadow-2xl flex flex-col z-10"
      >
        
        {/* Header */}
        <div className="p-5 border-b border-[#c8c8c8] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-white border border-[#c8c8c8] text-neutral-900 shadow-sm">
              <Bell className="w-4 h-4 text-neutral-900" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 tracking-wide">Notification Center</h2>
              <p className="text-xs text-neutral-600">Task status notifications & scheduled alerts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#d4d4d4] hover:bg-white text-neutral-700 hover:text-neutral-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex border-b border-[#c8c8c8] bg-[#d5d5d5] p-1">
          <button
            onClick={() => setActiveTab("inbox")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "inbox"
                ? "bg-white text-neutral-900 shadow-sm font-bold"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Alert Log ({notifications.filter((n) => !n.read).length})</span>
          </button>

          <button
            onClick={() => setActiveTab("schedule")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "schedule"
                ? "bg-white text-neutral-900 shadow-sm font-bold"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Schedule Rules</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {activeTab === "inbox" ? (
            <>
              {/* Notification Item List */}
              {notifications.length === 0 ? (
                <div className="text-center py-12 text-neutral-500 text-xs">
                  No notifications recorded yet.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-neutral-600 pb-1 font-medium">
                    <span>Recent Notifications</span>
                    <button
                      onClick={onClearAll}
                      className="text-neutral-500 hover:text-neutral-900 transition-colors text-[11px]"
                    >
                      Clear Log
                    </button>
                  </div>
                  {notifications.map((n) => {
                    const categoryInfo = getNotificationCategoryBadge(n);
                    return (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-3.5 rounded-xl border transition-all ${
                          n.read
                            ? "bg-[#d8d8d8]/60 border-[#c8c8c8] opacity-70"
                            : "bg-white border-[#c8c8c8] shadow-sm"
                        }`}
                      >
                        {/* Topic Category Tag Banner */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] uppercase font-mono ${categoryInfo.className}`}>
                            {categoryInfo.icon}
                            <span>{categoryInfo.label}</span>
                          </span>

                          {!n.read && (
                            <button
                              onClick={() => onMarkAsRead(n.id)}
                              className="p-1 text-neutral-400 hover:text-neutral-800 transition-colors"
                              title="Mark as Read"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="font-bold text-xs text-neutral-950">
                          {n.title}
                        </div>
                        <p className="text-xs text-neutral-700 mt-1 leading-relaxed">
                          {n.message}
                        </p>
                        <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono text-neutral-500">
                          <span>{new Date(n.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                          <span className="uppercase px-1.5 py-0.5 rounded bg-[#e8e8e8] border border-[#d0d0d0] text-neutral-800 font-semibold">
                            {n.timeframe} Cycle
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            /* Schedule Rules & Settings Tab */
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-white border border-[#c8c8c8] space-y-3 shadow-sm">
                <h3 className="font-bold text-neutral-950 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-neutral-800" /> Automated Schedule Cadence
                </h3>

                <div className="space-y-2.5 pt-1">
                  <div className="p-2.5 rounded-lg bg-[#dedede] border border-[#d0d0d0]">
                    <div className="font-semibold text-neutral-900 flex justify-between">
                      <span>Daily Tasks Reminder</span>
                      <span className="font-mono text-neutral-700 font-bold">Every 5 Hours</span>
                    </div>
                    <p className="text-[11px] text-neutral-600 mt-0.5">
                      Server checks remaining daily tasks or reminds you if zero tasks were created today.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#dedede] border border-[#d0d0d0]">
                    <div className="font-semibold text-neutral-900 flex justify-between">
                      <span>Monthly Goals Digest</span>
                      <span className="font-mono text-neutral-700 font-bold">Every 10 Days</span>
                    </div>
                    <p className="text-[11px] text-neutral-600 mt-0.5">
                      Fires every 10 days to check your progress towards monthly milestones.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#dedede] border border-[#d0d0d0]">
                    <div className="font-semibold text-neutral-900 flex justify-between">
                      <span>Yearly Milestone Review</span>
                      <span className="font-mono text-neutral-700 font-bold">Every 3 Months</span>
                    </div>
                    <p className="text-[11px] text-neutral-600 mt-0.5">
                      Quarterly evaluation triggered every 3 months for long-term yearly objectives.
                    </p>
                  </div>
                </div>
              </div>

              {/* Browser Push Notifications Card — State derived directly from browser permission */}
              <div className="p-4 rounded-xl bg-white border border-[#c8c8c8] space-y-2 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-neutral-950">Browser Push Notifications</span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                        isAllowed
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : isBlocked
                          ? "bg-red-100 text-red-800 border border-red-200"
                          : "bg-[#e8e8e8] text-neutral-700 border border-[#d0d0d0]"
                      }`}>
                        {isAllowed ? "Allowed" : isBlocked ? "Blocked" : "Not Allowed"}
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-600 mt-0.5 leading-relaxed">
                      Delivered by the backend even if browser is closed or you are not logged in.
                    </div>
                  </div>

                  <button
                    onClick={onToggleBrowserNotifications}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                      isAllowed
                        ? "bg-neutral-950 text-white shadow-sm"
                        : isBlocked
                        ? "bg-red-100 text-red-800 border border-red-300"
                        : "bg-[#dedede] hover:bg-neutral-950 hover:text-white text-neutral-800 border border-[#c8c8c8]"
                    }`}
                  >
                    {isAllowed ? "Enabled" : isBlocked ? "Blocked" : "Enable"}
                  </button>
                </div>

                {isBlocked && (
                  <p className="text-[10px] text-red-600 pt-1 font-medium">
                    Notifications are blocked in your browser. Click the lock/settings icon in your address bar to allow them.
                  </p>
                )}
              </div>
            </div>
          )}

        </div>

      </motion.div>
    </div>
  );
};

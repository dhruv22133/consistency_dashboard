"use client";

import React from "react";
import { AlertTriangle, X, ArrowRight, ShieldAlert, CheckCircle2 } from "lucide-react";
import { SystemNotification } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

interface NotificationToastProps {
  activeToast: SystemNotification | null;
  onClose: () => void;
  onOpenDrawer: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  activeToast,
  onClose,
  onOpenDrawer,
}) => {
  // Removed auto-dismiss timer. The popup ONLY disappears when the user clicks close (X).
  if (!activeToast) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-6">
        
        {/* Darkened Screen Overlay Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
        />

        {/* Centered Large Urgent Danger Pop-Up Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 20 }}
          transition={{ type: "spring", damping: 22, stiffness: 280 }}
          className="relative w-full max-w-xl bg-gradient-to-b from-[#450a0a] via-[#360707] to-[#1f0303] border-4 border-red-600 rounded-2xl sm:rounded-3xl p-4 sm:p-8 text-white shadow-[0_0_60px_rgba(220,38,38,0.7)] z-10 overflow-hidden max-h-[92vh] overflow-y-auto"
        >
          {/* Subtle Glowing Pulse Background Accent */}
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-red-600/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
          <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-red-600/20 rounded-full blur-3xl pointer-events-none animate-pulse" />

          {/* Top Bar with Urgent Warning Badge and Close Cross Button */}
          <div className="flex items-start justify-between gap-3 sm:gap-4 border-b border-red-800/80 pb-3 sm:pb-5">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-red-600 border-2 border-red-400 flex items-center justify-center text-white shadow-[0_0_20px_rgba(255,255,255,0.6)] animate-bounce shrink-0">
                <AlertTriangle className="w-5 h-5 sm:w-7 sm:h-7" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <span className="text-[10px] sm:text-xs font-black font-mono uppercase tracking-widest px-2 sm:px-2.5 py-0.5 rounded-full bg-red-600 text-white shadow-md">
                    {activeToast.category === "no_tasks_today" || activeToast.title.toLowerCase().includes("no tasks")
                      ? "⚠️ NO TASKS CREATED TODAY"
                      : activeToast.category === "all_completed"
                      ? "🎯 ALL TASKS FINISHED"
                      : "🚨 REMAINING TASKS ALERT"}
                  </span>
                  <span className="text-[10px] sm:text-xs font-mono text-red-200 font-bold uppercase">
                    {activeToast.timeframe} CYCLE
                  </span>
                </div>
                <h3 className="text-lg sm:text-2xl font-black text-white tracking-tight mt-1">
                  {activeToast.title}
                </h3>
              </div>
            </div>

            {/* Close Cross Button — ONLY way for user to close popup */}
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl bg-red-950/90 hover:bg-red-700 text-red-200 hover:text-white border-2 border-red-700/80 transition-all shadow-md active:scale-95 shrink-0"
              title="Close & Dismiss Notification"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Large Message Body */}
          <div className="my-4 sm:my-6 space-y-3 sm:space-y-4">
            <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-black/40 border border-red-800/90 text-xs sm:text-base text-red-100 font-semibold leading-relaxed shadow-inner">
              {activeToast.message}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 bg-red-950/70 p-3 sm:p-3.5 rounded-xl border border-red-800/80 text-[11px] sm:text-xs font-mono text-red-200">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                <span>
                  {activeToast.category === "no_tasks_today" || activeToast.title.toLowerCase().includes("no tasks")
                    ? "Add tasks for today to protect your streak"
                    : activeToast.category === "all_completed"
                    ? "Streak is safely preserved for today"
                    : "Complete remaining tasks before midnight"}
                </span>
              </div>
              <span className="font-bold text-white bg-red-800 px-2 sm:px-2.5 py-1 rounded-md shrink-0">
                {activeToast.category === "no_tasks_today"
                  ? "0 Tasks Defined"
                  : activeToast.category === "all_completed"
                  ? "All Done ✓"
                  : `${activeToast.remainingCount} Pending`}
              </span>
            </div>
          </div>

          {/* Action Footer Buttons */}
          <div className="pt-4 border-t border-red-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs font-mono text-red-300 font-medium">
              Click <strong className="text-white font-bold">X</strong> or button to dismiss
            </span>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={onClose}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-red-950 hover:bg-red-900 border border-red-700 text-red-200 text-xs font-bold transition-all"
              >
                Dismiss Alert
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenDrawer();
                }}
                className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-white hover:bg-red-50 text-red-950 font-black text-xs tracking-wide shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all flex items-center justify-center gap-2 active:scale-95 border-2 border-white"
              >
                <span>View Task Drawer</span>
                <ArrowRight className="w-4 h-4 text-red-950" />
              </button>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};

"use client";

import React from "react";
import { X, CheckCircle2, AlertTriangle, Sparkles, Plus, Circle, Calendar } from "lucide-react";
import { DayLog } from "@/types";
import { getDayDotClass } from "@/lib/utils";

interface DayDetailModalProps {
  log: DayLog | null;
  onClose: () => void;
  onOpenAddTask?: () => void;
}

export const DayDetailModal: React.FC<DayDetailModalProps> = ({
  log,
  onClose,
  onOpenAddTask,
}) => {
  if (!log) return null;

  const dateFormatted = new Date(log.date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const isMissed = log.totalDailyTasks === 0 || log.completedDailyTasks === 0;
  const dotClass = getDayDotClass(log.completedDailyTasks, log.totalDailyTasks);
  const isZeroTasks = log.totalDailyTasks === 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
      />

      {/* Dialog */}
      <div className="relative w-full max-w-lg bg-[#dedede] border border-[#c8c8c8] rounded-2xl p-4 sm:p-6 text-neutral-900 shadow-2xl z-10 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#c8c8c8] pb-3 sm:pb-4">
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full shrink-0 shadow-sm ${dotClass}`} />
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-800 shrink-0" />
                <h3 className="text-sm sm:text-base font-extrabold text-neutral-950 tracking-tight">{dateFormatted}</h3>
              </div>
              <p className="text-[11px] sm:text-xs text-neutral-600 font-mono mt-0.5 font-medium">Daily Task Breakdown & Consistency Log</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#d4d4d4] hover:bg-white text-neutral-700 hover:text-neutral-900 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Completion Statistics Summary Box */}
        <div className="my-3 sm:my-5 p-3 sm:p-4 rounded-xl bg-white border border-[#c8c8c8] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-neutral-500 block font-mono font-bold">STATUS</span>
              <span className="text-sm font-extrabold text-neutral-950 capitalize flex items-center gap-1.5 mt-0.5">
                {isMissed ? (
                  <span className="text-red-700 flex items-center gap-1 font-bold">
                    <AlertTriangle className="w-4 h-4 text-red-600" /> 0 Tasks Done (Marked Red)
                  </span>
                ) : log.completionRate === 100 ? (
                  <span className="text-neutral-950 flex items-center gap-1 font-bold">
                    <Sparkles className="w-4 h-4 text-neutral-950" /> 100% Complete
                  </span>
                ) : (
                  <span>{log.completionRate}% Done</span>
                )}
              </span>
            </div>

            <div className="text-right">
              <span className="text-2xl font-black font-mono text-neutral-950">{log.completedDailyTasks} / {log.totalDailyTasks}</span>
              <span className="text-xs text-neutral-600 block font-mono font-bold">
                {log.completionRate}% Tasks Done
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 w-full h-2 bg-[#e0e0e0] rounded-full overflow-hidden border border-[#d0d0d0]">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isMissed
                  ? "bg-red-600"
                  : log.completionRate === 100
                  ? "bg-neutral-950"
                  : "bg-neutral-700"
              }`}
              style={{ width: `${Math.max(log.completionRate, isZeroTasks ? 100 : 0)}%` }}
            />
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-4">
          {isZeroTasks ? (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-center">
              <AlertTriangle className="w-7 h-7 text-red-600 mx-auto mb-1.5" />
              <h4 className="text-xs font-bold text-red-950">No Tasks Added For This Day</h4>
              <p className="text-[11px] text-red-800 mt-0.5">
                Since no tasks were defined, this day is marked as <strong>Red</strong>.
              </p>
              {onOpenAddTask && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenAddTask();
                  }}
                  className="mt-3 px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Tasks Now
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Completed Tasks List */}
              <div>
                <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-neutral-950" /> Completed Tasks ({log.completedTaskTitles.length})
                </h4>
                {log.completedTaskTitles.length === 0 ? (
                  <p className="text-xs text-neutral-600 italic p-2.5 bg-[#d5d5d5] rounded-lg border border-[#c8c8c8]">
                    Zero tasks completed on this day.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {log.completedTaskTitles.map((title, idx) => (
                      <li
                        key={idx}
                        className="p-2.5 rounded-lg bg-white border border-[#c8c8c8] text-xs text-neutral-900 flex items-center justify-between gap-2 shadow-xs font-medium"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-neutral-950 shrink-0" />
                          <span className="line-through text-neutral-600 font-semibold">{title}</span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-100 text-neutral-800 font-bold">
                          Done
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Pending / Missed Tasks List */}
              {log.missedTaskTitles && log.missedTaskTitles.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Circle className="w-4 h-4 text-red-600" /> Pending / Missed Tasks ({log.missedTaskTitles.length})
                  </h4>
                  <ul className="space-y-1.5">
                    {log.missedTaskTitles.map((title, idx) => (
                      <li
                        key={idx}
                        className="p-2.5 rounded-lg bg-red-100 border border-red-200 text-xs text-red-950 flex items-center justify-between gap-2 font-medium"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
                          <span className="font-bold">{title}</span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-600 text-white font-bold">
                          Not Done
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {/* Close button */}
        <div className="mt-6 pt-4 border-t border-[#c8c8c8] text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-100 border border-[#c8c8c8] text-neutral-900 text-xs font-bold transition-colors shadow-sm"
          >
            Close Details
          </button>
        </div>

      </div>
    </div>
  );
};

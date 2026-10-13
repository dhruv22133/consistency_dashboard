"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info, CheckCircle2, Circle, AlertCircle, Plus, Sparkles } from "lucide-react";
import { DayLog, Task } from "@/types";
import { getDaysInMonth, getMonthName, formatDateISO, getDayDotClass } from "@/lib/utils";

interface CalendarViewProps {
  dayLogs: Record<string, DayLog>;
  tasks: Task[];
  userRegisteredAt?: string;
  onToggleTask?: (taskId: string) => void;
  onOpenAddTask?: () => void;
  onSelectDay: (log: DayLog) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  dayLogs,
  tasks,
  userRegisteredAt,
  onToggleTask,
  onOpenAddTask,
  onSelectDay,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const todayStr = formatDateISO(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateStr(formatDateISO(now));
  };

  const weekHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Helper to get day log or fallback
  const getDayLogForDate = (dateStr: string, isFuture: boolean): DayLog => {
    if (dayLogs[dateStr]) return dayLogs[dateStr];

    return {
      date: dateStr,
      totalDailyTasks: 0,
      completedDailyTasks: 0,
      completionRate: 0,
      completedTaskTitles: [],
      missedTaskTitles: [],
    };
  };

  // Selected date log for the integrated inspector panel
  const isSelectedBeforeRegistration = Boolean(userRegisteredAt && selectedDateStr < userRegisteredAt);
  const selectedLog = getDayLogForDate(selectedDateStr, selectedDateStr > todayStr);
  const isSelectedToday = selectedDateStr === todayStr;

  // Format date deterministically so Node server and browser client match 100%
  const selectedDateFormatted = (() => {
    const [yearStr, monthStr, dayStr] = selectedDateStr.split("-");
    const yearNum = parseInt(yearStr, 10);
    const monthNum = parseInt(monthStr, 10) - 1;
    const dayNum = parseInt(dayStr, 10);
    const d = new Date(yearNum, monthNum, dayNum);

    const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    const weekday = weekdays[d.getDay()] || "";
    const month = months[monthNum] || "";
    return `${weekday}, ${dayNum} ${month} ${yearNum}`;
  })();

  return (
    <div className="bg-[#cecece] border border-[#b2b2b2] rounded-xl sm:rounded-2xl p-3.5 sm:p-6 my-4 sm:my-6 shadow-sm">

      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-[#b5b5b5] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-neutral-950 shrink-0" />
            <h2 className="text-lg sm:text-xl font-bold text-neutral-950 tracking-tight">
              {getMonthName(month)} <span className="text-neutral-700 font-mono text-sm sm:text-base">{year}</span>
            </h2>
          </div>
          <p className="text-xs text-neutral-700 font-medium mt-0.5">
            Click any day to view its complete task list and breakdown. Dates prior to registration remain clean & empty.
          </p>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleToday}
            className="px-2.5 sm:px-3 py-1 rounded-lg bg-white border border-[#a5a5a5] text-neutral-950 hover:bg-neutral-100 text-xs font-mono font-bold transition-all shadow-sm"
          >
            Today
          </button>
          <div className="flex items-center bg-[#bebebe] rounded-lg border border-[#a8a8a8] p-0.5">
            <button
              onClick={handlePrevMonth}
              className="p-1 sm:p-1.5 rounded hover:bg-[#a8a8a8] text-neutral-900 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1 sm:p-1.5 rounded hover:bg-[#a8a8a8] text-neutral-900 transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 my-3 sm:my-4 text-center">
        {weekHeaders.map((header) => (
          <div key={header} className="text-[10px] sm:text-[11px] font-bold font-mono text-neutral-700 uppercase py-0.5 sm:py-1">
            {header}
          </div>
        ))}
      </div>

      {/* Calendar Grid with Visible Task Lists inside cells */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {/* Empty padding slots */}
        {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
          <div key={`empty-${idx}`} className="min-h-[58px] sm:min-h-[125px] p-1 sm:p-2 rounded-lg sm:rounded-xl bg-[#c0c0c0]/40 border border-[#b0b0b0]/40 opacity-30" />
        ))}

        {/* Month Days */}
        {daysInMonth.map((dateObj) => {
          const dateStr = formatDateISO(dateObj);
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDateStr;
          const isFuture = dateStr > todayStr;
          const isBeforeRegistration = Boolean(userRegisteredAt && dateStr < userRegisteredAt);

          const log = getDayLogForDate(dateStr, isFuture);
          const dotClass = getDayDotClass(log.completedDailyTasks, log.totalDailyTasks, isFuture, isBeforeRegistration);

          const allTasksForDay = [
            ...log.completedTaskTitles.map((title) => ({ title, completed: true })),
            ...(log.missedTaskTitles || []).map((title) => ({ title, completed: false })),
          ];

          return (
            <div
              key={dateStr}
              onClick={() => {
                setSelectedDateStr(dateStr);
                onSelectDay(log);
              }}
              className={`group relative min-h-[58px] sm:min-h-[125px] p-1 sm:p-2 rounded-lg sm:rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${isSelected
                ? "ring-2 ring-neutral-950 bg-white shadow-md border-neutral-950"
                : isToday
                  ? "bg-white/90 border-neutral-900 shadow-sm"
                  : isBeforeRegistration
                    ? "bg-[#c8c8c8]/50 border-[#b5b5b5] opacity-60 hover:bg-white"
                    : "bg-[#c4c4c4] border-[#b0b0b0] hover:border-neutral-700 hover:bg-white"
                }`}
            >
              {/* Day Header: Number + Dot + Now Badge */}
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <span
                    className={`text-[11px] sm:text-xs font-mono font-bold ${isToday ? "text-neutral-950 underline" : "text-neutral-800 group-hover:text-neutral-950"
                      }`}
                  >
                    {dateObj.getDate()}
                  </span>
                  {isToday && (
                    <span className="text-[7px] sm:text-[8px] uppercase font-mono px-0.5 sm:px-1 rounded bg-neutral-950 text-white font-bold">
                      Now
                    </span>
                  )}
                </div>

                {/* Dot Visualizer */}
                <div
                  className={`w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full shrink-0 transition-all ${dotClass}`}
                  title={isBeforeRegistration ? "Before registration" : `${log.completedDailyTasks}/${log.totalDailyTasks} completed (${log.completionRate}%)`}
                />
              </div>

              {/* Task List Inside Calendar Cell */}
              <div className="hidden sm:flex my-1.5 flex-1 flex-col justify-start space-y-1 overflow-hidden">
                {isBeforeRegistration ? (
                  <div className="text-[10px] text-neutral-500 font-mono font-medium leading-tight">
                    — Empty
                  </div>
                ) : allTasksForDay.length === 0 ? (
                  <div className="text-[10px] text-red-700 font-mono font-bold leading-tight">
                    {isFuture ? "No tasks" : "● 0 tasks (Red)"}
                  </div>
                ) : (
                  <>
                    {allTasksForDay.slice(0, 2).map((task, idx) => (
                      <div
                        key={idx}
                        className={`text-[10px] truncate flex items-center gap-1 font-medium ${task.completed
                          ? "text-neutral-500 line-through"
                          : "text-neutral-900 font-bold"
                          }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${task.completed ? "bg-neutral-800" : "bg-red-500"}`} />
                        <span className="truncate">{task.title}</span>
                      </div>
                    ))}
                    {allTasksForDay.length > 2 && (
                      <div className="text-[9px] font-mono text-neutral-600 font-bold">
                        +{allTasksForDay.length - 2} more
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Task Count Badge */}
              <div className="pt-0.5 sm:pt-1 border-t border-[#b8b8b8]/60 flex items-center justify-between text-[8px] sm:text-[10px] font-mono text-neutral-700 font-bold">
                {isBeforeRegistration ? (
                  <span>—</span>
                ) : (
                  <>
                    <span>{log.completedDailyTasks}/{log.totalDailyTasks}</span>
                    <span className="hidden sm:inline">{log.completionRate}%</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Integrated Calendar Task List Inspector Panel */}
      <div className="mt-4 sm:mt-6 pt-4 sm:pt-5 border-t border-[#b5b5b5]">
        <div className="bg-[#c2c2c2] border border-[#a8a8a8] rounded-xl p-3 sm:p-5 shadow-inner">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#a8a8a8] pb-3.5">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className={`w-3.5 h-3.5 rounded-full shrink-0 ${getDayDotClass(selectedLog.completedDailyTasks, selectedLog.totalDailyTasks, selectedDateStr > todayStr, isSelectedBeforeRegistration)}`} />
                <h3 suppressHydrationWarning className="text-sm sm:text-base font-extrabold text-neutral-950">
                  {selectedDateFormatted}
                </h3>
                {isSelectedToday && (
                  <span className="text-[9px] sm:text-[10px] font-mono px-1.5 sm:px-2 py-0.5 rounded bg-neutral-950 text-white font-bold">
                    TODAY
                  </span>
                )}
                {isSelectedBeforeRegistration && (
                  <span className="text-[9px] sm:text-[10px] font-mono px-1.5 sm:px-2 py-0.5 rounded bg-neutral-400 text-neutral-900 font-bold">
                    PRE-REGISTRATION
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-neutral-700 font-medium mt-0.5">
                {isSelectedBeforeRegistration
                  ? "Date precedes account registration. Kept clean and empty."
                  : "Task breakdown and completion status for this day"
                }
              </p>
            </div>

            {/* Task completion summary */}
            <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
              {!isSelectedBeforeRegistration && (
                <div className="text-left sm:text-right">
                  <div className="font-mono text-xs sm:text-sm font-black text-neutral-950">
                    {selectedLog.completedDailyTasks} of {selectedLog.totalDailyTasks} Done
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-neutral-700 font-mono font-semibold">
                    {selectedLog.completionRate}% Completion Rate
                  </div>
                </div>
              )}
              {!isSelectedBeforeRegistration && selectedDateStr <= todayStr && (selectedLog.totalDailyTasks === 0 || selectedLog.completedDailyTasks === 0) && (
                <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg bg-red-600 text-white font-mono text-[10px] sm:text-xs font-black shadow-sm shrink-0">
                  MISSED (RED)
                </span>
              )}
            </div>
          </div>

          {/* Full Task List for Selected Day */}
          <div className="mt-4 space-y-2">
            {isSelectedBeforeRegistration ? (
              <div className="p-4 rounded-xl bg-[#bebebe] border border-[#a8a8a8] text-center">
                <Info className="w-6 h-6 text-neutral-700 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-neutral-900">
                  Before Account Registration
                </p>
                <p className="text-[11px] text-neutral-700 mt-0.5">
                  Your consistency streak begins from the date of your registration. Prior dates remain empty.
                </p>
              </div>
            ) : selectedLog.totalDailyTasks === 0 ? (
              <div className="p-4 rounded-xl bg-[#bebebe] border border-[#a8a8a8] text-center">
                <AlertCircle className="w-6 h-6 text-red-600 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-neutral-900">
                  No tasks were added for this day
                </p>
                <p className="text-[11px] text-neutral-700 mt-0.5">
                  Because no tasks were defined, this day is marked as <strong className="text-red-700">Red</strong>.
                </p>
                {onOpenAddTask && (
                  <button
                    onClick={onOpenAddTask}
                    className="mt-3 px-3.5 py-1.5 rounded-xl bg-white hover:bg-neutral-100 border border-[#a0a0a0] text-neutral-950 text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Task for Today
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {/* Completed Tasks */}
                {selectedLog.completedTaskTitles.map((title, idx) => (
                  <div
                    key={`comp-${idx}`}
                    className="p-3 rounded-xl bg-white border border-[#b0b0b0] flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-neutral-950 shrink-0" />
                      <span className="text-xs font-bold text-neutral-900 line-through text-neutral-600">
                        {title}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#e0e0e0] text-neutral-800 font-bold">
                      Completed
                    </span>
                  </div>
                ))}

                {/* Missed / Pending Tasks */}
                {(selectedLog.missedTaskTitles || []).map((title, idx) => (
                  <div
                    key={`miss-${idx}`}
                    className="p-3 rounded-xl bg-[#d0d0d0] border border-[#b5b5b5] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <Circle className="w-4 h-4 text-red-600 shrink-0" />
                      <span className="text-xs font-bold text-neutral-900">
                        {title}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold border border-red-200">
                      Missed
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

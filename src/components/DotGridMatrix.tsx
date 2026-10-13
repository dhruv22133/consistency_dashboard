"use client";

import React, { useState } from "react";
import { Grid, Sparkles, AlertTriangle } from "lucide-react";
import { DayLog } from "@/types";
import { getDayDotClass, formatDateISO } from "@/lib/utils";

interface DotGridMatrixProps {
  dayLogs: Record<string, DayLog>;
  userRegisteredAt?: string;
  onSelectDay: (log: DayLog) => void;
}

export const DotGridMatrix: React.FC<DotGridMatrixProps> = ({ dayLogs, userRegisteredAt, onSelectDay }) => {
  const [hoveredLog, setHoveredLog] = useState<{ log: DayLog; x: number; y: number } | null>(null);

  const today = new Date();
  const currentYear = today.getFullYear();

  const gridDays: Date[] = [];
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    gridDays.push(d);
  }

  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];

  gridDays.forEach((date) => {
    currentWeek.push(date);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  const monthLabels: { name: string; index: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, wIdx) => {
    const firstDayInWeek = week[0];
    if (firstDayInWeek) {
      const m = firstDayInWeek.getMonth();
      if (m !== lastMonth) {
        monthLabels.push({
          name: firstDayInWeek.toLocaleDateString("en-US", { month: "short" }),
          index: wIdx,
        });
        lastMonth = m;
      }
    }
  });

  return (
    <div className="bg-[#cecece] border border-[#b2b2b2] rounded-2xl p-6 my-6 shadow-sm relative overflow-hidden">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#b5b5b5] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Grid className="w-5 h-5 text-neutral-950" />
            <h2 className="text-xl font-bold text-neutral-950 tracking-tight">
              Consistency Matrix <span className="text-neutral-700 font-mono text-sm font-normal">({currentYear} Heatmap)</span>
            </h2>
          </div>
          <p className="text-xs text-neutral-700 font-medium mt-0.5">
            GitHub-style dot matrix visualization of daily consistency over the past 365 days. Dates prior to registration remain clean & empty.
          </p>
        </div>

        <div className="flex sm:hidden items-center justify-end text-[10px] text-neutral-600 font-mono mt-2">
          <span>Swipe horizontally to view full year →</span>
        </div>

        {/* Completion Legend */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-neutral-700 font-semibold">Completion:</span>
          <div className="flex items-center gap-1 font-mono text-[10px]">
            <span className="px-1.5 py-0.5 rounded bg-red-600 text-white font-bold">0% (Red)</span>
            <span className="px-1.5 py-0.5 rounded bg-[#9e9e9e] text-neutral-950 font-bold">Low</span>
            <span className="px-1.5 py-0.5 rounded bg-[#6e6e6e] text-white">Mid</span>
            <span className="px-1.5 py-0.5 rounded bg-[#121212] text-white font-bold">100%</span>
            <span className="px-1.5 py-0.5 rounded bg-[#c4c4c4] text-neutral-600 border border-[#b2b2b2]">Empty</span>
          </div>
        </div>
      </div>

      {/* Grid Canvas Wrapper */}
      <div className="mt-5 overflow-x-auto pb-4 pt-2">
        <div className="min-w-[760px]">

          {/* Month Header Row */}
          <div className="flex text-[10px] font-mono text-neutral-700 mb-2 pl-7 font-bold">
            {monthLabels.map((m, idx) => (
              <div
                key={`${m.name}-${idx}`}
                style={{ marginLeft: idx === 0 ? 0 : `${(m.index - (monthLabels[idx - 1]?.index || 0)) * 14 - 24}px` }}
              >
                {m.name}
              </div>
            ))}
          </div>

          {/* Grid Container */}
          <div className="flex items-start gap-2">

            {/* Day Labels */}
            <div className="flex flex-col justify-between text-[9px] font-mono text-neutral-700 h-[100px] py-0.5 select-none font-bold">
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
            </div>

            {/* Weeks Columns */}
            <div className="flex gap-1">
              {weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-1">
                  {week.map((dateObj) => {
                    const dateStr = formatDateISO(dateObj);
                    const todayStr = formatDateISO(today);
                    const isFuture = dateStr > todayStr;
                    const isBeforeRegistration = Boolean(userRegisteredAt && dateStr < userRegisteredAt);
                    const log: DayLog = dayLogs[dateStr] || {
                      date: dateStr,
                      totalDailyTasks: 0,
                      completedDailyTasks: 0,
                      completionRate: 0,
                      completedTaskTitles: [],
                      missedTaskTitles: [],
                    };

                    const dotClass = getDayDotClass(
                      log.completedDailyTasks,
                      log.totalDailyTasks,
                      isFuture,
                      isBeforeRegistration
                    );

                    return (
                      <div
                        key={dateStr}
                        onClick={() => {
                          if (!isBeforeRegistration) onSelectDay(log);
                        }}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredLog({ log, x: rect.left + rect.width / 2, y: rect.top });
                        }}
                        onMouseLeave={() => setHoveredLog(null)}
                        className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-sm transition-all duration-200 ${
                          isBeforeRegistration ? "cursor-default opacity-50" : "cursor-pointer hover:scale-125 hover:z-20"
                        } ${dotClass}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

          </div>

        </div>
      </div>

      {/* Floating Hover Tooltip */}
      {hoveredLog && (() => {
        const isHoveredDateStr = hoveredLog.log.date;
        const isHoveredBeforeReg = Boolean(userRegisteredAt && isHoveredDateStr < userRegisteredAt);
        const isHoveredFuture = new Date(hoveredLog.log.date + "T00:00:00") > today;
        const isHoveredMissed = !isHoveredBeforeReg && !isHoveredFuture && (hoveredLog.log.totalDailyTasks === 0 || hoveredLog.log.completedDailyTasks === 0);
        const isHoveredMax = !isHoveredBeforeReg && hoveredLog.log.totalDailyTasks > 0 && hoveredLog.log.completedDailyTasks === hoveredLog.log.totalDailyTasks;

        return (
          <div className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full -mt-2 bg-neutral-950 border border-neutral-700 text-white rounded-lg px-3 py-2 text-xs shadow-xl">
            <div className="font-bold flex items-center gap-1.5">
              <span>{new Date(hoveredLog.log.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
              {isHoveredBeforeReg && (
                <span className="text-[10px] text-neutral-400 bg-neutral-800 px-1.5 py-0.5 rounded font-mono">
                  Empty
                </span>
              )}
              {isHoveredMissed && (
                <span className="text-[10px] text-white bg-red-600 px-1.5 py-0.5 rounded flex items-center gap-1 font-bold">
                  <AlertTriangle className="w-3 h-3" /> Missed
                </span>
              )}
              {isHoveredMax && (
                <span className="text-[10px] text-neutral-950 bg-white px-1.5 py-0.5 rounded flex items-center gap-1 font-bold">
                  <Sparkles className="w-3 h-3 text-neutral-950" /> 100%
                </span>
              )}
            </div>
            <div className="text-neutral-300 font-mono text-[11px] mt-1">
              {isHoveredBeforeReg
                ? "No record prior to registration"
                : `${hoveredLog.log.completedDailyTasks} of ${hoveredLog.log.totalDailyTasks} tasks done (${hoveredLog.log.completionRate}%)`
              }
            </div>
          </div>
        );
      })()}

      {/* Footer Info */}
      <div className="mt-2 pt-3 border-t border-[#b5b5b5] flex items-center justify-between text-[11px] text-neutral-700 font-semibold">
        <span>365 Days Consistency View</span>
        <div className="flex items-center gap-1 font-mono">
          <span>Less</span>
          <span className="w-2.5 h-2.5 rounded-sm bg-[#c4c4c4] border border-[#b2b2b2]" title="Empty" />
          <span className="w-2.5 h-2.5 rounded-sm bg-[#9e9e9e]" />
          <span className="w-2.5 h-2.5 rounded-sm bg-[#6e6e6e]" />
          <span className="w-2.5 h-2.5 rounded-sm bg-[#3e3e3e]" />
          <span className="w-2.5 h-2.5 rounded-sm bg-[#121212]" />
          <span>More</span>
        </div>
      </div>

    </div>
  );
};

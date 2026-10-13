"use client";

import React, { useState } from "react";
import {
  Calendar,
  Clock,
  Target,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Bell,
  Sparkles
} from "lucide-react";
import { Task, Timeframe, NotificationSchedule } from "@/types";
import { formatDateISO } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface TaskAreaProps {
  tasks: Task[];
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenAddTask: (defaultTimeframe?: Timeframe) => void;
  motto?: string;
  schedule?: NotificationSchedule;
}

export const TaskArea: React.FC<TaskAreaProps> = ({
  tasks,
  onToggleTask,
  onDeleteTask,
  onOpenAddTask,
  motto,
  schedule,
}) => {
  const [activeTab, setActiveTab] = useState<Timeframe>("daily");

  const todayStr = formatDateISO(new Date());

  const filteredByTimeframe = tasks.filter((t) => {
    if (t.timeframe !== activeTab) return false;
    if (activeTab === "daily") {
      const taskDate = t.targetDate || (t.createdAt ? formatDateISO(new Date(t.createdAt)) : todayStr);
      return taskDate === todayStr;
    }
    return true;
  });

  const completedCount = filteredByTimeframe.filter((t) => t.completed).length;
  const totalCount = filteredByTimeframe.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const dailyInterval = schedule?.dailyIntervalHours || 5;
  const monthlyInterval = schedule?.monthlyIntervalDays || 10;
  const yearlyInterval = schedule?.yearlyIntervalMonths || 3;

  const getNotificationNotice = (tf: Timeframe) => {
    switch (tf) {
      case "daily":
        return {
          title: `Every ${dailyInterval} Hours Reminder`,
          desc: `Sends automatic updates every ${dailyInterval} hours with remaining daily tasks count.`,
        };
      case "monthly":
        return {
          title: `Every ${monthlyInterval} Days Check-in`,
          desc: `Sends progress digest every ${monthlyInterval} days to keep your monthly goals on track.`,
        };
      case "yearly":
        return {
          title: `Quarterly (${yearlyInterval} Months) Review`,
          desc: `Sends milestone evaluation notifications every ${yearlyInterval} months for long-term targets.`,
        };
    }
  };

  const notice = getNotificationNotice(activeTab);

  return (
    <div className="bg-[#cecece] border border-[#b2b2b2] rounded-xl sm:rounded-2xl p-3.5 sm:p-6 my-4 sm:my-6 shadow-sm">

      {/* Personal Motto Banner (if defined) */}
      {motto && (
        <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-white/70 border border-[#b8b8b8] text-xs font-medium text-neutral-900 flex items-center gap-2 shadow-2xs">
          <Sparkles className="w-4 h-4 text-neutral-950 shrink-0" />
          <span className="italic font-semibold">&ldquo;{motto}&rdquo;</span>
        </div>
      )}

      {/* Header & Timeframe Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-[#b5b5b5] pb-4 sm:pb-5">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-neutral-950 tracking-tight">Task Command Center</h2>
          <p className="text-xs text-neutral-700 font-medium mt-0.5">
            Define daily, monthly, and yearly objectives with timed notification reminders.
          </p>
        </div>

        {/* Timeframe Switcher Tabs */}
        <div className="grid grid-cols-3 sm:flex items-center bg-[#bebebe] p-1 rounded-xl border border-[#a8a8a8] w-full sm:w-auto">
          {(["daily", "monthly", "yearly"] as Timeframe[]).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-2 sm:px-3.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold capitalize transition-all flex items-center justify-center gap-1 sm:gap-1.5 ${isActive
                  ? "bg-white text-neutral-950 shadow-md font-bold border border-[#a5a5a5]"
                  : "text-neutral-700 hover:text-neutral-950"
                  }`}
              >
                {tab === "daily" && <Clock className="w-3.5 h-3.5 shrink-0" />}
                {tab === "monthly" && <Calendar className="w-3.5 h-3.5 shrink-0" />}
                {tab === "yearly" && <Target className="w-3.5 h-3.5 shrink-0" />}
                <span>{tab}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Reminder Banner + Completion Progress Bar */}
      <div className="my-5 p-4 rounded-xl bg-[#c2c2c2] border border-[#a8a8a8] space-y-3 shadow-inner">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-[#b5b5b5] text-neutral-900">
              <Bell className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold text-neutral-950 mr-1.5">{notice.title}:</span>
              <span className="text-neutral-800 font-medium">{notice.desc}</span>
            </div>
          </div>
          <div className="font-mono text-xs text-neutral-900 shrink-0 font-semibold">
            Completion Level &nbsp; <span className="font-bold text-neutral-950">{completedCount} / {totalCount} ({progressPercent}%)</span>
          </div>
        </div>

        {/* Full-width progress bar */}
        <div className="w-full h-2 bg-[#b0b0b0] rounded-full overflow-hidden border border-[#9b9b9b]">
          <div
            className="h-full bg-neutral-950 transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Task Item List */}
      <div className="space-y-2.5 mt-3">
        <AnimatePresence mode="popLayout">
          {filteredByTimeframe.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-8 text-center border border-dashed border-[#a8a8a8] rounded-xl bg-[#c5c5c5]/60"
            >
              <Sparkles className="w-7 h-7 text-neutral-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-neutral-800">No {activeTab} tasks found</p>
              <p className="text-xs text-neutral-600 mt-0.5">
                Add a new task to stay consistent and track your goals.
              </p>
              <button
                onClick={() => onOpenAddTask(activeTab)}
                className="mt-3 px-3.5 py-1.5 rounded-full bg-white hover:bg-neutral-100 border border-[#a0a0a0] text-neutral-950 text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 text-neutral-950" /> Create {activeTab} task
              </button>
            </motion.div>
          ) : (
            filteredByTimeframe.map((task) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`group p-3.5 rounded-xl border transition-all duration-200 flex items-center justify-between gap-4 ${task.completed
                  ? "bg-[#c2c2c2]/80 border-[#b0b0b0] opacity-80"
                  : "bg-[#c4c4c4] border-[#adadad] hover:border-neutral-700 hover:bg-white"
                  }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button
                    onClick={() => onToggleTask(task.id)}
                    className="shrink-0 focus:outline-none"
                    title={task.completed ? "Mark as Incomplete" : "Mark as Complete"}
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-neutral-950 fill-neutral-950 text-white" />
                    ) : (
                      <Circle className="w-5 h-5 text-neutral-600 hover:text-neutral-950 transition-colors" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs font-bold tracking-tight ${task.completed ? "line-through text-neutral-600" : "text-neutral-950"
                          }`}
                      >
                        {task.title}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="p-2 sm:p-1.5 rounded-lg text-neutral-700 hover:text-red-700 hover:bg-[#b0b0b0] transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                    title="Delete task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

    </div>
  );
};

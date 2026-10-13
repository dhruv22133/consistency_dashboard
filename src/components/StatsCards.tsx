"use client";

import React from "react";
import { Flame, Trophy, Percent, Sparkles } from "lucide-react";
import { DashboardStats } from "@/types";

interface StatsCardsProps {
  stats: DashboardStats;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 my-3 sm:my-5">
      
      {/* Current Streak Card */}
      <div className="bg-[#cecece] border border-[#b2b2b2] p-4 sm:p-5 rounded-xl sm:rounded-2xl flex flex-col justify-between shadow-sm hover:border-neutral-500 transition-all">
        <div className="flex items-center justify-between text-neutral-700">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-neutral-800">CURRENT STREAK</span>
          <Flame className="w-4 h-4 text-neutral-900" />
        </div>
        <div className="mt-3 sm:mt-4 flex items-baseline justify-between">
          <span className="text-2xl sm:text-3xl font-extrabold font-mono text-neutral-950">{stats.currentStreak}</span>
          <span className="text-xs text-neutral-700 font-semibold">Days consecutive</span>
        </div>
        <div className="mt-3 w-full bg-[#b5b5b5] rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-neutral-950 h-full transition-all duration-500 rounded-full"
            style={{ width: `${Math.min(stats.currentStreak * 10, 100)}%` }}
          />
        </div>
      </div>

      {/* Longest Streak Card */}
      <div className="bg-[#cecece] border border-[#b2b2b2] p-4 sm:p-5 rounded-xl sm:rounded-2xl flex flex-col justify-between shadow-sm hover:border-neutral-500 transition-all">
        <div className="flex items-center justify-between text-neutral-700">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-neutral-800">LONGEST STREAK</span>
          <Trophy className="w-4 h-4 text-neutral-900" />
        </div>
        <div className="mt-3 sm:mt-4 flex items-baseline justify-between">
          <span className="text-2xl sm:text-3xl font-extrabold font-mono text-neutral-950">{stats.longestStreak}</span>
          <span className="text-xs text-neutral-700 font-semibold">Best record</span>
        </div>
        <div className="mt-3 text-[11px] text-neutral-600 font-medium">
          Personal record milestone
        </div>
      </div>

      {/* Consistency Rate Card */}
      <div className="bg-[#cecece] border border-[#b2b2b2] p-4 sm:p-5 rounded-xl sm:rounded-2xl flex flex-col justify-between shadow-sm hover:border-neutral-500 transition-all">
        <div className="flex items-center justify-between text-neutral-700">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-neutral-800">CONSISTENCY RATE</span>
          <Percent className="w-4 h-4 text-neutral-900" />
        </div>
        <div className="mt-3 sm:mt-4 flex items-baseline justify-between">
          <span className="text-2xl sm:text-3xl font-extrabold font-mono text-neutral-950">{stats.consistencyRate}%</span>
          <span className="text-xs text-neutral-700 font-semibold">Overall score</span>
        </div>
        <div className="mt-3 w-full bg-[#b5b5b5] rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-neutral-950 h-full transition-all duration-500 rounded-full"
            style={{ width: `${stats.consistencyRate}%` }}
          />
        </div>
      </div>

      {/* Dot Highlights Card */}
      <div className="bg-[#cecece] border border-[#b2b2b2] p-4 sm:p-5 rounded-xl sm:rounded-2xl flex flex-col justify-between shadow-sm hover:border-neutral-500 transition-all">
        <div className="flex items-center justify-between text-neutral-700">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-neutral-800">DOT HIGHLIGHTS</span>
          <Sparkles className="w-4 h-4 text-neutral-900" />
        </div>
        <div className="mt-3 sm:mt-4 flex flex-wrap items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-white border border-[#999999] shadow-sm inline-block shrink-0" />
            <span className="font-mono text-neutral-950 font-extrabold">{stats.perfectDaysCount}</span>
            <span className="text-neutral-700 font-semibold">Perfect</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block shadow-sm shrink-0" />
            <span className="font-mono text-neutral-950 font-extrabold">{stats.missedDaysCount}</span>
            <span className="text-neutral-700 font-semibold">Missed</span>
          </div>
        </div>
        <div className="mt-3 text-[11px] text-neutral-600 font-medium">
          Dots = tasks completed
        </div>
      </div>

    </div>
  );
};

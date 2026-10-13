"use client";

import React, { useState } from "react";
import { X, Plus, Clock, Calendar, Target, ListPlus, Bookmark, BookmarkCheck } from "lucide-react";
import { Timeframe } from "@/types";

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTimeframe?: Timeframe;
  onAddTasks: (tasks: { title: string; timeframe: Timeframe }[]) => void;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  onClose,
  defaultTimeframe = "daily",
  onAddTasks,
}) => {
  const [textValue, setTextValue] = useState("");
  const [timeframe, setTimeframe] = useState<Timeframe>(defaultTimeframe);
  const [snippetMessage, setSnippetMessage] = useState<string | null>(null);


  if (!isOpen) return null;

  // Keydown handler to auto-add bullet point "• " on Enter key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      // Allow standard shift+enter if desired, but auto-bullet on enter
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const value = target.value;

      // If text is completely empty and user hits enter, insert first bullet
      if (value.trim() === "") {
        e.preventDefault();
        setTextValue("• ");
        return;
      }

      // Default newline with bullet
      e.preventDefault();
      const nextText = value.substring(0, start) + "\n• " + value.substring(end);
      setTextValue(nextText);

      // Move cursor right after the bullet
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 3;
      }, 0);
    }
  };

  // Helper to ensure first line has bullet if user starts typing
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let val = e.target.value;
    if (val.length === 1 && !val.startsWith("•") && !val.startsWith("\n")) {
      val = "• " + val;
    }
    setTextValue(val);
  };

  // Automatically format pasted text so every line becomes a bullet point
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    // 1. Prevent default plain-text pasting
    e.preventDefault();

    // 2. Grab the text being pasted from the clipboard
    const pastedText = e.clipboardData.getData("text");
    if (!pastedText) return;

    // 3. Split the pasted text line-by-line
    const lines = pastedText.split("\n");

    // 4. Attach a bullet '• ' to every non-empty line (if it doesn't already have one)
    const formattedLines = lines
      .map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return ""; // Skip empty blank lines
        if (trimmed.startsWith("•")) return trimmed; // Keep existing bullets
        return `• ${trimmed}`; // Add bullet to plain text
      })
      .filter((line) => line.length > 0)
      .join("\n");

    // 5. Insert into the textarea at the user's current cursor position
    const target = e.currentTarget;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    const currentValue = target.value;

    // If the box is empty, just set the formatted text
    if (!currentValue.trim()) {
      setTextValue(formattedLines);
      return;
    }

    // Otherwise, stitch the new bulleted text into the existing text
    const nextValue = currentValue.substring(0, start) + formattedLines + currentValue.substring(end);
    setTextValue(nextValue);

    // Place the cursor right at the end of the newly pasted text
    setTimeout(() => {
      target.selectionStart = target.selectionEnd = start + formattedLines.length;
    }, 0);
  };


  // 1. Helper to show a temporary notice (e.g., "Saved!") that fades after 2 seconds
  const showNotice = (msg: string) => {
    setSnippetMessage(msg);
    setTimeout(() => setSnippetMessage(null), 2000);
  };

  // 2. Save the current text in the textarea as your routine snippet
  const handleSaveSnippet = () => {
    if (!textValue.trim()) {
      showNotice("Type tasks first to save as a snippet!");
      return;
    }
    localStorage.setItem("daily_task_snippet", textValue);
    showNotice("Daily snippet saved! 🔖");
  };

  // 3. Load the saved snippet into the textarea
  const handleLoadSnippet = () => {
    const saved = localStorage.getItem("daily_task_snippet");
    if (!saved) {
      showNotice("No saved snippet found yet!");
      return;
    }
    setTextValue(saved);
    showNotice("Snippet loaded! ✨");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textValue.trim()) return;

    // Parse lines and clean bullet prefixes
    const rawLines = textValue.split("\n");
    const parsedTasks: { title: string; timeframe: Timeframe }[] = [];

    rawLines.forEach((line) => {
      // Remove leading bullets (•, -, *, 1., 2., etc.) and whitespace
      const cleaned = line
        .replace(/^[\s•\-\*\d\.\)]+/, "")
        .trim();

      if (cleaned.length > 0) {
        parsedTasks.push({
          title: cleaned,
          timeframe,
        });
      }
    });

    if (parsedTasks.length > 0) {
      onAddTasks(parsedTasks);
    }

    setTextValue("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
      />

      {/* Dialog Box */}
      <div className="relative w-full max-w-lg bg-[#dedede] border border-[#c8c8c8] rounded-2xl p-4 sm:p-6 text-neutral-900 shadow-2xl z-10 max-h-[92vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#c8c8c8] pb-3 sm:pb-4">
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            <div className="p-1.5 sm:p-2 rounded-xl bg-white border border-[#c8c8c8] text-neutral-900 shadow-sm shrink-0">
              <ListPlus className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-950" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-neutral-900 tracking-wide">Add Tasks</h3>
              <p className="text-[11px] sm:text-xs text-neutral-600 mt-0.5">
                Type all tasks at once. Press Enter to create each new task bullet point.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#d4d4d4] hover:bg-white text-neutral-700 hover:text-neutral-950 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 sm:mt-5 space-y-3 sm:space-y-4">

          {/* Timeframe Scope Selection */}
          <div>
            <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1.5 sm:mb-2">
              Timeframe Scope
            </label>
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              {(["daily", "monthly", "yearly"] as Timeframe[]).map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeframe(tf)}
                  className={`py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl text-[11px] sm:text-xs font-semibold capitalize border transition-all flex items-center justify-center gap-1 sm:gap-1.5 ${timeframe === tf
                    ? "bg-white text-neutral-950 border-white shadow-md font-bold"
                    : "bg-[#d5d5d5] text-neutral-700 border-[#c8c8c8] hover:bg-white hover:text-neutral-950"
                    }`}
                >
                  {tf === "daily" && <Clock className="w-3.5 h-3.5 shrink-0" />}
                  {tf === "monthly" && <Calendar className="w-3.5 h-3.5 shrink-0" />}
                  {tf === "yearly" && <Target className="w-3.5 h-3.5 shrink-0" />}
                  <span>{tf}</span>
                </button>
              ))}
            </div>
            <div className="text-[10px] sm:text-[11px] text-neutral-600 mt-1 font-medium italic">
              {timeframe === "daily" && "⚡ Triggers reminder notification every 5 hours for remaining tasks."}
              {timeframe === "monthly" && "📅 Triggers progress digest notification every 10 days."}
              {timeframe === "yearly" && "🎯 Triggers quarterly review notification every 3 months."}
            </div>
          </div>

          {/* Large Bulk Task Bullet Textarea Area */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider">
                Task List <span className="text-red-600">*</span>
              </label>

              {/* Feedback notification badge (shows 'Saved!', 'Copied!', etc.) */}
              {snippetMessage && (
                <span className="text-[10px] sm:text-[11px] font-bold text-neutral-900 bg-white px-2 py-0.5 rounded-md border border-[#c8c8c8] animate-fade-in shadow-xs">
                  {snippetMessage}
                </span>
              )}
            </div>
            {/* Quick Snippet Toolbar */}
            <div className="flex items-center gap-1.5 mb-2 bg-[#d5d5d5] p-1.5 rounded-xl border border-[#c8c8c8]">
              <button
                type="button"
                onClick={handleLoadSnippet}
                title="Load your saved daily tasks template"
                className="px-2 sm:px-2.5 py-1 rounded-lg bg-white hover:bg-neutral-100 text-neutral-900 text-[10px] sm:text-[11px] font-semibold flex items-center gap-1 border border-[#c8c8c8] shadow-2xs transition-colors"
              >
                <Bookmark className="w-3 h-3 text-neutral-800 shrink-0" />
                <span>Insert Snippet</span>
              </button>
              <button
                type="button"
                onClick={handleSaveSnippet}
                title="Save current tasks as your daily template"
                className="px-2 sm:px-2.5 py-1 rounded-lg bg-transparent hover:bg-white text-neutral-700 hover:text-neutral-950 text-[10px] sm:text-[11px] font-medium flex items-center gap-1 transition-colors"
              >
                <BookmarkCheck className="w-3 h-3 shrink-0" />
                <span>Save as Snippet</span>
              </button>
            </div>


            <textarea
              rows={5}
              required
              value={textValue}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={`• Add task 1\n• Add task 2\n• Add task 3`}
              className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-white border border-[#c8c8c8] text-neutral-950 text-xs sm:text-sm font-medium focus:outline-none focus:border-neutral-900 transition-colors placeholder:text-neutral-400 leading-relaxed resize-none shadow-sm"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-3 flex items-center justify-end space-x-2 sm:space-x-3 border-t border-[#c8c8c8]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 sm:px-4 py-2 rounded-xl bg-[#d5d5d5] hover:bg-white border border-[#c8c8c8] text-neutral-800 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 sm:px-5 py-2 rounded-xl bg-white text-neutral-950 hover:bg-neutral-100 text-xs font-bold tracking-wide shadow-md border border-[#b0b0b0] transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-neutral-950 shrink-0" /> Add All Tasks
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

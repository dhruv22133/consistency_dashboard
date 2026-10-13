"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Activity, Lock, Eye, EyeOff, AlertCircle, ArrowRight, ShieldCheck, Mail, LogOut } from "lucide-react";

export default function SetPasswordPage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Guards: If unauthenticated, redirect to /login. If user already has password, redirect to /
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    } else if (status === "authenticated") {
      if (session?.user?.hasPassword) {
        window.location.href = "/";
        return;
      }

      // Check directly with backend in case user already set password
      fetch("/api/user/profile")
        .then((r) => r.json())
        .then((data) => {
          if (data?.user?.hasPassword) {
            window.location.href = "/";
          }
        })
        .catch(() => {});
    }
  }, [status, session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/user/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirmPassword }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setErrorMsg(data?.error || "Failed to set password.");
        setLoading(false);
        return;
      }

      // Refresh session state and route to actual website
      try {
        if (update) {
          await update();
        }
      } catch (upErr) {
        console.warn("Session update warning:", upErr);
      }

      router.refresh();
      window.location.href = "/";
    } catch (err: any) {
      console.error("Error submitting password:", err);
      setErrorMsg(err?.message || "An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#dedede] flex items-center justify-center font-sans">
        <div className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-white border border-[#c8c8c8] shadow-sm">
          <Activity className="w-5 h-5 text-neutral-950 animate-pulse" />
          <span className="text-xs font-bold text-neutral-900 tracking-wider uppercase">Loading Account...</span>
        </div>
      </div>
    );
  }

  const userEmail = session?.user?.email || "Google Account";

  return (
    <div className="min-h-screen bg-[#dedede] text-neutral-950 flex flex-col justify-center items-center p-4 sm:p-6 font-sans select-none">

      {/* Main Centered Card */}
      <div className="w-full max-w-md bg-white border border-[#c8c8c8] rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-neutral-950 text-white flex items-center justify-center font-bold shadow-md mb-3">
            <Activity className="w-6 h-6 text-white" />
          </div>

          <span className="text-xs font-black tracking-widest text-neutral-900 uppercase">
            CONSISTENCY
          </span>

          <h1 className="text-xl sm:text-2xl font-black text-neutral-950 tracking-tight mt-1">
            Create Account Password
          </h1>

          <p className="text-xs text-neutral-600 font-medium mt-1">
            Complete your setup. A personal password is mandatory to access the consistency tracker.
          </p>
        </div>

        {/* Recent Google Account Display Banner */}
        <div className="p-3.5 rounded-2xl bg-[#f5f5f5] border border-[#dcdcdc] mb-5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white border border-[#cfcfcf] flex items-center justify-center shrink-0 shadow-2xs">
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.67v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.16z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.41 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.16 0 9.97 0 12s.45 3.84 1.24 5.42l4.04-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.59 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
          </div>

          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
              Google Account Connected
            </span>
            <span className="text-xs font-bold text-neutral-950 truncate block">
              {userEmail}
            </span>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-xs text-red-900 font-bold">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Mandatory Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New Password */}
          <div>
            <label className="block text-xs font-bold text-neutral-800 mb-1.5 uppercase tracking-wider">
              Enter Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Enter at least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#c8c8c8] text-xs text-neutral-950 font-medium focus:outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 transition-all bg-white shadow-2xs font-mono placeholder:text-neutral-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-neutral-400 hover:text-neutral-700 transition-colors"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-bold text-neutral-800 mb-1.5 uppercase tracking-wider">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3.5" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#c8c8c8] text-xs text-neutral-950 font-medium focus:outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 transition-all bg-white shadow-2xs font-mono placeholder:text-neutral-400"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-3 text-neutral-400 hover:text-neutral-700 transition-colors"
                title={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Mandatory Action Notice */}
          <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-[11px] text-neutral-600 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-neutral-900 shrink-0 mt-0.5" />
            <span>
              This password is required so you can securely manage your account and sign in via either Google or credentials.
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-2xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold tracking-wide shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <span>{loading ? "Saving Password..." : "Save Password & Enter Website"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Sign Out Option */}
        <div className="mt-6 pt-4 border-t border-[#f0f0f0] text-center">
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-xs font-semibold text-neutral-500 hover:text-red-700 transition-colors inline-flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out and use another account</span>
          </button>
        </div>

      </div>

    </div>
  );
}

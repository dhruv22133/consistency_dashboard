"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { Activity, Mail, Lock, ArrowRight, Eye, EyeOff, AlertCircle, Shield, CheckCircle2, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [isLoginTab, setIsLoginTab] = useState(true);

  // Form inputs for credentials sign-in
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Status & error states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // If already authenticated, redirect straight to the main tracker
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlError = params.get("error");
      if (urlError) {
        if (urlError === "OAuthAccountNotLinked") {
          setErrorMsg("An account already exists with this email. Please sign in with your credentials.");
        } else if (urlError === "AccessDenied") {
          setErrorMsg("Access was denied by Google. Please try again.");
        } else {
          setErrorMsg("Google sign-in could not be completed. Please check your OAuth setup.");
        }
      }
    }
  }, [status, router]);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setErrorMsg(res.error);
        setLoading(false);
        return;
      }

      // Successfully signed in -> router refresh and push to main app
      router.refresh();
      router.push("/");
    } catch {
      setErrorMsg("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    setErrorMsg(null);
    signIn("google", { callbackUrl: "/" }, { prompt: "select_account" });
  };

  return (
    <div className="min-h-screen bg-[#dedede] text-neutral-950 flex flex-col justify-center items-center p-4 sm:p-6 font-sans select-none">

      {/* Main Centered Authentication Card */}
      <div className="w-full max-w-md bg-white border border-[#c8c8c8] rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">

        {/* Brand Icon Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-neutral-950 text-white flex items-center justify-center font-bold shadow-md mb-3">
            <Activity className="w-6 h-6 text-white" />
          </div>

          <span className="text-xs font-black tracking-widest text-neutral-900 uppercase">
            CONSISTENCY
          </span>

          <h1 className="text-xl sm:text-2xl font-black text-neutral-950 tracking-tight mt-1">
            {isLoginTab ? "Welcome Back" : "Create Your Account"}
          </h1>

          <p className="text-xs text-neutral-600 font-medium mt-1">
            {isLoginTab
              ? "Sign in to access your consistency dashboard and streaks."
              : "New accounts register exclusively with Google for verified tracking."}
          </p>
        </div>

        {/* Tab Segment Switcher */}
        <div className="flex p-1 rounded-2xl bg-[#ebebeb] border border-[#d6d6d6] mb-6">
          <button
            type="button"
            onClick={() => {
              setIsLoginTab(true);
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              isLoginTab
                ? "bg-neutral-950 text-white shadow-sm"
                : "text-neutral-600 hover:text-neutral-950"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLoginTab(false);
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              !isLoginTab
                ? "bg-neutral-950 text-white shadow-sm"
                : "text-neutral-600 hover:text-neutral-950"
            }`}
          >
            Register (Google Only)
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-xs text-red-900 font-bold">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {isLoginTab ? (
          /* ================================================= */
          /* 1. SIGN IN TAB (CREDENTIALS OR GOOGLE)             */
          /* ================================================= */
          <div>
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1.5 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#c8c8c8] text-xs text-neutral-950 font-medium focus:outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 transition-all bg-white shadow-2xs placeholder:text-neutral-400"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1.5 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••••••"
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 rounded-2xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold tracking-wide shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <span>{loading ? "Signing in..." : "Sign In & Access Tracker"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* OAuth Divider */}
            <div className="my-5 flex items-center gap-3">
              <div className="flex-1 h-px bg-[#e5e5e5]" />
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Or continue with</span>
              <div className="flex-1 h-px bg-[#e5e5e5]" />
            </div>

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-neutral-50 text-neutral-900 border border-[#c8c8c8] text-xs font-bold transition-all flex items-center justify-center gap-3 shadow-2xs hover:border-neutral-400 active:scale-95"
            >
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
              <span>Continue with Google</span>
            </button>

            {/* Bottom prompt to register */}
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLoginTab(false);
                  setErrorMsg(null);
                }}
                className="text-xs text-neutral-600 hover:text-neutral-950 font-semibold transition-colors"
              >
                Don&apos;t have an account? <span className="underline font-bold text-neutral-900">Register with Google</span>
              </button>
            </div>
          </div>
        ) : (
          /* ================================================= */
          /* 2. REGISTER TAB (EXCLUSIVELY GOOGLE REGISTER)     */
          /* ================================================= */
          <div className="space-y-4">
            {/* Explanatory Step Card */}
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-neutral-900 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>How Registration Works</span>
              </div>

              <div className="space-y-2 text-xs text-neutral-600">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Step 1:</strong> Register with Google below (1-click verification).</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Step 2:</strong> Set your personal account password on the next screen.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Step 3:</strong> Start tracking! You can later log in using Google or your password.</span>
                </div>
              </div>
            </div>

            {/* Big Google Register Button */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              className="w-full py-3.5 px-4 rounded-2xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-3 shadow-md active:scale-95"
            >
              <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center p-0.5">
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
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
              <span>Register with Google & Continue</span>
              <ArrowRight className="w-4 h-4 ml-auto" />
            </button>

            {/* Back to sign in link */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLoginTab(true);
                  setErrorMsg(null);
                }}
                className="text-xs text-neutral-600 hover:text-neutral-950 font-semibold transition-colors"
              >
                Already have an account? <span className="underline font-bold text-neutral-900">Sign In</span>
              </button>
            </div>
          </div>
        )}

        {/* Minimal Footer Note */}
        <div className="mt-6 pt-4 border-t border-[#f0f0f0] text-center">
          <p className="text-[11px] text-neutral-500 flex items-center justify-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-neutral-400" />
            <span>Secure account access. Your tracking starts from your join date.</span>
          </p>
        </div>

      </div>

    </div>
  );
}


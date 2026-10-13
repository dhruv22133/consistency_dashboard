"use client";

import React, { useState } from "react";
import { X, Lock, Mail, Github, AlertCircle, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { signIn } from "next-auth/react";

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
    const [isLoginTab, setIsLoginTab] = useState(true);

    // Form states
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

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
            } else {
                onClose();
            }
        } catch {
            setErrorMsg("An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleAuth = () => {
        setErrorMsg(null);
        signIn("google", { callbackUrl: "/" }, { prompt: "select_account" });
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4">
            {/* Backdrop */}
            <div
                onClick={onClose}
                className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            />

            {/* Modal Dialog */}
            <div className="relative w-full max-w-md bg-[#dedede] border border-[#b2b2b2] rounded-2xl p-5 sm:p-6 text-neutral-900 shadow-2xl z-10">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#c8c8c8] pb-3">
                    <div>
                        <h3 className="text-base sm:text-lg font-bold text-neutral-950">
                            {isLoginTab ? "Welcome Back" : "Create Account"}
                        </h3>
                        <p className="text-xs text-neutral-600 mt-0.5">
                            {isLoginTab
                                ? "Sign in to access your personal dashboard"
                                : "New accounts register exclusively with Google"}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg bg-[#d4d4d4] hover:bg-white text-neutral-700 hover:text-neutral-950 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Tab Switcher */}
                <div className="flex gap-1 mt-4 p-1 rounded-xl bg-[#bebebe] border border-[#a8a8a8]">
                    <button
                        type="button"
                        onClick={() => {
                            setIsLoginTab(true);
                            setErrorMsg(null);
                        }}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${isLoginTab
                                ? "bg-white text-neutral-950 shadow-sm"
                                : "text-neutral-700 hover:text-neutral-950"
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
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${!isLoginTab
                                ? "bg-white text-neutral-950 shadow-sm"
                                : "text-neutral-700 hover:text-neutral-950"
                            }`}
                    >
                        Register (Google Only)
                    </button>
                </div>

                {/* Error Alert */}
                {errorMsg && (
                    <div className="mt-3 p-2.5 rounded-xl bg-red-100 border border-red-200 flex items-center gap-2 text-xs text-red-800 font-semibold">
                        <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                        <span>{errorMsg}</span>
                    </div>
                )}

                {isLoginTab ? (
                    /* 1. SIGN IN VIEW */
                    <div className="mt-4">
                        <form onSubmit={handleCredentialsSubmit} className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                                    <input
                                        type="email"
                                        required
                                        placeholder="name@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white border border-[#c8c8c8] text-neutral-950 text-xs font-medium focus:outline-none focus:border-neutral-900"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                                    <input
                                        type="password"
                                        required
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white border border-[#c8c8c8] text-neutral-950 text-xs font-medium focus:outline-none focus:border-neutral-900"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-2 py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold tracking-wide border border-neutral-900 shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                            >
                                <span>{loading ? "Signing in..." : "Sign In"}</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="my-4 flex items-center gap-2">
                            <div className="flex-1 h-px bg-[#c8c8c8]" />
                            <span className="text-[10px] uppercase font-bold text-neutral-500">Or continue with</span>
                            <div className="flex-1 h-px bg-[#c8c8c8]" />
                        </div>

                        {/* Google OAuth Button */}
                        <button
                            type="button"
                            onClick={handleGoogleAuth}
                            className="w-full py-2.5 rounded-xl bg-white hover:bg-neutral-50 text-neutral-900 border border-[#b8b8b8] text-xs font-bold transition-all flex items-center justify-center gap-2.5 shadow-sm mb-2"
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
                    </div>
                ) : (
                    /* 2. REGISTER VIEW (EXCLUSIVELY GOOGLE) */
                    <div className="mt-4 space-y-3">
                        <div className="p-3.5 rounded-xl bg-white border border-[#c8c8c8] space-y-2.5">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900">
                                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                <span>Google Registration Workflow</span>
                            </div>
                            <div className="space-y-1.5 text-[11px] text-neutral-600">
                                <div className="flex items-start gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                    <span>Register your account with 1-click Google verification.</span>
                                </div>
                                <div className="flex items-start gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                    <span>Set your private account password right after.</span>
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleGoogleAuth}
                            className="w-full py-3 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-2.5 shadow-md active:scale-95"
                        >
                            <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center p-0.5">
                                <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24">
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
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};


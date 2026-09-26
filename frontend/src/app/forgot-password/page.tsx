"use client";

import React, { useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { Mail, KeyRound, CheckCircle2, ShieldAlert, Eye, EyeOff } from "lucide-react";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"REQUEST" | "RESET">("REQUEST");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const data = await apiRequest("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      setMessage(`OTP sent! ${data.otp_demo ? `Demo OTP Code: ${data.otp_demo}` : ""}`);
      if (data.otp_demo) setOtp(data.otp_demo);
      setStep("RESET");
    } catch (err: any) {
      setError(err.message || "Failed to request OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await apiRequest("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, otp, new_password: newPassword }),
      });

      setMessage("Password reset successfully! Redirecting to login...");
      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Invalid or expired OTP code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8F3] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-[#DDE4DC] rounded-xl shadow-sm p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-[#2F6B45] text-white rounded-xl flex items-center justify-center font-bold text-2xl mx-auto shadow-sm mb-3">
            S
          </div>
          <h1 className="text-2xl font-bold text-[#17201A]">Password Recovery</h1>
          <p className="text-xs text-[#677269] mt-1">
            {step === "REQUEST" ? "Enter your email to receive an OTP code" : "Enter OTP and your new password"}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-[#C44747] flex items-center gap-2">
            <ShieldAlert size={16} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 bg-[#E7F2E9] border border-[#B8DBC0] rounded-lg text-xs text-[#2F6B45] flex items-center gap-2 font-medium">
            <CheckCircle2 size={16} className="flex-shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {step === "REQUEST" ? (
          <form onSubmit={handleRequestOTP} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#17201A] mb-1">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3 text-[#8B958D]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="manager@stocksense.com"
                  className="w-full pl-9 pr-3 py-2 bg-[#F7F8F3] border border-[#DDE4DC] rounded-lg text-xs text-[#17201A] focus:outline-none focus:border-[#2F6B45]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#2F6B45] hover:bg-[#255738] text-white font-semibold rounded-lg text-xs transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? "Sending OTP..." : "Request OTP Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#17201A] mb-1">OTP Code</label>
              <div className="relative">
                <KeyRound size={16} className="absolute left-3 top-3 text-[#8B958D]" />
                <input
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full pl-9 pr-3 py-2 bg-[#F7F8F3] border border-[#DDE4DC] rounded-lg text-xs text-[#17201A] focus:outline-none focus:border-[#2F6B45]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17201A] mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-3 pr-9 py-2 bg-[#F7F8F3] border border-[#DDE4DC] rounded-lg text-xs text-[#17201A] focus:outline-none focus:border-[#2F6B45]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-[#8B958D] hover:text-[#17201A] transition-colors"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#2F6B45] hover:bg-[#255738] text-white font-semibold rounded-lg text-xs transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? "Resetting Password..." : "Set New Password"}
            </button>

            <button
              type="button"
              onClick={() => setStep("REQUEST")}
              className="w-full text-center text-xs text-[#677269] hover:underline mt-2"
            >
              Resend OTP to another email
            </button>
          </form>
        )}

        <p className="text-center text-xs text-[#677269] mt-6">
          Back to{" "}
          <Link href="/login" className="text-[#2F6B45] font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

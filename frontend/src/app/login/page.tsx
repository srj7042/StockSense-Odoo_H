"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiRequest, setAuthToken, setCurrentUser } from "@/lib/api";
import { Lock, Mail, UserCheck, ShieldAlert, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      setAuthToken(data.access_token);
      setCurrentUser(data.user);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemoUser = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password123");
  };

  return (
    <div className="min-h-screen bg-[#F7F8F3] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-[#DDE4DC] rounded-xl shadow-sm p-8">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-[#2F6B45] text-white rounded-xl flex items-center justify-center font-bold text-2xl mx-auto shadow-sm mb-3">
            S
          </div>
          <h1 className="text-2xl font-bold text-[#17201A]">Sign in to StockSense</h1>
          <p className="text-xs text-[#677269] mt-1">Real-time inventory management platform</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-[#C44747] flex items-center gap-2">
            <ShieldAlert size={16} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#17201A] mb-1">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-3 text-[#8B958D]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@stocksense.com"
                className="w-full pl-9 pr-3 py-2 bg-[#F7F8F3] border border-[#DDE4DC] rounded-lg text-xs text-[#17201A] focus:outline-none focus:border-[#2F6B45]"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-[#17201A]">Password</label>
              <Link href="/forgot-password" className="text-xs text-[#2F6B45] hover:underline font-medium">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-3 text-[#8B958D]" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-9 py-2 bg-[#F7F8F3] border border-[#DDE4DC] rounded-lg text-xs text-[#17201A] focus:outline-none focus:border-[#2F6B45]"
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
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Demo Accounts Helper */}
        <div className="mt-6 pt-4 border-t border-[#DDE4DC]">
          <p className="text-[11px] font-semibold text-[#677269] uppercase tracking-wider mb-2 text-center">
            One-Click Hackathon Demo Sign In
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => fillDemoUser("manager@stocksense.com")}
              className="py-1.5 px-2 bg-[#F1F7F2] hover:bg-[#E7F2E9] border border-[#B8DBC0] text-[#2F6B45] text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors"
            >
              <UserCheck size={14} />
              Inventory Manager
            </button>
            <button
              onClick={() => fillDemoUser("staff@stocksense.com")}
              className="py-1.5 px-2 bg-[#F1F7F2] hover:bg-[#E7F2E9] border border-[#B8DBC0] text-[#2F6B45] text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors"
            >
              <UserCheck size={14} />
              Warehouse Staff
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-[#677269] mt-6">
          Don't have an account?{" "}
          <Link href="/signup" className="text-[#2F6B45] font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

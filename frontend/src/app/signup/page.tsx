"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiRequest, setAuthToken, setCurrentUser } from "@/lib/api";
import { Lock, Mail, User, ShieldAlert, Phone, Eye, EyeOff } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("MANAGER");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ name, email, password, role, phone }),
      });

      setAuthToken(data.access_token);
      setCurrentUser(data.user);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Registration failed. Please check inputs.");
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
          <h1 className="text-2xl font-bold text-[#17201A]">Create an Account</h1>
          <p className="text-xs text-[#677269] mt-1">Get started with StockSense Inventory</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-[#C44747] flex items-center gap-2">
            <ShieldAlert size={16} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#17201A] mb-1">Full Name</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-3 text-[#8B958D]" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full pl-9 pr-3 py-2 bg-[#F7F8F3] border border-[#DDE4DC] rounded-lg text-xs text-[#17201A] focus:outline-none focus:border-[#2F6B45]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#17201A] mb-1">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-3 text-[#8B958D]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@stocksense.com"
                className="w-full pl-9 pr-3 py-2 bg-[#F7F8F3] border border-[#DDE4DC] rounded-lg text-xs text-[#17201A] focus:outline-none focus:border-[#2F6B45]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#17201A] mb-1">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-3 text-[#8B958D]" />
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#17201A] mb-1">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 bg-[#F7F8F3] border border-[#DDE4DC] rounded-lg text-xs text-[#17201A] focus:outline-none focus:border-[#2F6B45]"
              >
                <option value="MANAGER">Inventory Manager</option>
                <option value="STAFF">Warehouse Staff</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17201A] mb-1">Phone (Optional)</label>
              <div className="relative">
                <Phone size={14} className="absolute left-2.5 top-3 text-[#8B958D]" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 555-0100"
                  className="w-full pl-8 pr-2 py-2 bg-[#F7F8F3] border border-[#DDE4DC] rounded-lg text-xs text-[#17201A] focus:outline-none focus:border-[#2F6B45]"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#2F6B45] hover:bg-[#255738] text-white font-semibold rounded-lg text-xs transition-colors shadow-sm disabled:opacity-50 mt-2"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-xs text-[#677269] mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-[#2F6B45] font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

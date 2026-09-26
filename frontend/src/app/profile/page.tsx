"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { apiRequest, removeAuthToken, setCurrentUser } from "@/lib/api";
import { User, Shield, LogOut, CheckCircle2, AlertCircle, Phone, Mail, Eye, EyeOff } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Profile Edit
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileMsg, setProfileMsg] = useState("");
  const [profileErr, setProfileErr] = useState("");

  // Password Change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [pwdMsg, setPwdMsg] = useState("");
  const [pwdErr, setPwdErr] = useState("");

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/auth/me");
      setProfile(data);
      setName(data.name);
      setPhone(data.phone || "");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg("");
    setProfileErr("");

    try {
      const updated = await apiRequest("/auth/profile", {
        method: "PUT",
        body: JSON.stringify({ name, phone }),
      });
      setProfile(updated);
      setCurrentUser(updated);
      setProfileMsg("Profile updated successfully!");
    } catch (err: any) {
      setProfileErr(err.message || "Failed to update profile.");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg("");
    setPwdErr("");

    try {
      await apiRequest("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      setPwdMsg("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      setPwdErr(err.message || "Failed to change password.");
    }
  };

  const handleLogout = () => {
    removeAuthToken();
    router.push("/login");
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-[#F7F8F3] flex">
        <Sidebar />
        <main className="flex-1 md:ml-64 p-6 flex items-center justify-center text-xs text-[#677269]">
          Loading profile...
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8F3] flex">
      <Sidebar />

      <main className="flex-1 md:ml-64 flex flex-col min-w-0">
        <Header
          title="User Profile & Security Settings"
          description="Manage account details, active sessions, and password security"
        />

        <div className="p-6 flex-1 space-y-6">
          {/* Profile Overview Banner */}
          <div className="bg-white p-6 rounded-xl border border-[#DDE4DC] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#2F6B45] text-white font-bold text-2xl flex items-center justify-center shadow-sm">
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#17201A]">{profile.name}</h2>
                <div className="flex items-center gap-3 text-xs text-[#677269] mt-1">
                  <span className="flex items-center gap-1 font-semibold text-[#2F6B45] bg-[#E7F2E9] px-2 py-0.5 rounded">
                    <Shield size={13} /> {profile.role}
                  </span>
                  <span>{profile.email}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-50 border border-red-200 text-[#C44747] font-semibold rounded-lg text-xs flex items-center gap-1.5 hover:bg-red-100 transition-colors"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information Form */}
            <div className="bg-white p-6 rounded-xl border border-[#DDE4DC] shadow-sm space-y-4 text-xs">
              <h3 className="font-bold text-sm text-[#17201A]">Personal Information</h3>

              {profileMsg && (
                <div className="p-2.5 bg-[#E7F2E9] text-[#2F6B45] border border-[#B8DBC0] rounded-lg flex items-center gap-1.5">
                  <CheckCircle2 size={15} />
                  <span>{profileMsg}</span>
                </div>
              )}
              {profileErr && (
                <div className="p-2.5 bg-red-50 text-[#C44747] border border-red-200 rounded-lg flex items-center gap-1.5">
                  <AlertCircle size={15} />
                  <span>{profileErr}</span>
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-3">
                <div>
                  <label className="block font-semibold text-[#17201A] mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F7F8F3] border border-[#DDE4DC] rounded-lg focus:outline-none focus:border-[#2F6B45]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#17201A] mb-1">Email (Read Only)</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-2.5 text-[#8B958D]" />
                    <input
                      type="email"
                      disabled
                      value={profile.email}
                      className="w-full pl-9 pr-3 py-2 bg-gray-100 border border-[#DDE4DC] rounded-lg text-gray-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#17201A] mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-2.5 text-[#8B958D]" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 555-0192"
                      className="w-full pl-9 pr-3 py-2 bg-[#F7F8F3] border border-[#DDE4DC] rounded-lg focus:outline-none focus:border-[#2F6B45]"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#2F6B45] hover:bg-[#255738] text-white font-semibold rounded-lg shadow-sm"
                  >
                    Update Profile
                  </button>
                </div>
              </form>
            </div>

            {/* Password Security Form */}
            <div className="bg-white p-6 rounded-xl border border-[#DDE4DC] shadow-sm space-y-4 text-xs">
              <h3 className="font-bold text-sm text-[#17201A]">Security & Password</h3>

              {pwdMsg && (
                <div className="p-2.5 bg-[#E7F2E9] text-[#2F6B45] border border-[#B8DBC0] rounded-lg flex items-center gap-1.5">
                  <CheckCircle2 size={15} />
                  <span>{pwdMsg}</span>
                </div>
              )}
              {pwdErr && (
                <div className="p-2.5 bg-red-50 text-[#C44747] border border-red-200 rounded-lg flex items-center gap-1.5">
                  <AlertCircle size={15} />
                  <span>{pwdErr}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-3">
                <div>
                  <label className="block font-semibold text-[#17201A] mb-1">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-3 pr-9 py-2 bg-[#F7F8F3] border border-[#DDE4DC] rounded-lg focus:outline-none focus:border-[#2F6B45]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-2.5 text-[#8B958D] hover:text-[#17201A] transition-colors"
                      title={showCurrentPassword ? "Hide password" : "Show password"}
                    >
                      {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#17201A] mb-1">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-3 pr-9 py-2 bg-[#F7F8F3] border border-[#DDE4DC] rounded-lg focus:outline-none focus:border-[#2F6B45]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-2.5 text-[#8B958D] hover:text-[#17201A] transition-colors"
                      title={showNewPassword ? "Hide password" : "Show password"}
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#173C28] hover:bg-black text-white font-semibold rounded-lg shadow-sm"
                  >
                    Change Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

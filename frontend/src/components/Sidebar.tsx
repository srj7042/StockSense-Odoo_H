"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  History,
  Bell,
  Settings,
  User,
  LogOut,
  ChevronDown,
  Warehouse,
  Boxes,
  Layers,
  Inbox,
  Truck,
  Sliders,
  Menu,
  X,
  Globe
} from "lucide-react";
import { removeAuthToken, getCurrentUser } from "@/lib/api";

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const user = getCurrentUser();
  const [opsOpen, setOpsOpen] = useState(pathname.startsWith("/operations"));
  const [settingsOpen, setSettingsOpen] = useState(pathname.startsWith("/settings"));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    removeAuthToken();
    router.push("/login");
  };

  const isLinkActive = (path: string) => pathname === path;

  return (
    <>
      {/* Mobile Hamburger toggle button */}
      <div className="md:hidden fixed top-3 left-3 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 bg-white border border-[#DDE4DC] rounded-md shadow-sm text-[#17201A]"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Backdrop overlay for mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 left-0 h-screen w-64 bg-white border-r border-[#DDE4DC] flex flex-col z-40 transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Logo Brand Header */}
        <div className="p-4 border-b border-[#DDE4DC] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#2F6B45] flex items-center center text-white font-bold text-lg justify-center shadow-sm">
            S
          </div>
          <div>
            <h1 className="font-bold text-base text-[#17201A] leading-none">StockSense</h1>
            <p className="text-xs text-[#677269] mt-0.5">Inventory Operations</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
          {/* Dashboard */}
          <Link
            href="/dashboard"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isLinkActive("/dashboard")
                ? "bg-[#E7F2E9] text-[#2F6B45]"
                : "text-[#677269] hover:bg-[#F1F7F2] hover:text-[#17201A]"
            }`}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </Link>

          {/* Products */}
          <Link
            href="/products"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isLinkActive("/products") || pathname.startsWith("/products/")
                ? "bg-[#E7F2E9] text-[#2F6B45]"
                : "text-[#677269] hover:bg-[#F1F7F2] hover:text-[#17201A]"
            }`}
          >
            <Package size={18} />
            Products
          </Link>

          {/* Operations Dropdown */}
          <div>
            <button
              onClick={() => setOpsOpen(!opsOpen)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname.startsWith("/operations")
                  ? "text-[#2F6B45]"
                  : "text-[#677269] hover:bg-[#F1F7F2] hover:text-[#17201A]"
              }`}
            >
              <span className="flex items-center gap-3">
                <ArrowLeftRight size={18} />
                Operations
              </span>
              <ChevronDown
                size={16}
                className={`transition-transform ${opsOpen ? "rotate-180" : ""}`}
              />
            </button>

            {opsOpen && (
              <div className="ml-7 mt-1 space-y-1 border-l-2 border-[#DDE4DC] pl-2">
                <Link
                  href="/operations/receipts"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-medium ${
                    isLinkActive("/operations/receipts")
                      ? "bg-[#E7F2E9] text-[#2F6B45]"
                      : "text-[#677269] hover:text-[#17201A]"
                  }`}
                >
                  <Inbox size={15} />
                  Receipts
                </Link>
                <Link
                  href="/operations/deliveries"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-medium ${
                    isLinkActive("/operations/deliveries")
                      ? "bg-[#E7F2E9] text-[#2F6B45]"
                      : "text-[#677269] hover:text-[#17201A]"
                  }`}
                >
                  <Truck size={15} />
                  Deliveries
                </Link>
                <Link
                  href="/operations/transfers"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-medium ${
                    isLinkActive("/operations/transfers")
                      ? "bg-[#E7F2E9] text-[#2F6B45]"
                      : "text-[#677269] hover:text-[#17201A]"
                  }`}
                >
                  <ArrowLeftRight size={15} />
                  Internal Transfers
                </Link>
                <Link
                  href="/operations/adjustments"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-medium ${
                    isLinkActive("/operations/adjustments")
                      ? "bg-[#E7F2E9] text-[#2F6B45]"
                      : "text-[#677269] hover:text-[#17201A]"
                  }`}
                >
                  <Sliders size={15} />
                  Inventory Adjustments
                </Link>
              </div>
            )}
          </div>

          {/* Move History / Stock Ledger */}
          <Link
            href="/ledger"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isLinkActive("/ledger")
                ? "bg-[#E7F2E9] text-[#2F6B45]"
                : "text-[#677269] hover:bg-[#F1F7F2] hover:text-[#17201A]"
            }`}
          >
            <History size={18} />
            Move History
          </Link>

          {/* Alerts */}
          <Link
            href="/alerts"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isLinkActive("/alerts")
                ? "bg-[#E7F2E9] text-[#2F6B45]"
                : "text-[#677269] hover:bg-[#F1F7F2] hover:text-[#17201A]"
            }`}
          >
            <Bell size={18} />
            Alerts
          </Link>

          {/* Settings Dropdown */}
          <div>
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname.startsWith("/settings")
                  ? "text-[#2F6B45]"
                  : "text-[#677269] hover:bg-[#F1F7F2] hover:text-[#17201A]"
              }`}
            >
              <span className="flex items-center gap-3">
                <Settings size={18} />
                Settings
              </span>
              <ChevronDown
                size={16}
                className={`transition-transform ${settingsOpen ? "rotate-180" : ""}`}
              />
            </button>

            {settingsOpen && (
              <div className="ml-7 mt-1 space-y-1 border-l-2 border-[#DDE4DC] pl-2">
                <Link
                  href="/settings/warehouses"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-medium ${
                    isLinkActive("/settings/warehouses")
                      ? "bg-[#E7F2E9] text-[#2F6B45]"
                      : "text-[#677269] hover:text-[#17201A]"
                  }`}
                >
                  <Warehouse size={15} />
                  Warehouses
                </Link>
                <Link
                  href="/settings/locations"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-medium ${
                    isLinkActive("/settings/locations")
                      ? "bg-[#E7F2E9] text-[#2F6B45]"
                      : "text-[#677269] hover:text-[#17201A]"
                  }`}
                >
                  <Boxes size={15} />
                  Locations
                </Link>
                <Link
                  href="/settings/categories"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-medium ${
                    isLinkActive("/settings/categories")
                      ? "bg-[#E7F2E9] text-[#2F6B45]"
                      : "text-[#677269] hover:text-[#17201A]"
                  }`}
                >
                  <Layers size={15} />
                  Categories
                </Link>
              </div>
            )}
          </div>

          {/* Landing Page */}
          <Link
            href="/landing"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isLinkActive("/landing")
                ? "bg-[#E7F2E9] text-[#2F6B45]"
                : "text-[#677269] hover:bg-[#F1F7F2] hover:text-[#17201A]"
            }`}
          >
            <Globe size={18} />
            Landing Page
          </Link>

          {/* Profile */}
          <Link
            href="/profile"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isLinkActive("/profile")
                ? "bg-[#E7F2E9] text-[#2F6B45]"
                : "text-[#677269] hover:bg-[#F1F7F2] hover:text-[#17201A]"
            }`}
          >
            <User size={18} />
            My Profile
          </Link>
        </nav>

        {/* Footer User Mini-Profile */}
        <div className="p-3 border-t border-[#DDE4DC] bg-[#F7F8F3]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-[#2F6B45] text-white flex items-center justify-center font-medium text-xs flex-shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-[#17201A] truncate">{user?.name || "Inventory User"}</p>
                <p className="text-[10px] text-[#677269] uppercase font-bold tracking-wider">{user?.role || "MANAGER"}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 text-[#677269] hover:text-[#C44747] hover:bg-white rounded transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

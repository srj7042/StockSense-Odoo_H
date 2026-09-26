"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Boxes,
  ShieldCheck,
  History,
  Bell,
  ArrowRight,
  Package,
  ArrowLeftRight,
  Sliders,
  CheckCircle2,
  UserCheck
} from "lucide-react";
import { getAuthToken } from "@/lib/api";

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    setIsLoggedIn(!!token);
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F8F3] text-[#17201A] flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-white border-b border-[#DDE4DC] sticky top-0 z-50 px-6 py-4 flex items-center justify-between shadow-xs">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#2F6B45] text-white flex items-center justify-center font-bold text-xl shadow-sm">
            S
          </div>
          <div>
            <h1 className="font-bold text-base text-[#17201A] leading-none">StockSense</h1>
            <p className="text-[10px] text-[#677269] mt-0.5">Inventory Management Platform</p>
          </div>
        </div>

        {/* Top Right Sign In / Sign Up Options */}
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <Link
              href="/"
              className="px-4 py-2 bg-[#2F6B45] hover:bg-[#255738] text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            >
              Go to Dashboard
              <ArrowRight size={14} />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 bg-[#F1F7F2] hover:bg-[#E7F2E9] border border-[#B8DBC0] text-[#2F6B45] font-semibold rounded-lg text-xs transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 bg-[#2F6B45] hover:bg-[#255738] text-white font-semibold rounded-lg text-xs transition-colors shadow-sm"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 py-16 md:py-24 max-w-5xl mx-auto text-center space-y-6">
        <span className="px-3 py-1 bg-[#E7F2E9] text-[#2F6B45] border border-[#B8DBC0] rounded-full text-xs font-semibold inline-flex items-center gap-1.5">
          <ShieldCheck size={14} /> Real-Time & Ledger-First Inventory Control
        </span>

        <h1 className="text-3xl md:text-5xl font-extrabold text-[#17201A] tracking-tight leading-tight">
          Replace Manual Registers & Excel Sheets with <span className="text-[#2F6B45]">StockSense</span>
        </h1>

        <p className="text-sm md:text-base text-[#677269] max-w-2xl mx-auto leading-relaxed">
          A modern, auditable inventory management platform for real-time stock balances, multi-warehouse transfers, low-stock warnings, and traceable movement history.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            href="/login"
            className="px-6 py-3 bg-[#2F6B45] hover:bg-[#255738] text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-md"
          >
            Launch Live Demo
            <ArrowRight size={16} />
          </Link>
          <Link
            href="#features"
            className="px-6 py-3 bg-white hover:bg-[#F1F7F2] border border-[#DDE4DC] text-[#17201A] font-semibold rounded-xl text-xs transition-all shadow-xs"
          >
            Explore Features
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-6 py-16 bg-white border-y border-[#DDE4DC]">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-[#17201A]">Built for Operational Accuracy</h2>
            <p className="text-xs text-[#677269]">Every validated transaction immediately creates an immutable ledger entry</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 bg-[#F7F8F3] border border-[#DDE4DC] rounded-xl space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[#E7F2E9] text-[#2F6B45] flex items-center justify-center">
                <Boxes size={20} />
              </div>
              <h3 className="font-bold text-sm text-[#17201A]">Multi-Location Stock</h3>
              <p className="text-xs text-[#677269] leading-relaxed">
                Track products across warehouses, aisles, racks, and shelf locations with instant balance updates.
              </p>
            </div>

            <div className="p-5 bg-[#F7F8F3] border border-[#DDE4DC] rounded-xl space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[#E7F2E9] text-[#2F6B45] flex items-center justify-center">
                <History size={20} />
              </div>
              <h3 className="font-bold text-sm text-[#17201A]">Immutable Stock Ledger</h3>
              <p className="text-xs text-[#677269] leading-relaxed">
                Complete movement audit history for receipts, deliveries, transfers, and physical count adjustments.
              </p>
            </div>

            <div className="p-5 bg-[#F7F8F3] border border-[#DDE4DC] rounded-xl space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[#E7F2E9] text-[#2F6B45] flex items-center justify-center">
                <Bell size={20} />
              </div>
              <h3 className="font-bold text-sm text-[#17201A]">Automated Reorder Alerts</h3>
              <p className="text-xs text-[#677269] leading-relaxed">
                Transparent rule-based warnings for low stock levels and dynamic suggested replenishment order quantities.
              </p>
            </div>

            <div className="p-5 bg-[#F7F8F3] border border-[#DDE4DC] rounded-xl space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[#E7F2E9] text-[#2F6B45] flex items-center justify-center">
                <ShieldCheck size={20} />
              </div>
              <h3 className="font-bold text-sm text-[#17201A]">Negative Stock Guards</h3>
              <p className="text-xs text-[#677269] leading-relaxed">
                Strict database transaction validation prevents overselling or unauthorized negative inventory states.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="px-6 py-16 max-w-4xl mx-auto space-y-6">
        <div className="bg-[#173C28] text-white p-8 md:p-12 rounded-2xl shadow-sm space-y-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#3D8A56]">About StockSense</span>
          <h2 className="text-2xl font-bold leading-snug">
            Designed for Warehouse Clarity, Not Unnecessary ERP Complexity
          </h2>
          <p className="text-xs md:text-sm text-[#E7F2E9] leading-relaxed">
            StockSense eliminates fragmented spreadsheets and paper registers. Built with a ledger-first architecture, every receipt, delivery, internal transfer, and count adjustment updates inventory balance tables within atomic database transactions.
          </p>
          <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold text-[#E7F2E9]">
            <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-[#3D8A56]" /> 100% Database Driven</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-[#3D8A56]" /> Role-Based Security</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-[#3D8A56]" /> Complete Audit Log</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-[#DDE4DC] px-6 py-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#677269]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#2F6B45] text-white flex items-center justify-center font-bold text-xs">
              S
            </div>
            <span className="font-bold text-[#17201A]">StockSense</span>
            <span>&copy; 2026 Production Inventory System. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6 font-medium">
            <Link href="/login" className="hover:text-[#2F6B45]">Sign In</Link>
            <Link href="/signup" className="hover:text-[#2F6B45]">Sign Up</Link>
            <Link href="/landing#features" className="hover:text-[#2F6B45]">Features</Link>
            <Link href="/landing#about" className="hover:text-[#2F6B45]">About</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

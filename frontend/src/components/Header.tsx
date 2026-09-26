"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Bell, Warehouse, User, X } from "lucide-react";
import { apiRequest, getCurrentUser } from "@/lib/api";

interface HeaderProps {
  title: string;
  description?: string;
  selectedWarehouseId?: string;
  onWarehouseChange?: (id: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  description,
  selectedWarehouseId,
  onWarehouseChange,
}) => {
  const router = useRouter();
  const user = getCurrentUser();
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [activeAlertsCount, setActiveAlertsCount] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load warehouses for selector
    apiRequest("/warehouses")
      .then((data) => setWarehouses(data))
      .catch(() => {});

    // Load active alerts count
    apiRequest("/alerts?status=ACTIVE")
      .then((data) => setActiveAlertsCount(data.length))
      .catch(() => {});
  }, []);

  // Global search handler
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const timer = setTimeout(() => {
      setSearching(true);
      apiRequest(`/search?q=${encodeURIComponent(searchQuery)}`)
        .then((data) => {
          setSearchResults(data);
          setShowResults(true);
        })
        .catch(() => {})
        .finally(() => setSearching(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close search popup on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="bg-white border-b border-[#DDE4DC] sticky top-0 z-30 px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Title section */}
      <div>
        <h1 className="text-xl font-bold text-[#17201A]">{title}</h1>
        {description && <p className="text-xs text-[#677269] mt-0.5">{description}</p>}
      </div>

      {/* Control Actions & Global Search */}
      <div className="flex items-center gap-3">
        {/* Global Search Bar */}
        <div className="relative" ref={searchRef}>
          <div className="relative flex items-center">
            <Search size={16} className="absolute left-3 text-[#8B958D]" />
            <input
              type="text"
              placeholder="Search SKU, Product, Ref No..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim() && setShowResults(true)}
              className="pl-9 pr-8 py-1.5 bg-[#F7F8F3] border border-[#DDE4DC] rounded-lg text-xs w-64 focus:outline-none focus:border-[#2F6B45] text-[#17201A]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 text-[#8B958D] hover:text-[#17201A]"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Search Dropdown Popup */}
          {showResults && (
            <div className="absolute right-0 top-full mt-1.5 w-80 bg-white border border-[#DDE4DC] rounded-lg shadow-lg z-50 overflow-hidden text-xs max-h-80 overflow-y-auto">
              {searching ? (
                <div className="p-3 text-center text-[#677269]">Searching...</div>
              ) : searchResults.length === 0 ? (
                <div className="p-3 text-center text-[#677269]">No matching results found</div>
              ) : (
                <div className="divide-y divide-[#DDE4DC]">
                  {searchResults.map((res, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setShowResults(false);
                        setSearchQuery("");
                        router.push(res.link);
                      }}
                      className="w-full text-left p-2.5 hover:bg-[#F1F7F2] flex items-center justify-between transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-[#17201A]">{res.title}</p>
                        <p className="text-[11px] text-[#677269]">{res.subtitle}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-[#E7F2E9] text-[#2F6B45] font-medium text-[10px]">
                        {res.type}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Warehouse Filter Selector */}
        {onWarehouseChange && (
          <div className="flex items-center gap-1.5 bg-[#F7F8F3] border border-[#DDE4DC] rounded-lg px-2.5 py-1 text-xs">
            <Warehouse size={14} className="text-[#677269]" />
            <select
              value={selectedWarehouseId || ""}
              onChange={(e) => onWarehouseChange(e.target.value)}
              className="bg-transparent border-none focus:outline-none text-[#17201A] font-medium text-xs cursor-pointer"
            >
              <option value="">All Warehouses</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Alert Notification Button */}
        <Link
          href="/alerts"
          className="relative p-2 rounded-lg bg-[#F7F8F3] border border-[#DDE4DC] text-[#677269] hover:text-[#17201A] transition-colors"
          title="View Alerts"
        >
          <Bell size={18} />
          {activeAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#C44747] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {activeAlertsCount}
            </span>
          )}
        </Link>

        {/* User Profile Quick Avatar */}
        <Link
          href="/profile"
          className="flex items-center gap-2 pl-2 border-l border-[#DDE4DC]"
        >
          <div className="w-8 h-8 rounded-full bg-[#2F6B45] text-white font-bold text-xs flex items-center justify-center">
            {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
        </Link>
      </div>
    </header>
  );
};

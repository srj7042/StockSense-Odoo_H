"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PlayCircle, CheckCircle2, ChevronRight, X } from "lucide-react";

export const DemoFlowBanner: React.FC = () => {
  const [closed, setClosed] = useState(false);

  if (closed) return null;

  return (
    <div className="bg-[#173C28] text-white px-4 py-2.5 rounded-lg shadow-sm mb-6 text-xs flex flex-wrap items-center justify-between gap-3 border border-[#2F6B45]">
      <div className="flex items-center gap-2 font-medium">
        <PlayCircle size={16} className="text-[#3D8A56] flex-shrink-0" />
        <span className="font-semibold text-white">Hackathon Demo Flow:</span>
        <span className="text-[#E7F2E9]">
          1. Receive 50 &rarr; 2. Transfer 10 &rarr; 3. Deliver 4 &rarr; 4. Adjust -2 &rarr; 5. Verify Ledger
        </span>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/operations/receipts"
          className="bg-[#2F6B45] hover:bg-[#255738] text-white font-semibold px-2.5 py-1 rounded transition-colors inline-flex items-center gap-1"
        >
          Start Step 1: Receive 50
          <ChevronRight size={14} />
        </Link>
        <button
          onClick={() => setClosed(true)}
          className="text-[#8B958D] hover:text-white p-0.5"
          title="Dismiss"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

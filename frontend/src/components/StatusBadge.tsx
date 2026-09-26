import React from "react";

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let bg = "bg-gray-100 text-gray-700 border-gray-300";

  switch (status.toUpperCase()) {
    case "POSTED":
    case "RESOLVED":
    case "OK":
    case "ACTIVE":
      bg = "bg-[#E7F2E9] text-[#2F6B45] border-[#B8DBC0]";
      break;
    case "DRAFT":
      bg = "bg-amber-50 text-amber-700 border-amber-200";
      break;
    case "CANCELLED":
    case "DISMISSED":
      bg = "bg-gray-100 text-gray-500 border-gray-200";
      break;
    case "LOW":
    case "LOW_STOCK":
    case "MEDIUM":
    case "REORDER_REQUIRED":
      bg = "bg-amber-100 text-amber-800 border-amber-300";
      break;
    case "OUT_OF_STOCK":
    case "HIGH":
    case "CRITICAL":
      bg = "bg-red-100 text-red-700 border-red-200";
      break;
    case "RECEIPT_IN":
    case "TRANSFER_IN":
    case "ADJUSTMENT_IN":
    case "INITIAL_STOCK":
      bg = "bg-[#E7F2E9] text-[#2F6B45] border-[#B8DBC0]";
      break;
    case "DELIVERY_OUT":
    case "TRANSFER_OUT":
    case "ADJUSTMENT_OUT":
      bg = "bg-rose-50 text-rose-700 border-rose-200";
      break;
  }

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border inline-flex items-center gap-1 ${bg}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
};

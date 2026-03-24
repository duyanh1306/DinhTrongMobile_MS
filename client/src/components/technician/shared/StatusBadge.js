import React from "react";
import { Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

const StatusBadge = ({ status, showIcon = true, showText = true }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "Pending": return "bg-yellow-100 text-yellow-800";
      case "In Progress": return "bg-blue-100 text-blue-800";
      case "Completed": return "bg-green-100 text-green-800";
      case "Cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Pending": return <Clock className="w-4 h-4" />;
      case "In Progress": return <AlertCircle className="w-4 h-4" />;
      case "Completed": return <CheckCircle className="w-4 h-4" />;
      case "Cancelled": return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "Pending": return "Chờ xử lý";
      case "In Progress": return "Đang xử lý";
      case "Completed": return "Hoàn thành";
      case "Cancelled": return "Đã hủy";
      default: return status;
    }
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(status)}`}>
      {showIcon && getStatusIcon(status)}
      {showText && getStatusText(status)}
    </span>
  );
};

export default StatusBadge;

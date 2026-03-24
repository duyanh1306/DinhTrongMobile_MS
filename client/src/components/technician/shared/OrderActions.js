import React from "react";
import { Eye, Play, Ban } from "lucide-react";

const OrderActions = ({ order, onViewDetails, onAccept, onCancel }) => {
  return (
    <div className="flex gap-2">
      <button 
        onClick={() => onViewDetails(order)} 
        className="text-blue-600 bg-blue-50 p-2 rounded-lg hover:bg-blue-100" 
        title="Chi tiết"
      >
        <Eye size={18} />
      </button>
      {order.status === "Pending" && (
        <button 
          onClick={() => onAccept(order._id)} 
          className="text-green-600 bg-green-50 p-2 rounded-lg hover:bg-green-100" 
          title="Chấp nhận"
        >
          <Play size={18} />
        </button>
      )}
      {(order.status === "Pending" || order.status === "In Progress") && (
        <button 
          onClick={() => onCancel(order._id)} 
          className="text-red-600 bg-red-50 p-2 rounded-lg hover:bg-red-100" 
          title="Hủy bỏ"
        >
          <Ban size={18} />
        </button>
      )}
    </div>
  );
};

export default OrderActions;

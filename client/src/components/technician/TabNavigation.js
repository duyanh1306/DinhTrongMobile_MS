import React from "react";

const TabNavigation = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: "TRADE_IN", label: "Định giá thu mua", color: "purple" },
    { id: "WAITING_DECISION", label: "Chờ xử lý (Nhập kho)", color: "orange" },
    { id: "REPAIR", label: "Khách chờ sửa chữa", color: "blue" }
  ];

  const getTabClasses = (tabId, color) => {
    const isActive = activeTab === tabId;
    return `pb-2 px-2 text-lg font-bold transition-all border-b-4 ${
      isActive 
        ? `border-${color}-600 text-${color}-600` 
        : "border-transparent text-gray-500 hover:text-gray-700"
    }`;
  };

  return (
    <div className="flex gap-4">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={getTabClasses(tab.id, tab.color)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default TabNavigation;

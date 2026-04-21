export default function TabNavigation({ activeTab, onTabChange, counts }) {
  const tabs = [
    { id: "TRADE_IN", label: "Định giá thu cũ" },
    { id: "WAITING_DECISION", label: "Chờ quyết định" },
    { id: "REPAIR", label: "Sửa chữa" },
  ];

  return (
    <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-md font-bold text-sm transition-all ${
            activeTab === tab.id
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
          }`}
        >
          {tab.label}
          {counts && counts[tab.id] > 0 && (
            <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">
              {counts[tab.id]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
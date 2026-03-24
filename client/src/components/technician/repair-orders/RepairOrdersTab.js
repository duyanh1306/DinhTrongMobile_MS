import React from "react";
import FilterPanel from "./FilterPanel";
import RepairOrdersTable from "./RepairOrdersTable";
import RepairDetailsModal from "./RepairDetailsModal";

const RepairOrdersTab = ({ 
  filteredOrders, 
  filters, 
  stores, 
  filterLoading, 
  selectedOrder, 
  orderDetails, 
  showDetailsModal,
  onFilterChange, 
  onApplyFilters, 
  onResetFilters, 
  onViewDetails, 
  onAccept, 
  onCancel,
  onCloseDetailsModal
}) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <FilterPanel 
        filters={filters}
        stores={stores}
        filterLoading={filterLoading}
        onFilterChange={onFilterChange}
        onApplyFilters={onApplyFilters}
        onResetFilters={onResetFilters}
      />

      <RepairOrdersTable 
        filteredOrders={filteredOrders}
        filterLoading={filterLoading}
        onViewDetails={onViewDetails}
        onAccept={onAccept}
        onCancel={onCancel}
      />

      <RepairDetailsModal 
        selectedOrder={selectedOrder}
        orderDetails={orderDetails}
        showDetailsModal={showDetailsModal}
        onClose={onCloseDetailsModal}
      />
    </div>
  );
};

export default RepairOrdersTab;

import { useEffect, useState } from "react";
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
  onComplete,
  onCloseDetailsModal,
  onOrderUpdate
}) => {

  useEffect(() => {
    if (showDetailsModal && selectedOrder) {
        onOrderUpdate();
    }
  }, [showDetailsModal, selectedOrder]);

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
        onComplete={onComplete}
      />

      <RepairDetailsModal
        key={`modal-${selectedOrder?._id}-${orderDetails?.length || 0}`}
        selectedOrder={selectedOrder}
        orderDetails={orderDetails}
        showDetailsModal={showDetailsModal}
        onClose={onCloseDetailsModal}
        onOrderUpdate={onOrderUpdate}
        onAccept={onAccept}
        onCancel={onCancel}
        onComplete={onComplete}
      />
    </div>
  );
};

export default RepairOrdersTab;

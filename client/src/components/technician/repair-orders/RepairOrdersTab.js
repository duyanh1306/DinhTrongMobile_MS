import RepairOrdersTable from "./RepairOrdersTable";
import RepairDetailsModal from "./RepairDetailsModal";

const RepairOrdersTab = ({ 
  filteredOrders, 
  filterLoading, 
  selectedOrder, 
  orderDetails, 
  showDetailsModal,
  viewMode,
  onViewDetails, 
  onAccept, 
  onCancel,
  onComplete,
  onCloseDetailsModal,
  onOrderUpdate
}) => {

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      <RepairOrdersTable 
        filteredOrders={filteredOrders}
        filterLoading={filterLoading}
        viewMode={viewMode}
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

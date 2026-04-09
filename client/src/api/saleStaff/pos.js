import axiosClient from "../axiosClient";

export const fetchInventoryApi = async () => {
  try {
    const [phoneRes, itemRes] = await Promise.allSettled([
      axiosClient.get("/phones?status=in_stock"),
      axiosClient.get("/items?status=in_stock")
    ]);
    const phonesData = phoneRes.status === 'fulfilled' ? (phoneRes.value.data?.data || phoneRes.value.data || []) : [];
    const itemsData = itemRes.status === 'fulfilled' ? (itemRes.value.data?.data || itemRes.value.data || []) : [];
    return { phonesData, itemsData };
  } catch (error) {
    throw error;
  }
};

export const createPurchaseOrderApi = async (payload) => {
  const res = await axiosClient.post("/purchase-orders", payload);
  return res.data;
};

export const confirmOrderPaymentApi = async (orderId) => {
  const res = await axiosClient.patch(`/purchase-orders/${orderId}/confirm-payment`);
  return res.data;
};

export const fetchWarrantyInvoicesApi = async () => {
  const [offlineRes, onlineRes, repairRes] = await Promise.allSettled([
    axiosClient.get("/purchase-orders?orderType=SALE&status=Completed"),
    axiosClient.get("/orders/all"),
    axiosClient.get("/repair-orders?status=Completed")
  ]);
  
  return {
    offlineSales: offlineRes.status === 'fulfilled' ? (offlineRes.value.data?.data || offlineRes.value.data || []) : [],
    onlineSales: onlineRes.status === 'fulfilled' ? (onlineRes.value.data?.data || onlineRes.value.data || []) : [],
    repairSales: repairRes.status === 'fulfilled' ? (repairRes.value.data?.data || repairRes.value.data || []) : []
  };
};

export const fetchOfflineDetailsApi = async (id) => {
  const res = await axiosClient.get(`/purchase-orders/${id}/details`);
  return res.data?.data || res.data || [];
};

export const fetchOnlineDetailsApi = async (id) => {
  const res = await axiosClient.get(`/orders/${id}`);
  return res.data?.data || res.data || {};
};

export const fetchRepairDetailsApi = async (id) => {
  const res = await axiosClient.get(`/repair-orders/${id}/details`);
  return res.data?.data || res.data || [];
};

export const createWarrantyOrderApi = async (payload) => {
  return await axiosClient.post("/warranty/create", payload);
};
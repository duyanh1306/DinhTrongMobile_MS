export const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price || 0);
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getStatusColor = (status) => {
  switch (status) {
    case 'Pending':
      return 'border-l-yellow-500';
    case 'In Progress':
      return 'border-l-blue-500';
    case 'Completed':
      return 'border-l-green-500';
    case 'Cancelled':
      return 'border-l-red-500';
    default:
      return 'border-l-gray-500';
  }
};

export const getStatusBadge = (status) => {
  switch (status) {
    case 'Pending':
      return 'bg-yellow-100 text-yellow-700';
    case 'In Progress':
      return 'bg-blue-100 text-blue-700';
    case 'Completed':
      return 'bg-green-100 text-green-700';
    case 'Cancelled':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

export const getStatusText = (status) => {
  switch (status) {
    case 'Pending':
      return 'Chờ xử lý';
    case 'In Progress':
      return 'Đang xử lý';
    case 'Completed':
      return 'Đã hoàn thành';
    case 'Cancelled':
      return 'Đã hủy';
    default:
      return status;
  }
};

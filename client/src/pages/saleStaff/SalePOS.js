import { useState, useEffect, useRef } from "react";
import { ShoppingCart, User, Smartphone, Package, Trash2, Save, Settings, Send, ScanLine, Printer, X, CheckCircle, XCircle, ShieldCheck, Search, AlertTriangle, FileText, CheckSquare, Hammer, MonitorSmartphone, Download } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useReactToPrint } from "react-to-print";
import dayjs from "dayjs";
import axiosClient from "../../api/axiosClient";
import html2pdf from "html2pdf.js"; // <--- THÊM IMPORT NÀY

// Hàm hỗ trợ đọc số tiền thành chữ
const docSoThanhChu = (so) => {
  if (!so || so === 0) return "Không đồng";
  const chuSo = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
  const hang = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"];
  let str = so.toString();
  let result = "";
  let hangCount = 0;

  while (str.length > 0) {
    let chunk = str.slice(-3);
    str = str.slice(0, -3);
    if (parseInt(chunk) !== 0) {
      let chunkStr = "";
      for (let i = 0; i < chunk.length; i++) {
        let digit = parseInt(chunk[chunk.length - 1 - i]);
        if (i === 0) chunkStr = chuSo[digit] + " " + chunkStr;
        if (i === 1) chunkStr = chuSo[digit] + " mươi " + chunkStr;
        if (i === 2) chunkStr = chuSo[digit] + " trăm " + chunkStr;
      }
      chunkStr = chunkStr.replace("không mươi", "lẻ");
      chunkStr = chunkStr.replace("một mươi", "mười");
      chunkStr = chunkStr.replace("mươi năm", "mươi lăm");
      chunkStr = chunkStr.replace("mười năm", "mười lăm");
      chunkStr = chunkStr.replace("mươi một", "mươi mốt");
      
      result = chunkStr.trim() + " " + hang[hangCount] + " " + result;
    }
    hangCount++;
  }
  
  result = result.replace(/không trăm lẻ không/g, "");
  result = result.replace(/không trăm lẻ/g, "lẻ");
  result = result.trim() + " đồng";
  return result.charAt(0).toUpperCase() + result.slice(1);
};

// ==================================================================
// COMPONENT: HÓA ĐƠN KHỔ A4 (PHIẾU XUẤT KHO KIÊM BẢO HÀNH)
// ==================================================================
const InvoicePrint = ({ order, details, formatCurrency, contentRef, activeTab }) => {
  let invoiceTitle = "PHIẾU XUẤT KHO KIÊM BẢO HÀNH";
  if (activeTab === "PURCHASE") invoiceTitle = "PHIẾU BIÊN NHẬN THU MUA MÁY CŨ";
  if (activeTab === "REPAIR") invoiceTitle = "PHIẾU THANH TOÁN KIÊM BẢO HÀNH SỬA CHỮA";

  return (
    <div ref={contentRef} className="bg-white text-black p-10" style={{ width: "210mm", minHeight: "297mm", fontFamily: "'Times New Roman', Times, serif", margin: "0 auto" }}>
      <style type="text/css" media="print">{`@page { size: A4 portrait; margin: 10mm; }`}</style>

      <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4 mb-6">
        <div>
            <h1 className="text-xl font-black uppercase tracking-wide">CÔNG TY TNHH DINH TRONG MOBILE</h1>
            <p className="text-sm mt-1"><strong>Showroom:</strong> {order?.storeId?.address || "Hà Nội"}</p>
            <p className="text-sm"><strong>Điện thoại:</strong> {order?.storeId?.hotline || "0987.654.321"}</p>
            <p className="text-sm"><strong>Website:</strong> dinhtrongmobile.vn | <strong>Email:</strong> cskh@dinhtrongmobile.vn</p>
        </div>
        <div className="text-right">
            <div className="w-20 h-20 border-2 border-dashed border-gray-400 flex items-center justify-center text-xs text-gray-500 mb-1">QR CODE</div>
            <p className="text-[10px] italic">Quét để tra cứu bảo hành</p>
        </div>
      </div>

      <div className="text-center mb-8">
        <h2 className="text-2xl font-black uppercase">{invoiceTitle}</h2>
        <p className="text-sm italic mt-1">Ngày {dayjs(order?.createdAt || order?.repairOrderDate || new Date()).format('DD')} tháng {dayjs(order?.createdAt || order?.repairOrderDate || new Date()).format('MM')} năm {dayjs(order?.createdAt || order?.repairOrderDate || new Date()).format('YYYY')}</p>
        <p className="text-sm font-bold mt-1">Số: #{order?._id?.substring(order._id.length - 8).toUpperCase()}</p>
      </div>

      <div className="mb-6 text-sm space-y-2">
        <p><strong>Tên khách hàng:</strong> {order?.customerName}</p>
        <p><strong>Điện thoại:</strong> {order?.customerPhone || "..........................................................."}</p>
        <p><strong>Nhân viên phục vụ:</strong> {order?.createdBy?.fullName || order?.createdBy?.userName || "N/A"}</p>
      </div>

      <table className="w-full border-collapse border border-gray-800 mb-4 text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-800 p-2 text-center w-12">STT</th>
            <th className="border border-gray-800 p-2 text-left">Tên hàng hóa / Dịch vụ</th>
            <th className="border border-gray-800 p-2 text-center w-16">SL</th>
            <th className="border border-gray-800 p-2 text-center">Số Serial / IMEI</th>
            <th className="border border-gray-800 p-2 text-center w-32">Bảo hành</th>
            <th className="border border-gray-800 p-2 text-right w-32">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          {details.map((d, idx) => {
            let itemName = "Sản phẩm/Dịch vụ";
            let serial = "";
            let warrantyText = "Không";
            let price = d.purchasePrice || d.price || 0;

            if (activeTab === "REPAIR") {
                itemName = d.serviceId?.name || "Dịch vụ sửa chữa";
                if(d.itemIds && d.itemIds.length > 0) {
                    itemName += ` (Thay: ${d.itemIds.map(i => i.name).join(", ")})`;
                    serial = d.itemIds.map(i => i.serialCode).join(", ");
                }
                price = d.serviceId?.price || 0;
            } else {
                itemName = d.phoneId?.phoneModelId?.name || d.itemId?.item_type?.name || d.name || "Sản phẩm";
                serial = d.phoneId ? d.phoneId.imei || d.phoneId.serialCode || d.phoneId._id?.substring(d.phoneId._id.length - 6).toUpperCase() : (d.itemId?.serialCode || d.identifier || "");
                if (d.warrantyExpireDate) {
                    warrantyText = `Đến ${dayjs(d.warrantyExpireDate).format('DD/MM/YYYY')}`;
                } else if (d.warranty || d.phoneId?.warrantyPeriod) {
                    warrantyText = `${d.phoneId?.warrantyPeriod || 0} tháng`;
                }
            }

            return (
              <tr key={idx}>
                <td className="border border-gray-800 p-2 text-center">{idx + 1}</td>
                <td className="border border-gray-800 p-2 font-medium">{itemName}</td>
                <td className="border border-gray-800 p-2 text-center">1</td>
                <td className="border border-gray-800 p-2 text-center font-mono text-xs">{serial || "-"}</td>
                <td className="border border-gray-800 p-2 text-center text-xs">{warrantyText}</td>
                <td className="border border-gray-800 p-2 text-right font-bold">{formatCurrency(price)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="flex justify-end mb-6">
        <div className="w-1/2 text-right">
            <div className="text-lg mb-1">
                <strong>Tổng cộng:</strong> <span className="text-xl font-black">{formatCurrency(order?.totalPrice)}</span>
            </div>
            <div className="text-sm italic text-gray-700">
                (Bằng chữ: {docSoThanhChu(order?.totalPrice || 0)})
            </div>
        </div>
      </div>

      <div className="text-[11px] mb-10 leading-relaxed text-gray-700">
        <p className="font-bold underline text-black mb-1">Lưu ý / Quy định bảo hành:</p>
        <p>- Quý khách vui lòng kiểm tra kỹ sản phẩm, hình thức, phụ kiện đi kèm trước khi rời khỏi cửa hàng.</p>
        <p>- Cửa hàng không bảo hành đối với các trường hợp: Rơi vỡ, cấn móp, vào nước, chập cháy, mất Tem bảo hành.</p>
        <p>- Đối với máy cũ, hỗ trợ 1 đổi 1 trong 30 ngày đầu nếu phát sinh lỗi từ Nhà sản xuất (Mainboard, Nguồn).</p>
        <p>- Quý khách vui lòng giữ lại phiếu này để thuận tiện cho việc tra cứu và hỗ trợ bảo hành.</p>
      </div>

      <div className="flex justify-between text-center text-sm font-bold pt-8">
        <div className="w-1/3"><p>Người Mua Hàng</p><p className="font-normal italic text-xs text-gray-500 mt-1">(Ký, ghi rõ họ tên)</p></div>
        <div className="w-1/3"><p>Người Giao Hàng</p><p className="font-normal italic text-xs text-gray-500 mt-1">(Ký, ghi rõ họ tên)</p></div>
        <div className="w-1/3"><p>Thủ Kho / Kế Toán</p><p className="font-normal italic text-xs text-gray-500 mt-1">(Ký, ghi rõ họ tên)</p></div>
      </div>
    </div>
  );
};


export default function SalePOS() {
  const [orderType, setOrderType] = useState("SALE");
  const [customer, setCustomer] = useState({ name: "", phone: "" });
  const [inventory, setInventory] = useState([]);
  const [cart, setCart] = useState([]);
  
  // State Quét mã (Bán hàng)
  const [scanInput, setScanInput] = useState("");
  const scanInputRef = useRef(null);

  // States Hóa Đơn Mới Tạo (Bán hàng)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState([]);
  const printRef = useRef(null);

  const [tradeInRequest, setTradeInRequest] = useState({ note: "" });

  // =========================================================
  // STATES DÀNH RIÊNG CHO BẢO HÀNH (WARRANTY)
  // =========================================================
  const [warrantySearchType, setWarrantySearchType] = useState("PHONE"); 
  const [warrantySearchInput, setWarrantySearchInput] = useState("");
  const [warrantySearchResults, setWarrantySearchResults] = useState([]);
  const [selectedWarrantyInvoice, setSelectedWarrantyInvoice] = useState(null);
  const [selectedWarrantyItem, setSelectedWarrantyItem] = useState(null); 
  const [isWarrantyModalOpen, setIsWarrantyModalOpen] = useState(false);
  const [warrantyIssue, setWarrantyIssue] = useState("");
  const [isStampIntact, setIsStampIntact] = useState(false); 

  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;

  useEffect(() => {
    if (orderType === "SALE" && scanInputRef.current && !isModalOpen) {
      scanInputRef.current.focus();
    }
  }, [orderType, isModalOpen]);

  useEffect(() => {
    if (orderType === "SALE") fetchInventory();
    setCart([]);
    setScanInput("");
    setWarrantySearchInput("");
    setWarrantySearchResults([]);
    setSelectedWarrantyInvoice(null);
  }, [orderType]);

  const fetchInventory = async () => {
    try {
      const token = localStorage.getItem("token");
      const [phoneRes, itemRes] = await Promise.allSettled([
        fetch(`http://localhost:9999/api/phones?status=in_stock`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`http://localhost:9999/api/items?status=in_stock`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      let phonesData = phoneRes.status === 'fulfilled' && phoneRes.value.ok ? await phoneRes.value.json() : [];
      let itemsData = itemRes.status === 'fulfilled' && itemRes.value.ok ? await itemRes.value.json() : [];
      
      const formattedPhones = (Array.isArray(phonesData) ? phonesData : phonesData.data || []).map(p => ({ 
        ...p, isPhone: true, displayPrice: p.sellingPrice, displayName: p.phoneModelId?.name, identifier: p.serialCode 
      }));
      const formattedItems = (Array.isArray(itemsData) ? itemsData : itemsData.data || []).map(i => ({ 
        ...i, isPhone: false, displayPrice: i.price, displayName: i.name || i.item_type?.name, identifier: i.serialCode
      }));
      setInventory([...formattedPhones, ...formattedItems]);
    } catch (err) { toast.error("Lỗi kết nối kho"); }
  };

  const handleScan = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const code = scanInput.trim().toUpperCase();
      if (!code) return;
      
      const foundProduct = inventory.find(item => item.identifier && item.identifier.toUpperCase() === code);
      if (foundProduct) {
        if (cart.find((c) => c._id === foundProduct._id)) toast.warning("Sản phẩm này đã có trong giỏ!");
        else addToCart(foundProduct);
      } else {
        toast.error(`Không tìm thấy sản phẩm có Serial Code: ${code} (Hoặc không sẵn sàng bán)`);
      }
      setScanInput("");
    }
  };

  const addToCart = (product) => {
    setCart([...cart, { 
        ...product, phoneId: product.isPhone ? product._id : null, itemId: !product.isPhone ? product._id : null, 
        price: product.displayPrice, name: product.displayName, identifier: product.identifier 
    }]);
    toast.success("Đã thêm vào giỏ!");
  };

  const removeFromCart = (indexToRemove) => setCart(cart.filter((_, index) => index !== indexToRemove));
  const calculateTotal = () => cart.reduce((sum, item) => sum + (item.price || 0), 0);

  const validateCustomer = () => {
    if (!customer.name.trim()) return toast.error("Vui lòng nhập tên khách hàng!"), false;
    if (!/(0[3|5|7|8|9])+([0-9]{8})\b/.test(customer.phone)) return toast.error("Số điện thoại không hợp lệ!"), false;
    return true;
  };

  const handleSaleSubmit = () => {
    if (!validateCustomer() || cart.length === 0) return toast.error("Kiểm tra lại thông tin khách và giỏ hàng!");
    if (!user || !user.storeId) return toast.error("Vui lòng đăng nhập lại (Chưa có storeId)!");

    const previewOrder = {
      _id: "CHƯA TẠO", customerName: customer.name, customerPhone: customer.phone,
      totalPrice: calculateTotal(), createdBy: user, createdAt: new Date().toISOString(), status: "Pending"
    };
    setSelectedOrder(previewOrder);
    setOrderDetails(cart); 
    setIsModalOpen(true); 
  };

  const handleConfirmPayment = async () => {
    if (!window.confirm("Xác nhận đã nhận đủ tiền từ khách và tạo hóa đơn?")) return;
    
    const currentStoreId = user.storeId?._id || user.storeId;
    const token = localStorage.getItem("token");
    
    const payload = {
      storeId: currentStoreId, customerName: customer.name, customerPhone: customer.phone,
      totalPrice: calculateTotal(), createdBy: user._id, orderType: "SALE", status: "Pending", 
      details: cart.map((item) => ({ phoneId: item.phoneId, itemId: item.itemId, price: item.price }))
    };

    try {
      const res = await fetch("http://localhost:9999/api/purchase-orders", {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }, body: JSON.stringify(payload)
      });
      const result = await res.json();
      
      if (res.ok) { 
        const newOrder = result.data;
        newOrder.createdBy = user; 
        await fetch(`http://localhost:9999/api/purchase-orders/${newOrder._id}/confirm-payment`, { method: "PATCH" });

        toast.success("Thanh toán thành công! Đã xuất kho.");
        setSelectedOrder({...newOrder, status: "Completed"});
        setTimeout(() => handlePrint(), 500); 

        setCart([]); setCustomer({name:"", phone:""}); fetchInventory(); 
      } else {
        toast.error(result.message || "Tạo đơn thất bại");
      }
    } catch (err) { toast.error("Lỗi kết nối"); }
  };

  const handleSendToTech = async () => {
    if (!validateCustomer()) return;
    if (!user || !user.storeId) return toast.error("Tài khoản chưa thuộc cửa hàng nào!");

    const token = localStorage.getItem("token");
    const payload = {
      storeId: user.storeId._id || user.storeId, customerName: customer.name, customerPhone: customer.phone,
      totalPrice: 0, createdBy: user._id, orderType: "PURCHASE", status: "Pending_Tech", note: tradeInRequest.note, details: []
    };

    try {
      const res = await fetch("http://localhost:9999/api/purchase-orders", { 
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }, body: JSON.stringify(payload)
      });
      if (res.ok) {
        toast.success(`Đã chuyển yêu cầu thu máy sang bộ phận Kỹ Thuật!`);
        setCustomer({name:"", phone:""}); setTradeInRequest({note: ""});
      } else {
        toast.error("Tạo yêu cầu thất bại");
      }
    } catch (err) { toast.error("Lỗi kết nối"); }
  };

  const handleSearchWarranty = async () => {
    if (!warrantySearchInput.trim()) return toast.warning("Vui lòng nhập thông tin tìm kiếm!");
    setSelectedWarrantyInvoice(null);
    setWarrantySearchResults([]);
    
    try {
      const query = warrantySearchInput.trim().toLowerCase().replace('#', '');

      const [offlineRes, onlineRes, repairRes] = await Promise.allSettled([
        axiosClient.get(`/purchase-orders?orderType=SALE&status=Completed`),
        axiosClient.get(`/orders/all`), 
        axiosClient.get(`/repair-orders?status=Completed`)
      ]);

      const offlineSales = offlineRes.status === 'fulfilled' ? (offlineRes.value.data?.data || offlineRes.value.data || []) : [];
      const onlineSales = onlineRes.status === 'fulfilled' ? (onlineRes.value.data?.data || onlineRes.value.data || []) : [];
      const repairSales = repairRes.status === 'fulfilled' ? (repairRes.value.data?.data || repairRes.value.data || []) : [];

      let allInvoices = [
        ...offlineSales.map(o => ({ 
            ...o, source: 'OFFLINE', displayId: String(o._id), displayName: o.customerName, displayPhone: o.customerPhone 
        })),
        ...onlineSales.map(o => ({ 
            ...o, source: 'ONLINE', 
            displayId: String(o.orderCode || o._id),
            displayName: o.shippingInfo?.fullName || o.customerName || "Khách Online", 
            displayPhone: o.shippingInfo?.phone || o.customerPhone || "" 
        })),
        ...repairSales.map(o => ({ 
            ...o, source: 'REPAIR', displayId: String(o._id), displayName: o.customerName, displayPhone: o.customerPhone 
        }))
      ];

      let filtered = [];
      if (warrantySearchType === "INVOICE") {
        filtered = allInvoices.filter(o => o.displayId.toLowerCase().includes(query));
      } else {
        filtered = allInvoices.filter(o => o.displayPhone && o.displayPhone.includes(query));
      }

      if (filtered.length === 0) {
        toast.error("Không tìm thấy lịch sử mua hàng phù hợp!");
      } else {
        filtered.sort((a, b) => new Date(b.createdAt || b.repairOrderDate) - new Date(a.createdAt || a.repairOrderDate));
        setWarrantySearchResults(filtered);
      }
    } catch (err) {
      toast.error("Lỗi khi tìm kiếm dữ liệu");
    }
  };

  const handleSelectInvoiceForWarranty = async (invoice) => {
    try {
        let warrantableItems = [];

        if (invoice.source === 'OFFLINE') {
            const res = await axiosClient.get(`/purchase-orders/${invoice._id}/details`);
            const details = res.data?.data || res.data || [];
            
            details.forEach(item => {
                if (item.phoneId) {
                    warrantableItems.push({
                        originalItem: item,
                        phoneId: item.phoneId._id || item.phoneId,
                        name: item.phoneId?.phoneModelId?.name || "Điện thoại",
                        serialCode: item.phoneId?.serialCode || item.phoneId?.imei,
                        color: item.phoneId?.colorName,
                        warrantyMonths: item.phoneId?.warrantyPeriod || 0,
                        purchaseDate: invoice.createdAt
                    });
                }
            });
        } 
        else if (invoice.source === 'ONLINE') {
            const res = await axiosClient.get(`/orders/${invoice._id}`);
            const orderDetail = res.data?.data || res.data || {};
            const items = orderDetail.items || invoice.items || [];

            if (items.length > 0) {
                items.forEach(item => {
                    if (item.phoneId || item.productType === 'PHONE') { 
                        warrantableItems.push({
                            originalItem: item,
                            phoneId: item.phoneId?._id || item.phoneId,
                            name: item.name || item.phoneId?.phoneModelId?.name || "Điện thoại (Online)",
                            serialCode: item.phoneId?.serialCode || item.phoneId?.imei || "Đang cập nhật...",
                            color: item.colorName || "-",
                            warrantyMonths: item.warrantyPeriod || item.phoneId?.warrantyPeriod || 12, 
                            purchaseDate: invoice.createdAt
                        });
                    }
                });
            }
        } 
        else if (invoice.source === 'REPAIR') {
            const res = await axiosClient.get(`/repair-orders/${invoice._id}/details`);
            const details = res.data?.data || res.data || [];
            
            details.forEach(detail => {
                if (detail.itemIds && detail.itemIds.length > 0) {
                    detail.itemIds.forEach(part => {
                        warrantableItems.push({
                            originalItem: part,
                            phoneId: detail.targetPhoneId?._id || detail.targetPhoneId || part._id, 
                            name: `Linh kiện thay: ${part.name || part.item_type?.name}`,
                            serialCode: part.serialCode || "N/A",
                            color: "-",
                            warrantyMonths: part.warrantyPeriod || 3, 
                            purchaseDate: invoice.createdAt || invoice.repairOrderDate
                        });
                    });
                }
            });
        }

        setSelectedWarrantyInvoice({ ...invoice, warrantableItems });
    } catch (error) {
        toast.error("Lỗi lấy thông tin chi tiết đơn hàng");
    }
  };
  
  const handleOpenWarrantyModal = (wItem) => {
    setSelectedWarrantyItem(wItem);
    setWarrantyIssue("");
    setIsStampIntact(false);
    setIsWarrantyModalOpen(true);
  };

  const handleSubmitWarranty = async () => {
    if (!warrantyIssue.trim()) return toast.warning("Vui lòng nhập tình trạng lỗi của máy!");
    if (!isStampIntact) return toast.error("Cần xác nhận tem bảo hành còn nguyên vẹn!");
    if (!user) return toast.error("Vui lòng đăng nhập lại");

    const currentStoreId = user.storeId?._id || user.storeId;
    
    const payload = {
        storeId: currentStoreId,
        customerName: selectedWarrantyInvoice.displayName,
        customerPhone: selectedWarrantyInvoice.displayPhone || "",
        phoneId: selectedWarrantyItem.phoneId,
        phoneModel: selectedWarrantyItem.name,
        serialCode: selectedWarrantyItem.serialCode,
        purchaseDate: selectedWarrantyItem.purchaseDate,
        issueDescription: warrantyIssue,
        createdBy: user._id
    };

    try {
        const res = await axiosClient.post("/warranty/create", payload);
        
        if (res.status === 201 || res.status === 200) {
            toast.success("Tạo yêu cầu bảo hành thành công! Vui lòng chuyển máy cho Kỹ thuật.");
            setIsWarrantyModalOpen(false);
            setSelectedWarrantyInvoice(null);
            setWarrantySearchResults([]);
            setWarrantySearchInput("");
        }
    } catch (error) {
        toast.error(error.response?.data?.message || "Lỗi hệ thống khi tạo đơn bảo hành");
    }
  };

  const handlePrint = useReactToPrint({ contentRef: printRef, documentTitle: `Bill_${selectedOrder?._id?.substring(0, 6) || "Moi"}` });
  const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

  // =========================================================
  // 🌟 HÀM XUẤT FILE PDF TỰ ĐỘNG KHÔNG CẦN QUA MÁY IN
  // =========================================================
  const handleDownloadPDF = () => {
      const element = printRef.current;
      const opt = {
          margin:       [10, 10, 10, 10], 
          filename:     `HoaDon_${selectedOrder?._id?.substring(selectedOrder._id.length - 6).toUpperCase() || 'Moi'}.pdf`,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true },
          jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      toast.info("Đang tạo file PDF, vui lòng đợi giây lát...", { autoClose: 2000 });
      html2pdf().set(opt).from(element).save().then(() => {
          toast.success("Tải file PDF thành công!");
      }).catch(err => {
          toast.error("Có lỗi khi tạo PDF!");
      });
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="flex h-screen bg-gray-100 p-4 gap-4 overflow-hidden">
        
        {/* =========================================================== */}
        {/* NỬA TRÁI: HIỂN THỊ MAIN CONTENT (SALE / PURCHASE / WARRANTY) */}
        {/* =========================================================== */}
        <div className={`bg-white rounded-xl shadow-sm flex flex-col overflow-hidden border transition-all duration-300 ${orderType === "WARRANTY" ? "w-full" : "w-2/3"}`}>
          
          {/* TOP BAR */}
          <div className="p-4 border-b flex justify-between items-center bg-gray-50 flex-shrink-0">
            <h2 className="font-bold text-gray-800 flex items-center gap-2"><Settings size={20} /> Điểm bán hàng (POS)</h2>
            <div className="flex bg-white rounded-lg p-1 border shadow-sm">
              <button onClick={() => setOrderType("SALE")} className={`px-4 lg:px-6 py-2 rounded-md font-bold transition-all text-sm lg:text-base ${orderType === "SALE" ? "bg-orange-600 text-white shadow-md" : "text-gray-500 hover:bg-gray-100"}`}>BÁN RA</button>
              <button onClick={() => setOrderType("PURCHASE")} className={`px-4 lg:px-6 py-2 rounded-md font-bold transition-all text-sm lg:text-base ${orderType === "PURCHASE" ? "bg-purple-600 text-white shadow-md" : "text-gray-500 hover:bg-gray-100"}`}>THU CŨ / MUA VÀO</button>
              <button onClick={() => setOrderType("WARRANTY")} className={`px-4 lg:px-6 py-2 rounded-md font-bold transition-all text-sm lg:text-base ${orderType === "WARRANTY" ? "bg-blue-600 text-white shadow-md" : "text-gray-500 hover:bg-gray-100"}`}>BẢO HÀNH</button>
            </div>
          </div>

          {/* CONTENT THEO TỪNG TAB */}
          {orderType === "SALE" && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50/50">
              <div className="w-full max-w-xl bg-white p-8 rounded-3xl shadow-xl border border-orange-100 text-center">
                 <div className="mx-auto bg-orange-100 text-orange-600 w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-inner"><ScanLine size={48} /></div>
                 <h3 className="text-2xl font-black text-gray-800 mb-2">Quét mã Serial Code</h3>
                 <p className="text-gray-500 mb-8 text-sm">Dùng súng quét tít mã SN trên hộp máy/linh kiện, hoặc nhập tay và ấn Enter.</p>
                 <div className="relative group">
                    <input ref={scanInputRef} type="text" placeholder="Nhập Serial Code (SN)..." value={scanInput} onChange={(e) => setScanInput(e.target.value)} onKeyDown={handleScan} className="w-full pl-6 pr-4 py-5 bg-gray-50 border-2 border-gray-200 rounded-2xl outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100 text-xl font-mono text-center tracking-widest transition-all uppercase" />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity"><span className="bg-orange-100 text-orange-600 px-3 py-1 rounded font-bold text-xs">Bấm Enter</span></div>
                 </div>
              </div>
            </div>
          )}

          {orderType === "PURCHASE" && (
            <div className="p-8 flex-1 overflow-y-auto bg-purple-50 flex items-center justify-center">
              <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-2xl border border-purple-100">
                <div className="text-center mb-8">
                  <div className="inline-flex p-4 bg-purple-100 rounded-full text-purple-600 mb-4"><Smartphone size={32} /></div>
                  <h3 className="text-2xl font-black text-gray-800">Tiếp nhận máy Thu cũ</h3>
                  <p className="text-gray-500 text-sm mt-2">Sale nhập thông tin khách và ghi chú sơ bộ để Kỹ thuật test máy</p>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Ghi chú tình trạng khách báo (Tùy chọn)</label>
                    <textarea placeholder="VD: Khách nói máy thỉnh thoảng sập nguồn, xước viền..." value={tradeInRequest.note} onChange={e => setTradeInRequest({note: e.target.value})} rows="4" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50"></textarea>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB BẢO HÀNH */}
          {orderType === "WARRANTY" && (
            <div className="flex-1 flex flex-col md:flex-row bg-blue-50/30 overflow-hidden">
                {/* CỘT TÌM KIẾM */}
                <div className="w-full md:w-1/3 bg-white border-r p-6 flex flex-col h-full overflow-y-auto">
                    <h3 className="font-black text-xl text-gray-800 mb-6 flex items-center gap-2">
                        <ShieldCheck className="text-blue-600"/> Tra cứu Bảo Hành
                    </h3>
                    
                    <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-lg">
                        <button onClick={() => {setWarrantySearchType("PHONE"); setWarrantySearchResults([]); setSelectedWarrantyInvoice(null);}} className={`flex-1 py-2 rounded-md text-sm font-bold ${warrantySearchType === "PHONE" ? "bg-white shadow text-blue-600" : "text-gray-500"}`}>Số điện thoại</button>
                        <button onClick={() => {setWarrantySearchType("INVOICE"); setWarrantySearchResults([]); setSelectedWarrantyInvoice(null);}} className={`flex-1 py-2 rounded-md text-sm font-bold ${warrantySearchType === "INVOICE" ? "bg-white shadow text-blue-600" : "text-gray-500"}`}>Mã Hóa Đơn</button>
                    </div>

                    <div className="relative mb-6">
                        <input 
                            type="text" 
                            placeholder={warrantySearchType === "PHONE" ? "Nhập SĐT khách hàng..." : "Nhập mã (VD: 9A5BC6)..."} 
                            value={warrantySearchInput}
                            onChange={e => setWarrantySearchInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearchWarranty()}
                            className="w-full pl-4 pr-10 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-500 bg-gray-50"
                        />
                        <button onClick={handleSearchWarranty} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 p-2"><Search size={20}/></button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                        {warrantySearchResults.map(invoice => {
                            // Nhãn phân loại Hóa đơn
                            let badgeInfo = { label: "Mua Offline", color: "bg-orange-100 text-orange-700" };
                            if (invoice.source === "ONLINE") badgeInfo = { label: "Mua Online", color: "bg-blue-100 text-blue-700" };
                            else if (invoice.source === "REPAIR") badgeInfo = { label: "Sửa chữa", color: "bg-purple-100 text-purple-700" };

                            return (
                                <div 
                                    key={invoice._id} 
                                    onClick={() => handleSelectInvoiceForWarranty(invoice)}
                                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${selectedWarrantyInvoice?._id === invoice._id ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-blue-300"}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-bold text-gray-800 text-sm">#{invoice.displayId.substring(invoice.displayId.length - 6).toUpperCase()}</span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${badgeInfo.color}`}>{badgeInfo.label}</span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-600">{invoice.displayName}</p>
                                    <p className="text-xs text-gray-500 flex justify-between mt-1">
                                        <span>{invoice.displayPhone}</span>
                                        <span>{dayjs(invoice.createdAt || invoice.repairOrderDate).format('DD/MM/YYYY')}</span>
                                    </p>
                                </div>
                            )
                        })}
                        {warrantySearchResults.length === 0 && warrantySearchInput && (
                            <div className="text-center py-10 text-gray-400 italic text-sm">Không có dữ liệu hiển thị.</div>
                        )}
                    </div>
                </div>

                {/* CỘT CHI TIẾT HÓA ĐƠN & TÌNH TRẠNG BẢO HÀNH */}
                <div className="w-full md:w-2/3 p-6 overflow-y-auto h-full">
                    {selectedWarrantyInvoice ? (
                        <div className="bg-white border rounded-2xl shadow-sm p-6 animate-in fade-in zoom-in duration-300">
                            <div className="flex justify-between items-start border-b pb-4 mb-6">
                                <div>
                                    <h3 className="text-xl font-black text-gray-800">
                                        Hóa đơn #{selectedWarrantyInvoice.displayId.substring(selectedWarrantyInvoice.displayId.length - 6).toUpperCase()}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">Ngày mua: <strong>{dayjs(selectedWarrantyInvoice.createdAt || selectedWarrantyInvoice.repairOrderDate).format('DD/MM/YYYY HH:mm')}</strong></p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">Khách hàng</p>
                                    <p className="font-bold text-lg text-blue-800">{selectedWarrantyInvoice.displayName}</p>
                                    <p className="text-sm text-gray-600">{selectedWarrantyInvoice.displayPhone}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-bold text-gray-700 flex items-center gap-2"><FileText size={18}/> Danh sách sản phẩm thuộc diện Bảo hành</h4>
                                {selectedWarrantyInvoice.warrantableItems && selectedWarrantyInvoice.warrantableItems.length > 0 ? (
                                    selectedWarrantyInvoice.warrantableItems.map((wItem, idx) => {
                                        const purchaseDate = dayjs(wItem.purchaseDate);
                                        const expiryDate = purchaseDate.add(wItem.warrantyMonths, 'month');
                                        const isExpired = dayjs().isAfter(expiryDate);

                                        return (
                                            <div key={idx} className={`p-4 border rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 ${isExpired ? "bg-gray-50 border-gray-200 opacity-70" : "bg-blue-50/30 border-blue-200"}`}>
                                                <div className="flex-1">
                                                    <h5 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                                                        {selectedWarrantyInvoice.source === "REPAIR" ? <Hammer size={16} className="text-purple-600"/> : <MonitorSmartphone size={16} className="text-blue-600"/>}
                                                        {wItem.name}
                                                    </h5>
                                                    <div className="text-sm text-gray-600 mt-2 grid grid-cols-2 gap-y-1 gap-x-4">
                                                        <p>S/N: <strong className="font-mono text-gray-800">{wItem.serialCode}</strong></p>
                                                        <p>Màu: <strong>{wItem.color}</strong></p>
                                                        <p>Thời gian BH: <strong>{wItem.warrantyMonths} tháng</strong></p>
                                                        <p>Hạn cuối: <strong className={isExpired ? "text-red-600" : "text-green-600"}>{expiryDate.format('DD/MM/YYYY')}</strong></p>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex flex-col items-center gap-2 flex-shrink-0">
                                                    {isExpired ? (
                                                        <div className="px-4 py-2 bg-red-100 text-red-700 font-bold rounded-lg text-sm flex items-center gap-2 border border-red-200">
                                                            <AlertTriangle size={16}/> HẾT BẢO HÀNH
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="px-4 py-1.5 bg-green-100 text-green-700 font-bold rounded-lg text-sm border border-green-200 shadow-sm">CÒN BẢO HÀNH</div>
                                                            <button onClick={() => handleOpenWarrantyModal(wItem)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm transition shadow-md w-full">
                                                                Tạo Đơn BH
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <p className="text-center text-gray-500 italic py-4">Hóa đơn này không có sản phẩm nào thuộc diện bảo hành (Hoặc chỉ mua sạc cáp phụ kiện nhỏ).</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                            <ShieldCheck size={80} className="mb-4 text-gray-300"/>
                            <h3 className="text-xl font-bold text-gray-500">Tra cứu thông tin bảo hành</h3>
                            <p className="text-sm mt-2 max-w-sm text-center">Tìm kiếm bằng Số điện thoại hoặc Mã hóa đơn ở cột bên trái để kiểm tra thời hạn và tạo đơn bảo hành.</p>
                        </div>
                    )}
                </div>
            </div>
          )}
        </div>

        {/* =========================================================== */}
        {/* NỬA PHẢI: THÔNG TIN KHÁCH & GIỎ HÀNG (CHỈ HIỂN THỊ KHI SALE/PURCHASE) */}
        {/* =========================================================== */}
        {orderType !== "WARRANTY" && (
            <div className="w-1/3 flex flex-col gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border">
                <h3 className="font-bold mb-4 flex items-center gap-2 border-b pb-2"><User size={18} className={orderType === "SALE" ? "text-orange-600" : "text-purple-600"} /> Thông tin khách hàng <span className="text-red-500">*</span></h3>
                <div className="space-y-3">
                <input type="text" placeholder="Tên khách hàng" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} className={`w-full p-3 border rounded-lg outline-none focus:ring-2 ${orderType==="SALE" ? "focus:ring-orange-500" : "focus:ring-purple-500"} bg-gray-50`} />
                <input type="text" placeholder="Số điện thoại (VD: 0912345678)" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} className={`w-full p-3 border rounded-lg outline-none focus:ring-2 ${orderType==="SALE" ? "focus:ring-orange-500" : "focus:ring-purple-500"} bg-gray-50`} />
                </div>
            </div>

            {orderType === "SALE" ? (
                <div className="bg-white flex-1 p-4 rounded-xl shadow-sm border flex flex-col overflow-hidden">
                <h3 className="font-bold mb-4 flex items-center gap-2 border-b pb-2"><ShoppingCart size={18} className="text-orange-600" /> Giỏ hàng ({cart.length})</h3>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {cart.length === 0 && <p className="text-center text-sm text-gray-400 mt-10">Dùng súng quét mã để thêm SP</p>}
                    {cart.map((item, i) => (
                        <div key={i} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-transparent hover:border-gray-200 transition-all">
                        <div className="flex-1 min-w-0 mr-2">
                            <p className="font-bold text-sm truncate text-gray-800">{item.name}</p>
                            <p className="text-[10px] text-gray-500 font-mono italic truncate">SN: {item.identifier}</p>
                            <p className="text-orange-600 font-bold text-xs mt-1">{formatCurrency(item.price)}</p>
                        </div>
                        <button onClick={() => removeFromCart(i)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-all flex-shrink-0"><Trash2 size={18} /></button>
                        </div>
                    ))}
                    </div>
                <div className="mt-4 pt-4 border-t space-y-4">
                    <div className="flex justify-between items-end">
                        <span className="text-gray-500 font-medium uppercase text-[10px] tracking-wider">Tổng thanh toán:</span>
                        <span className="text-2xl font-black text-orange-600 tracking-tighter">{formatCurrency(calculateTotal())}</span>
                    </div>
                    <button onClick={handleSaleSubmit} disabled={cart.length === 0} className={`w-full py-4 rounded-xl font-black flex items-center justify-center gap-2 transition-all ${cart.length > 0 ? "bg-orange-600 text-white shadow-lg hover:bg-orange-700" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}><Save size={20} /> TẠO HÓA ĐƠN</button>
                </div>
                </div>
            ) : (
                <div className="bg-white flex-1 p-6 rounded-xl shadow-sm border flex flex-col justify-center text-center">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Gửi yêu cầu Kỹ Thuật</h3>
                <p className="text-sm text-gray-500 mb-8">Vui lòng kiểm tra lại thông tin khách hàng và ghi chú trước khi chuyển cho Tech định giá.</p>
                <button onClick={handleSendToTech} className="w-full py-4 rounded-xl font-black flex items-center justify-center gap-2 shadow-xl bg-purple-600 text-white hover:bg-purple-700 transition-transform hover:-translate-y-1">
                    <Send size={20} /> CHUYỂN CHO TECH ĐỊNH GIÁ
                </button>
                </div>
            )}
            </div>
        )}

        {/* POP-UP TẠO ĐƠN BẢO HÀNH */}
        {isWarrantyModalOpen && selectedWarrantyItem && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
                    <div className="p-5 border-b bg-blue-50 flex justify-between items-center">
                        <h3 className="text-xl font-black text-blue-800 flex items-center gap-2"><ShieldCheck size={24}/> Tạo Đơn Tiếp Nhận Bảo Hành</h3>
                        <button onClick={() => setIsWarrantyModalOpen(false)} className="text-gray-400 hover:text-red-600 bg-white p-1 rounded-lg border transition"><X size={20}/></button>
                    </div>
                    <div className="p-6">
                        <div className="bg-gray-50 border rounded-xl p-4 mb-6 flex flex-col items-center text-center">
                            <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Thiết bị bảo hành</p>
                            <p className="font-bold text-lg text-blue-700">{selectedWarrantyItem.name}</p>
                            <p className="text-sm text-gray-600 font-mono mt-1">S/N: {selectedWarrantyItem.serialCode}</p>
                        </div>

                        <div className="mb-6">
                            <label className="block font-bold text-gray-800 mb-2">Tình trạng lỗi (Khách báo) <span className="text-red-500">*</span></label>
                            <textarea 
                                rows="3" 
                                value={warrantyIssue}
                                onChange={e => setWarrantyIssue(e.target.value)}
                                placeholder="Mô tả chi tiết lỗi: VD màn hình bị sọc, cắm sạc không vào..."
                                className="w-full p-3 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-500 bg-white"
                            ></textarea>
                        </div>

                        <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl mb-6 flex gap-3 items-start">
                            <AlertTriangle size={20} className="text-orange-600 flex-shrink-0 mt-0.5"/>
                            <div>
                                <p className="text-sm font-bold text-orange-800 mb-1">Kiểm tra tem bảo hành vật lý</p>
                                <p className="text-xs text-orange-700 mb-3">Sale vui lòng kiểm tra trực tiếp thiết bị của khách xem tem bảo hành của cửa hàng có còn nguyên vẹn không.</p>
                                <label className="flex items-center gap-2 cursor-pointer w-max bg-white px-3 py-2 border rounded-lg shadow-sm">
                                    <input 
                                        type="checkbox" 
                                        checked={isStampIntact}
                                        onChange={e => setIsStampIntact(e.target.checked)}
                                        className="w-5 h-5 accent-blue-600 cursor-pointer"
                                    />
                                    <span className={`font-bold text-sm ${isStampIntact ? "text-green-600" : "text-gray-700"}`}>Xác nhận: Tem bảo hành còn nguyên vẹn</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setIsWarrantyModalOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition">Hủy</button>
                            <button onClick={handleSubmitWarranty} disabled={!isStampIntact || !warrantyIssue.trim()} className="flex-1 py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed flex justify-center items-center gap-2">
                                <CheckSquare size={20}/> TẠO YÊU CẦU BH
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* POP-UP PREVIEW HÓA ĐƠN BÁN HÀNG */}
        {isModalOpen && selectedOrder && orderType === "SALE" && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-4xl shadow-2xl max-h-[90vh] flex flex-col">
              <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                <h3 className="text-xl font-bold text-orange-600 flex items-center gap-2">
                  <CheckCircle size={24}/> {selectedOrder.status === "Pending" ? "Xác nhận tạo đơn bán" : `Đơn hàng #${selectedOrder._id?.substring(selectedOrder._id.length - 6).toUpperCase()}`}
                </h3>
                
                {/* 🌟 NÚT TẢI PDF & IN BILL Ở ĐÂY 🌟 */}
                <div className="flex gap-2">
                  {selectedOrder.status === "Completed" && (
                    <>
                        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-xs hover:bg-blue-700 shadow-md">
                          <Printer size={16} /> IN BILL
                        </button>
                        <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-bold text-xs hover:bg-green-700 shadow-md">
                          <Download size={16} /> TẢI PDF
                        </button>
                    </>
                  )}
                  <button onClick={() => {
                      setIsModalOpen(false);
                      if(selectedOrder.status === "Completed") fetchInventory();
                    }} className="text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-lg transition">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-2 gap-4 mb-6 bg-orange-50 p-4 rounded-lg border border-orange-100">
                  <div>
                    <p className="text-[10px] text-gray-500 font-black uppercase mb-1">Khách hàng</p>
                    <p className="font-bold text-gray-800 text-lg">{selectedOrder.customerName}</p>
                    <p className="text-sm text-gray-600">{selectedOrder.customerPhone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-500 font-black uppercase mb-1">Tổng cần thanh toán</p>
                    <p className="text-3xl font-black text-orange-600">{formatCurrency(selectedOrder.totalPrice)}</p>
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 text-gray-600 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="p-3">Sản phẩm</th>
                        <th className="p-3 text-right">Đơn giá</th>
                        <th className="p-3 text-center">Bảo hành</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderDetails.map((detail, idx) => (
                        <tr key={idx} className="border-t hover:bg-gray-50">
                          <td className="p-3">
                            <div className="flex items-center gap-2 font-bold italic">
                              {detail.isPhone || detail.phoneId ? <Smartphone size={16} className="text-blue-500" /> : <Package size={16} className="text-emerald-500" />}
                              {detail.displayName || detail.phoneId?.phoneModelId?.name || detail.itemId?.item_type?.name || detail.name || "Sản phẩm"}
                            </div>
                            <div className="text-[10px] text-gray-400 ml-6">
                              SN: {detail.identifier || detail.phoneId?.serialCode || detail.itemId?.serialCode}
                            </div>
                          </td>
                          <td className="p-3 text-right font-black">{formatCurrency(detail.displayPrice || detail.purchasePrice || detail.phoneId?.sellingPrice || detail.price || 0)}</td>
                          <td className="p-3 text-center">
                            <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-1 rounded">CÓ BH</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
                <div></div>
                {selectedOrder.status === "Pending" ? (
                   <button onClick={handleConfirmPayment} className="px-8 py-3 bg-green-600 text-white rounded-xl font-black flex items-center gap-2 hover:bg-green-700 shadow-lg transition">
                      <CheckCircle size={20}/> XÁC NHẬN THANH TOÁN (XUẤT KHO)
                   </button>
                ) : (
                   <div className="px-8 py-3 bg-gray-200 text-green-700 rounded-xl font-black flex items-center gap-2">
                      <CheckCircle size={20}/> ĐƠN ĐÃ HOÀN TẤT
                   </div>
                )}
              </div>

              {/* 🌟 CHỖ NÀY GIẤU FORM IN BẰNG CSS ĐỂ HTML2PDF CHỤP ĐƯỢC 🌟 */}
              <div className="absolute left-[-9999px] top-[-9999px] opacity-0 pointer-events-none -z-50">
                <InvoicePrint contentRef={printRef} order={selectedOrder} details={orderDetails} formatCurrency={formatCurrency} activeTab={orderType} />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
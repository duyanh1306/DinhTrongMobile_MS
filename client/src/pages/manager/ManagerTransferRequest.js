import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Save, X, Package, Store, Scan, Plus, Trash2, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Html5QrcodeScanner, Html5Qrcode } from "html5-qrcode";

export default function ManagerTransferRequest() {
  const navigate = useNavigate();
  const [user, setUser] = useState({});
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameraScanning, setCameraScanning] = useState(false);
  const [serialInput, setSerialInput] = useState("");
  const [scannedItems, setScannedItems] = useState([]);
  const [searchingItem, setSearchingItem] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const qrInputRef = useRef(null);
  const scannerRef = useRef(null);
  
  const [formData, setFormData] = useState({
    fromStoreId: "",
    toStoreId: "",
    note: ""
  });

  useEffect(() => {
    // Get user info from localStorage
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    setUser(userData);
    
    // Fetch stores and find user's store
    fetchStoresAndSetUserStore(userData._id || userData.id);
  }, []);

  const fetchStoresAndSetUserStore = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:9999/api/stores", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      if (response.ok) {
        const data = await response.json();

        let storesArray = data;
        if (data && typeof data === 'object') {
          if (Array.isArray(data)) {
            storesArray = data;
          } else if (data.stores && Array.isArray(data.stores)) {
            storesArray = data.stores;
          } else if (data.data && Array.isArray(data.data)) {
            storesArray = data.data;
          } else {
            console.error("Unexpected response structure:", data);
            toast.error("Dữ liệu cửa hàng không hợp lệ");
            return;
          }
        }
        
        if (!Array.isArray(storesArray)) {
          console.error("Stores data is not an array:", storesArray);
          toast.error("Dữ liệu cửa hàng không đúng định dạng");
          return;
        }
        
        setStores(storesArray);
        
        // Find the store where the user is in the staff array
        const userStore = storesArray.find(store => 
          store.staff && store.staff.includes(userId)
        );
        
        if (userStore) {
          setFormData(prev => ({
            ...prev,
            fromStoreId: userStore._id
          }));
          setUser(prev => ({
            ...prev,
            storeId: userStore
          }));
        } else {
          toast.error("Không tìm thấy cửa hàng của bạn. Vui lòng liên hệ quản trị viên.");
        }
      } else {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        toast.error(errorData.message || "Không thể tải danh sách cửa hàng");
      }
    } catch (error) {
      console.error("Error fetching stores:", error);
      toast.error("Lỗi khi tải danh sách cửa hàng");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.toStoreId) {
      toast.error("Vui lòng chọn cửa hàng đích");
      return;
    }

    if (formData.fromStoreId === formData.toStoreId) {
      toast.error("Cửa hàng nguồn và đích không được trùng nhau");
      return;
    }

    if (scannedItems.length === 0) {
      toast.error("Vui lòng thêm ít nhất một mặt hàng để chuyển");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      // Group scanned items by their item_type to create itemType array
      const itemTypesMap = {};
      scannedItems.forEach(item => {
        const itemTypeId = item.item_type?._id || item.item_type;
        const itemTypeName = item.item_type?.name || "Unknown";

        if (!itemTypesMap[itemTypeId]) {
          itemTypesMap[itemTypeId] = {
            itemTypes: itemTypeId,
            quantity: 0
          };
        }
        itemTypesMap[itemTypeId].quantity += 1;
      });

      const requestData = {
        ...formData,
        requestedBy: user._id || user.id,
        items: scannedItems.map(item => item._id),
        itemType: Object.values(itemTypesMap)
      };

      const response = await fetch("http://localhost:9999/api/transfer-requests", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        toast.success("Tạo yêu cầu chuyển kho thành công!");
        navigate("/manager/transfer_approvals");
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Không thể tạo yêu cầu chuyển kho");
      }
    } catch (error) {
      console.error("Error creating transfer request:", error);
      toast.error("Lỗi khi tạo yêu cầu chuyển kho");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/manager/transfer_approvals");
  };

  const startScanning = () => {
    setScanning(true);
    setSerialInput("");
    setTimeout(() => {
      qrInputRef.current?.focus();
    }, 100);
  };

  const handleSerialInput = async (e) => {
    const value = e.target.value;
    setSerialInput(value);
    
    // Check if input looks like a complete serial code (assuming reasonable length)
    if (value.length >= 8) {
      await searchItemBySerial(value);
    }
  };

  const handleSerialKeyPress = async (e) => {
    if (e.key === 'Enter' && serialInput.trim()) {
      await searchItemBySerial(serialInput.trim());
    }
  };

  const searchItemBySerial = async (serialCode) => {
    if (!serialCode.trim()) return;
    
    setSearchingItem(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:9999/api/items?search=${encodeURIComponent(serialCode)}&limit=1`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const result = await response.json();
        const items = result.data || [];
        
        if (items.length === 0) {
          toast.error("Không tìm thấy mặt hàng với mã serial này");
          return;
        }
        
        const item = items[0];
        
        // Debug logging
        console.log("Item store ID:", item.storeId);
        console.log("Form from store ID:", formData.fromStoreId);
        console.log("Item store ID type:", typeof item.storeId);
        console.log("Form from store ID type:", typeof formData.fromStoreId);
        
        // Check if item already exists in scanned list
        if (scannedItems.find(scannedItem => scannedItem._id === item._id)) {
          toast.warning("Mặt hàng này đã được thêm vào danh sách");
          return;
        }

        // Check if item belongs to user's store (handle both string and object formats)
        const itemStoreId = item.storeId?._id || item.storeId;
        const fromStoreId = formData.fromStoreId;
        
        console.log("Normalized item store ID:", itemStoreId);
        console.log("Normalized from store ID:", fromStoreId);
        
        if (itemStoreId !== fromStoreId) {
          toast.error(`Mặt hàng này không thuộc cửa hàng của bạn. Item store: ${itemStoreId}, Your store: ${fromStoreId}`);
          return;
        }

        // Add item to scanned list
        setScannedItems(prev => [...prev, item]);
        toast.success(`Đã thêm: ${item.name}`);
        setSerialInput("");
        setScanning(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Không tìm thấy mặt hàng với mã serial này");
      }
    } catch (error) {
      console.error("Error searching item:", error);
      toast.error("Lỗi khi tìm kiếm mặt hàng");
    } finally {
      setSearchingItem(false);
    }
  };

  const removeScannedItem = (itemId) => {
    setScannedItems(prev => prev.filter(item => item._id !== itemId));
    toast.info("Đã xóa mặt hàng khỏi danh sách");
  };

  const stopScanning = () => {
    setScanning(false);
    setSerialInput("");
  };

  // Camera QR Scanning Functions
  const startCameraScanning = async () => {
    try {
      console.log("Starting camera detection...");
      
      // Get available cameras
      const devices = await Html5Qrcode.getCameras();
      console.log("Detected devices:", devices);
      
      setCameras(devices);
      
      if (devices.length === 0) {
        console.log("No cameras detected");
        toast.error("Không tìm thấy camera nào. Vui lòng kiểm tra kết nối camera.");
        
        // Try alternative method
        try {
          console.log("Trying navigator.mediaDevices...");
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
          });
          console.log("Got media stream:", stream);
          stream.getTracks().forEach(track => track.stop());
        } catch (error) {
          console.error("Alternative camera access failed:", error);
        }
        return;
      }
      
      console.log("Found cameras:", devices.map(d => ({ id: d.id, label: d.label })));
      
      // Select first camera by default
      setSelectedCamera(devices[0].id);
      setCameraScanning(true);
      setScanning(false);
      
      toast.success(`Phát hiện ${devices.length} camera`);
    } catch (error) {
      console.error("Error accessing cameras:", error);
      toast.error(`Không thể truy cập camera: ${error.message}`);
    }
  };

  const stopCameraScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(error => {
        console.error("Error stopping scanner:", error);
      });
      scannerRef.current = null;
    }
    setCameraScanning(false);
    setSelectedCamera(null);
  };

  const initializeScanner = async (cameraId) => {
    try {
      // Stop existing scanner if any
      if (scannerRef.current) {
        await scannerRef.current.stop();
      }

      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText, decodedResult) => {
          // QR Code detected
          console.log("QR Code detected:", decodedText);
          handleQRCodeDetected(decodedText);
        },
        (errorMessage) => {
          // Ignore errors during scanning
        }
      );
    } catch (error) {
      console.error("Error starting scanner:", error);
      toast.error("Không thể khởi động camera. Vui lòng thử lại.");
    }
  };

  const handleQRCodeDetected = async (qrText) => {
    // Stop scanning temporarily to prevent multiple reads
    if (scannerRef.current) {
      await scannerRef.current.pause();
    }

    // Search for item with the QR code text
    await searchItemBySerial(qrText);
    
    // Resume scanning after a delay
    setTimeout(() => {
      if (scannerRef.current && cameraScanning) {
        scannerRef.current.resume();
      }
    }, 2000);
  };

  const handleCameraChange = (cameraId) => {
    setSelectedCamera(cameraId);
    if (cameraScanning && cameraId) {
      initializeScanner(cameraId);
    }
  };

  useEffect(() => {
    if (cameraScanning && selectedCamera) {
      initializeScanner(selectedCamera);
    }
    
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [cameraScanning, selectedCamera]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/manager/transfer_approvals")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tạo Yêu Cầu Chuyển Kho</h1>
            <p className="text-gray-600">Tạo đơn yêu cầu chuyển hàng giữa các cửa hàng</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Store Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* From Store */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Store size={16} className="inline mr-1" />
                Cửa hàng nguồn
              </label>
              <input
                type="text"
                value={user.storeId?.name || "Cửa hàng của bạn"}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                placeholder="Cửa hàng của bạn"
              />
              <p className="text-xs text-gray-500 mt-1">Cửa hàng của bạn (không thể thay đổi)</p>
            </div>

            {/* To Store */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Store size={16} className="inline mr-1" />
                Cửa hàng đích
              </label>
              <select
                name="toStoreId"
                value={formData.toStoreId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              >
                <option value="">-- Chọn cửa hàng đích --</option>
                {stores && Array.isArray(stores) ? stores.filter(store => store._id !== formData.fromStoreId).map(store => (
                  <option key={store._id} value={store._id}>
                    {store.name} - {store.address}
                  </option>
                )) : <option value="">Đang tải...</option>}
              </select>
            </div>
          </div>

          {/* QR Code Scanning Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700">
                <Package size={16} className="inline mr-1" />
                Danh sách mặt hàng chuyển
              </h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={startScanning}
                  disabled={scanning || cameraScanning}
                  className="px-3 py-1 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  <Scan size={14} />
                  {scanning ? "Đang nhập..." : "Nhập Serial"}
                </button>
                <button
                  type="button"
                  onClick={startCameraScanning}
                  disabled={scanning || cameraScanning}
                  className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  <Camera size={14} />
                  {cameraScanning ? "Đang quét..." : "Quét Camera"}
                </button>
              </div>
            </div>

            {/* Camera Scanning Interface */}
            {cameraScanning && (
              <div className="mb-4 p-4 bg-white rounded-lg border border-indigo-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-indigo-700">
                    <Camera size={16} className="inline mr-1" />
                    Quét QR Code bằng Camera
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={startCameraScanning}
                      className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      Làm mới Camera
                    </button>
                    {cameras.length > 1 && (
                      <select
                        value={selectedCamera || ""}
                        onChange={(e) => handleCameraChange(e.target.value)}
                        className="px-2 py-1 text-sm border border-gray-300 rounded"
                      >
                        {cameras.map((camera, index) => (
                          <option key={camera.id} value={camera.id}>
                            {camera.label || `Camera ${index + 1}`}
                          </option>
                        ))}
                      </select>
                    )}
                    <button
                      type="button"
                      onClick={stopCameraScanning}
                      className="px-2 py-1 text-red-600 hover:text-red-700 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
                
                {/* Camera Status */}
                <div className="mb-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
                  <strong>Trạng thái:</strong> {cameras.length > 0 ? `Phát hiện ${cameras.length} camera` : 'Không tìm thấy camera'}
                  {selectedCamera && ` | Đã chọn: ${cameras.find(c => c.id === selectedCamera)?.label || 'Camera ' + (cameras.findIndex(c => c.id === selectedCamera) + 1)}`}
                </div>
                
                {/* QR Scanner Container */}
                <div className="flex justify-center">
                  <div 
                    id="qr-reader" 
                    className="border-2 border-indigo-300 rounded-lg"
                    style={{ width: '300px', height: '300px' }}
                  />
                </div>
                
                <p className="text-xs text-gray-600 mt-2 text-center">
                  Đưa QR code vào khung để quét tự động
                </p>
              </div>
            )}

            {/* Manual Input */}
            {scanning && (
              <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center gap-2">
                  <Scan size={16} className="text-gray-600" />
                  <input
                    ref={qrInputRef}
                    type="text"
                    value={serialInput}
                    onChange={handleSerialInput}
                    onKeyPress={handleSerialKeyPress}
                    placeholder="Nhập mã serial hoặc dán QR code..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={stopScanning}
                    className="px-2 py-2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
                {searchingItem && (
                  <p className="text-xs text-indigo-600 mt-2">Đang tìm kiếm mặt hàng...</p>
                )}
              </div>
            )}

            {/* Scanned Items List */}
            {scannedItems.length > 0 ? (
              <div className="space-y-2">
                {scannedItems.map((item, index) => (
                  <div key={item._id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{item.name}</div>
                      <div className="text-xs text-gray-500">
                        Serial: {item.serialCode} | 
                        Loại: {item.item_type?.name || 'N/A'} |
                        RAM: {item.ram || 'N/A'} |
                        Dung lượng: {item.capacity || 'N/A'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeScannedItem(item._id)}
                      className="p-1 text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <div className="text-xs text-gray-600 mt-2">
                  Tổng cộng: {scannedItems.length} mặt hàng
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Package size={32} className="mx-auto mb-2" />
                <p className="text-sm">Chưa có mặt hàng nào</p>
                <p className="text-xs">Nhấn "Quét QR Code" để thêm mặt hàng</p>
              </div>
            )}
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ghi chú
            </label>
            <textarea
              name="note"
              value={formData.note}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Nhập ghi chú cho yêu cầu chuyển kho (nếu có)..."
            />
          </div>

          {/* Request Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Thông tin yêu cầu</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Người tạo:</span>
                <span className="ml-2 font-medium">{user.fullName || user.username || "N/A"}</span>
              </div>
              <div>
                <span className="text-gray-600">Trạng thái:</span>
                <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                  PENDING
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <X size={16} />
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save size={16} />
              {loading ? "Đang tạo..." : "Tạo đơn"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
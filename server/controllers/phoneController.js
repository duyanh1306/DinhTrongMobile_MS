const Phone = require("../models/Phone");
const Item = require("../models/Item");
const QRCode = require('qrcode');

// GET /api/phones/qrcode/:id
const generatePhoneQRCode = async (req, res) => {
    try {
        const { id } = req.params;

        const phone = await Phone.findById(id);

        if (!phone) {
            return res.status(404).json({ success: false, message: "Phone not found" });
        }

        // Just use the ObjectId string directly
        const qrText = phone._id.toString();

        console.log('Generated QR Code for phone ID:', qrText);

        const qrCodeImage = await QRCode.toBuffer(qrText, {
            type: 'png',
            width: 200,
            margin: 1,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', 'inline; filename=qrcode.png');

        res.status(200).send(qrCodeImage);

    } catch (error) {
        console.error("Error generating phone QR code:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// const testPhoneQRCode = async (req, res) => {
//     try {
//         console.log('=== TESTING PHONE QR CODE GENERATION ===');
//
//         // Test with a sample phone ID
//         const testId = '69a600000000000000000001';
//
//         // Create a mock request object with the test ID
//         const mockReq = { params: { id: testId } };
//
//         // Call the generatePhoneQRCode method
//         await generatePhoneQRCode(mockReq, res);
//
//     } catch (error) {
//         console.error("Error testing phone QR code:", error);
//         res.status(500).json({ success: false, message: error.message });
//     }
// };

// GET /api/phones (Phân trang & Tìm kiếm)
const getPhonesPaginatedAndSearch = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', status, storeId } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        let query = {};

        // Chỉ cần gõ vài số cuối của IMEI là tìm được
        if (search) {
            query.imei = { $regex: search, $options: 'i' };
        }
        
        // Lọc theo trạng thái hoặc cửa hàng (nếu có truyền lên)
        if (status) query.status = status;
        if (storeId) query.storeId = storeId;

        const phones = await Phone.find(query)
            .populate('phoneModelId', 'name brand price condition') // Nối sang bảng Phone_model lấy Tên và Hãng
            .populate('storeId', 'name address') // Nối sang bảng Store
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        const totalCount = await Phone.countDocuments(query);
        const totalPages = Math.ceil(totalCount / limitNum);

        res.status(200).json({
            success: true,
            data: phones,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalCount,
                limit: limitNum,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1
            }
        });
    } catch (error) {
        console.error("Error getting phones:", error);
        res.status(500).json({ success: false, message: "Lỗi Server" });
    }
};
const handleTechDecision = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, sellingPrice, capacity, colorName, parts, phoneName } = req.body;

    if (decision === "SELL") {
      // Dùng findByIdAndUpdate để ép Mongoose lưu thành công, bỏ qua validation thừa
      const updateData = {
        status: "in_stock", // Ép thẳng về Sẵn sàng bán
        sellingPrice: Number(sellingPrice)
      };
      if (capacity) updateData.capacity = capacity;
      if (colorName) updateData.colorName = colorName;

      const updatedPhone = await Phone.findByIdAndUpdate(id, updateData, { new: true });
      
      if (!updatedPhone) return res.status(404).json({ message: "Không tìm thấy máy" });
      return res.status(200).json({ message: "Đã chuyển máy vào kho (Sẵn sàng bán)", data: updatedPhone });
    } 
    
    if (decision === "DISMANTLE") {
      const phone = await Phone.findById(id);
      if (!phone) return res.status(404).json({ message: "Không tìm thấy điện thoại" });

      phone.status = "defective"; 
      await phone.save();

      if (parts && parts.length > 0) {
        const itemsToCreate = parts.map((p) => ({
          name: p.name || `Linh kiện bóc máy`,
          item_type: p.itemTypeId,
          storeId: phone.storeId,
          serialCode: p.serialCode || `SN-${Date.now().toString().slice(-6)}-${Math.floor(Math.random()*1000)}`,
          baseCost: Number(p.baseCost || 0),
          price: Number(p.price || 0),
          status: "in_stock",
          origin: "disassembled",
          sourceDevice: phoneName ? `${phoneName}` : `Máy bóc (Mã: ${phone._id.toString().slice(-6)})`,
          quality: p.quality || "Zin bóc máy",
          ram: p.ram || "",
          capacity: p.capacity || "",
          color: p.color || ""
        }));
        await Item.insertMany(itemsToCreate);
      }
      return res.status(200).json({ message: "Đã rã máy và nhập linh kiện vào kho" });
    }

    res.status(400).json({ message: "Quyết định không hợp lệ" });
  } catch (error) {
    console.error("LỖI TECH DECISION:", error);
    res.status(500).json({ message: error.message });
  }
};
// GET /api/phones/all (Lấy tất cả không phân trang - Dùng cho Dropdown nếu cần)
const getAllPhones = async (req, res) => {
    try {
        const phones = await Phone.find()
            .populate('phoneModelId', 'name brand')
            .populate('storeId', 'name');
        res.status(200).json({ success: true, data: phones });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi Server" });
    }
};

// POST /api/phones/create
const createPhone = async (req, res) => {
    try {
        const { imei, phoneModelId, colorName, capacity, storeId, status, importPrice, sellingPrice, source, notes } = req.body;

        let specificImages = [];
        if (req.files && req.files.length > 0) {
            specificImages = req.files.map(file => file.path);
        }

        const newPhone = new Phone({
            imei, phoneModelId, colorName, 
            capacity, // Lưu dung lượng
            storeId, status: status || 'in_stock',
            importPrice, 
            sellingPrice, // Lưu giá bán ra
            source: source || 'supplier',
            notes, specificImages
        });

        const savedPhone = await newPhone.save();
        res.status(201).json({ success: true, message: "Thêm máy vào kho thành công", data: savedPhone });
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ message: "Số IMEI này đã tồn tại!" });
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /api/phones/update/:id
const updatePhone = async (req, res) => {
    try {
        const { id } = req.params;
        let updateData = { ...req.body };
        delete updateData.imei; 

        let specificImages = [];
        
        if (req.body.retainedImages) {
            specificImages = JSON.parse(req.body.retainedImages);
        }
        
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => file.path);
            specificImages = [...specificImages, ...newImages];
        }

        updateData.specificImages = specificImages;

        const updatedPhone = await Phone.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
        if (!updatedPhone) return res.status(404).json({ success: false, message: "Không tìm thấy máy" });

        res.status(200).json({ success: true, message: "Cập nhật máy thành công", data: updatedPhone });
    } catch (error) {
        console.error(error);
        if (error.code === 11000) return res.status(400).json({ message: "Số IMEI này đã tồn tại trong hệ thống!" });
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE /api/phones/:id
const deletePhone = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedPhone = await Phone.findByIdAndDelete(id);

        if (!deletedPhone) {
            return res.status(404).json({ success: false, message: "Không tìm thấy máy" });
        }

        res.status(200).json({ success: true, message: "Xóa máy thành công", data: deletedPhone });
    } catch (error) {
        console.error("Error deleting phone:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/phones/create (Assembly)
const createAssembledPhone = async (req, res) => {
    try {
        const { phone_model, items, status, assembled_by, assembled_date, storeId } = req.body;

        // Validate required fields
        if (!phone_model || !items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Phone model and items are required"
            });
        }

        // Check if all items exist and are in stock
        const itemDocs = await Item.find({ '_id': { $in: items } });
        if (itemDocs.length !== items.length) {
            return res.status(400).json({
                success: false,
                message: "Some items not found"
            });
        }

        // Check if all items are in stock
        const outOfStockItems = itemDocs.filter(item => item.status !== 'in_stock');
        if (outOfStockItems.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Some items are not in stock"
            });
        }

        // Generate IMEI for assembled phone
        const imei = 'ASM' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();

        // Create the assembled phone
        const newPhone = new Phone({
            imei,
            phoneModelId: phone_model,
            colorName: 'Assembled',
            capacity: 'N/A',
            storeId: storeId || '000000000000000000000000',
            status: 'in_stock',  // ✅ Valid enum value
            source: 'assembled',
            items: items,
            importPrice: 0,      // ✅ Required field added
            sellingPrice: 0,     // ✅ Required field added
            notes: `Assembled by ${assembled_by} on ${new Date(assembled_date).toLocaleDateString()}`
        });

        // Update item statuses to 'consumed'
        await Item.updateMany(
            { '_id': { $in: items } },
            { status: 'consumed' }
        );

        const savedPhone = await newPhone.save();

        // Populate the response with related data
        const populatedPhone = await Phone.findById(savedPhone._id)
            .populate('phoneModelId', 'name brand')
            .populate('items', 'serial_code item_type notes')
            .populate('storeId', 'name address');

        res.status(201).json({
            success: true,
            message: "Phone assembled successfully",
            data: populatedPhone
        });
    } catch (error) {
        console.error("Error assembling phone:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/phones/grouped-by-brand (Get phones grouped by brand)
const getPhonesGroupedByBrand = async (req, res) => {
    try {
        const { status, storeId } = req.query;

        // Build query for phones
        let phoneQuery = {};
        if (status) phoneQuery.status = status;
        if (storeId) phoneQuery.storeId = storeId;

        // Get all phones with populated data
        const phones = await Phone.find(phoneQuery)
            .populate({
                path: 'phoneModelId',
                populate: {
                    path: 'brand',
                    select: 'name'
                }
            })
            .populate('storeId', 'name address')
            .sort({ createdAt: -1 });

        // Group phones by brand
        const phonesByBrand = {};

        phones.forEach(phone => {
            const brand = phone.phoneModelId?.brand;
            if (!brand) return;

            const brandName = brand.name;
            if (!phonesByBrand[brandName]) {
                phonesByBrand[brandName] = {
                    brand: brand,
                    phones: []
                };
            }
            phonesByBrand[brandName].phones.push(phone);
        });

        res.status(200).json({
            success: true,
            data: phonesByBrand
        });
    } catch (error) {
        console.error("Error getting phones grouped by brand:", error);
        res.status(500).json({ success: false, message: "Lỗi Server" });
    }
};

module.exports = {
    getPhonesPaginatedAndSearch,
    getAllPhones,
    createPhone,
    updatePhone,
    deletePhone,
    createAssembledPhone,
    getPhonesGroupedByBrand,
    handleTechDecision,
    generatePhoneQRCode
};
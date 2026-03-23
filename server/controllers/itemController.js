const Item = require("../models/Item");
const QRCode = require('qrcode');
const Item_type = require("../models/Item_type");
// GET /api/items/qrcode/:id
const generateItemQRCode = async (req, res) => {
    try {
        const { id } = req.params;

        const item = await Item.findById(id);

        if (!item) {
            return res.status(404).json({ success: false, message: "Item not found" });
        }

        const qrText = item.serialCode;

        console.log('Generated QR Code for serial code:', qrText);

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
        console.error("Error generating item QR code:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/items/all
const getAllItems = async (req, res) => {
    try {
        const items = await Item.find()
            .populate('item_type', 'name code')
            .populate('storeId', 'name location');
        
        res.status(200).json({
            success: true,
            data: items,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/items
const getItemsPaginatedAndSearch = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', sortBy = 'name', sortOrder = 'asc', status = '', item_type = '', storeId = '' } = req.query; // Đổi biến nhận từ Frontend thành storeId
        
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        
        let andConditions = [];
        
        if (item_type) andConditions.push({ item_type: item_type }); 
        if (status) andConditions.push({ status: status });
        if (storeId) andConditions.push({ storeId: storeId }); // Lọc theo storeId
        if (search) {
            andConditions.push({
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { serialCode: { $regex: search, $options: 'i' } }
                ]
            });
        }
        
        let searchQuery = {};
        if (andConditions.length === 1) searchQuery = andConditions[0];
        else if (andConditions.length > 1) searchQuery = { $and: andConditions };
        
        const sortQuery = {};
        sortQuery[sortBy] = sortOrder === 'desc' ? -1 : 1;
        
        const items = await Item
            .find(searchQuery)
            .populate('item_type', 'name code')
            .populate('storeId', 'name location')
            .sort(sortQuery)
            .skip(skip)
            .limit(limitNum);
        
        const totalCount = await Item.countDocuments(searchQuery);
        const totalPages = Math.ceil(totalCount / limitNum);
        
        res.status(200).json({
            success: true,
            data: items, // Trả về thẳng dữ liệu gốc
            pagination: {
                currentPage: pageNum, totalPages, totalCount, limit: limitNum,
                hasNextPage: pageNum < totalPages, hasPrevPage: pageNum > 1
            },
            filters: { search, sortBy, sortOrder, status, item_type, storeId }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/items/:id
const getItemById = async (req, res) => {
    try {
        const { id } = req.params;
        const item = await Item.findById(id).populate('item_type', 'name code').populate('storeId', 'name location');
        if (!item) return res.status(404).json({ success: false, message: "Item not found" });
        
        res.status(200).json({ success: true, data: item });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/items/create
const createItem = async (req, res) => {
    try {
        const {
            name, serialCode, status, item_type, storeId,
            origin, sourceDevice, quality, baseCost, price, warrantyPeriod,
            ram, capacity, color
        } = req.body;

        if (!serialCode || !item_type || !name) {
            return res.status(400).json({ success: false, message: "Thiếu các trường bắt buộc" });
        }

        const newItem = new Item({
            name, serialCode, status: status || "in_stock", item_type,
            storeId: storeId || null, // Nếu rỗng thì lưu là null
            origin: origin || 'new', sourceDevice, quality, baseCost, price, warrantyPeriod,
            ram, capacity, color       
        });

        const savedItem = await newItem.save();
        const populatedItem = await Item.findById(savedItem._id).populate('item_type', 'name code').populate('storeId', 'name location');

        res.status(201).json({ success: true, data: populatedItem });
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ success: false, message: "Mã Serial đã tồn tại" });
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /api/items/update/:id
const updateItem = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };
        
        // FIX: Xử lý chuỗi rỗng của storeId để Mongoose không bị lỗi
        if (updateData.storeId === '') {
            updateData.storeId = null;
        }
        
        const updated = await Item.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        }).populate('item_type', 'name code')
          .populate('storeId', 'name location');
          
        if (!updated) {
            return res.status(404).json({ success: false, message: "Item not found" });
        }

        res.status(200).json({ success: true, message: "Cập nhật thành công", data: updated });
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ success: false, message: "Mã Serial Code đã tồn tại" });
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE /api/items/:id
const deleteItem = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Item.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ success: false, message: "Item not found" });
        res.status(200).json({ success: true, message: "Item deleted successfully", data: deleted });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
const importBatch = async (req, res) => {
    try {
        const { batches } = req.body; // 

        if (!batches || !Array.isArray(batches) || batches.length === 0) {
            return res.status(400).json({ success: false, message: "Danh sách nhập kho trống!" });
        }

        const itemsToInsert = [];
        const dateObj = new Date();
        const dateStr = `${String(dateObj.getDate()).padStart(2, '0')}${String(dateObj.getMonth() + 1).padStart(2, '0')}${String(dateObj.getFullYear()).slice(2)}`;

        // 🌟 LẶP QUA TỪNG LÔ HÀNG TRONG GIỎ
        for (const batch of batches) {
            const {
                item_type, quantity, origin, baseCost, price,
                warrantyPeriod, storeId, color, capacity, ram,
                quality, sourceDevice, batchSuffix
            } = batch;

            const qty = parseInt(quantity, 10);
            if (qty < 1) continue; 

            const typeInfo = await Item_type.findById(item_type);
            if (!typeInfo) continue;

            const typeCode = typeInfo.code; 
            const typeName = typeInfo.name;
            const finalSuffix = batchSuffix ? batchSuffix.trim().toUpperCase() : dateStr;

            // Mã ngẫu nhiên 4 số để chống trùng lặp tuyệt đối khi nhập quá nhanh
            const uniqueFactor = Math.floor(1000 + Math.random() * 9000);

            // SINH LINH KIỆN CHO LÔ NÀY
            for (let i = 1; i <= qty; i++) {
                const idxStr = String(i).padStart(3, '0'); 
                
                // VD: BAT-IP13-180326-8921-001
                const autoSerialCode = `${typeCode}-${finalSuffix}-${uniqueFactor}-${idxStr}`;

                itemsToInsert.push({
                    serialCode: autoSerialCode,
                    name: typeName, 
                    item_type,
                    status: "in_stock",
                    origin: origin || "new",
                    baseCost: baseCost || 0,
                    price: price || 0,
                    warrantyPeriod: warrantyPeriod || 0,
                    storeId: storeId, 
                    color: color || "",
                    capacity: capacity || "",
                    ram: ram || "",
                    quality: quality || "",
                    sourceDevice: sourceDevice || ""
                });
            }
        }

        if (itemsToInsert.length === 0) {
            return res.status(400).json({ success: false, message: "Không có sản phẩm hợp lệ để nhập." });
        }

        // 🌟 LƯU TOÀN BỘ HÀNG TRĂM SẢN PHẨM VÀO DB SIÊU TỐC
        const savedItems = await Item.insertMany(itemsToInsert);

        res.status(201).json({
            success: true,
            message: `Đã nhập thành công tổng cộng ${itemsToInsert.length} linh kiện vào kho.`,
            data: savedItems
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: "Trùng lặp mã Serial Code do có lô hàng đã tồn tại." });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { 
    importBatch, getAllItems, getItemsPaginatedAndSearch, getItemById, createItem, updateItem, deleteItem,
    generateItemQRCode
};
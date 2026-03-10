const Item = require("../models/Item");

// GET /api/items/all
const getAllItems = async (req, res) => {
    try {
        const items = await Item.find()
            .populate('item_type', 'name code')
            .populate('storeId', 'name location'); // Chú ý: trong file stores.json bạn dùng trường "location" chứ ko phải "address"
        
        res.status(200).json({
            success: true,
            data: items, // Trả về thẳng dữ liệu gốc
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

module.exports = { getAllItems, getItemsPaginatedAndSearch, getItemById, createItem, updateItem, deleteItem };
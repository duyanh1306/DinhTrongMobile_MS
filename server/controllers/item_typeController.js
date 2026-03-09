const Item_types = require("../models/Item_type");

// GET /api/item_types/all
const getAllItemTypes = async (req, res) => {
    try {
        const item_types = await Item_types.find();
        res.status(200).json({ success: true, data: item_types });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/item_types
const getItemTypePaginatedAndSearch = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', sortBy = 'name', sortOrder = 'asc' } = req.query;
        
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        
        let searchQuery = {};
        if (search) {
            searchQuery = {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { code: { $regex: search, $options: 'i' } }
                ]
            };
        }
        
        const sortQuery = {};
        sortQuery[sortBy] = sortOrder === 'desc' ? -1 : 1;
        
        const itemTypes = await Item_types.find(searchQuery).sort(sortQuery).skip(skip).limit(limitNum);
        const totalCount = await Item_types.countDocuments(searchQuery);
        const totalPages = Math.ceil(totalCount / limitNum);
        
        res.status(200).json({
            success: true,
            data: itemTypes,
            pagination: {
                currentPage: pageNum, totalPages, totalCount, limit: limitNum,
                hasNextPage: pageNum < totalPages, hasPrevPage: pageNum > 1,
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/item_types/create
const createItemType = async (req, res) => {
    try {
        const { name, code } = req.body;
        if (!name || !code) {
            return res.status(400).json({ success: false, message: "Thiếu các trường bắt buộc" });
        }

        // Lấy đường dẫn ảnh nếu có upload
        const imagePath = req.file ? `/uploads/item_types/${req.file.filename}` : "";

        const newItemType = new Item_types({ name, code, image: imagePath });
        const savedItemType = await newItemType.save();

        res.status(201).json({ success: true, data: savedItemType });
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ message: "Loại linh kiện hoặc Mã đã tồn tại" });
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /api/item_types/update/:id
const updateItemType = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, code } = req.body;

        let updateData = { name, code };

        // Nếu người dùng có chọn ảnh mới thì cập nhật, không thì giữ nguyên ảnh cũ
        if (req.file) {
            updateData.image = `/uploads/item_types/${req.file.filename}`;
        } else if (req.body.image) {
            updateData.image = req.body.image;
        }

        const updated = await Item_types.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
        
        if (!updated) return res.status(404).json({ success: false, message: "Không tìm thấy Loại linh kiện" });

        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ message: "Loại linh kiện hoặc Mã đã tồn tại" });
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAllItemTypes, getItemTypePaginatedAndSearch, createItemType, updateItemType };
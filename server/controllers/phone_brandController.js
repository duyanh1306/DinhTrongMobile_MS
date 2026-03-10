const PhoneBrand = require("../models/PhoneBrand");

// Lấy tất cả (dùng cho dropdown)
const getAllBrands = async (req, res) => {
    try {
        const brands = await PhoneBrand.find().sort({ name: 1 });
        res.status(200).json({ success: true, data: brands });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Lấy danh sách có phân trang và tìm kiếm
const getBrandsPaginatedAndSearch = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        
        let searchQuery = {};
        if (search) {
            searchQuery.name = { $regex: search, $options: 'i' };
        }
        
        const brands = await PhoneBrand.find(searchQuery).sort({ name: 1 }).skip(skip).limit(limitNum);
        const totalCount = await PhoneBrand.countDocuments(searchQuery);
        const totalPages = Math.ceil(totalCount / limitNum);
        
        res.status(200).json({
            success: true,
            data: brands,
            pagination: {
                currentPage: pageNum, totalPages, totalCount, limit: limitNum,
                hasNextPage: pageNum < totalPages, hasPrevPage: pageNum > 1
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Tạo mới
const createBrand = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || name.trim() === "") {
            return res.status(400).json({ success: false, message: "Tên hãng không được để trống" });
        }

        const newBrand = new PhoneBrand({ name: name.trim() });
        const savedBrand = await newBrand.save();
        res.status(201).json({ success: true, data: savedBrand });
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ success: false, message: "Tên hãng này đã tồn tại" });
        res.status(500).json({ success: false, message: error.message });
    }
};

// Cập nhật
const updateBrand = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        
        if (!name || name.trim() === "") {
            return res.status(400).json({ success: false, message: "Tên hãng không được để trống" });
        }

        const updated = await PhoneBrand.findByIdAndUpdate(id, { name: name.trim() }, { new: true, runValidators: true });
        if (!updated) return res.status(404).json({ success: false, message: "Không tìm thấy hãng" });

        res.status(200).json({ success: true, message: "Cập nhật thành công", data: updated });
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ success: false, message: "Tên hãng này đã tồn tại" });
        res.status(500).json({ success: false, message: error.message });
    }
};

// Xóa
const deleteBrand = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await PhoneBrand.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ success: false, message: "Không tìm thấy hãng" });
        res.status(200).json({ success: true, message: "Đã xóa thành công", data: deleted });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAllBrands, getBrandsPaginatedAndSearch, createBrand, updateBrand, deleteBrand };
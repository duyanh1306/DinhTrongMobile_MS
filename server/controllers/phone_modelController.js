const Phone_model = require("../models/Phone_model");
const Phone_brand = require("../models/PhoneBrand");

// GET /api/phone_models/all
const getAllPhoneModels = async (req, res) => {
    try {
        const phone_models = await Phone_model.find()
            .populate("brand", "name")
        res.status(200).json({ success: true, data: phone_models });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// POST /api/phone_models/create
const createPhoneModel = async (req, res) => {
    try {
        let { name, brand, condition, specifications, compatibleItemTypes } = req.body;
        
        let image = "";
        // Nếu có file ảnh gửi lên, lấy đường dẫn từ Cloudinary
        if (req.file) {
            image = req.file.path; 
        }

        const newPhoneModel = new Phone_model({
            name, 
            brand, 
            image, // Lưu ảnh vào DB
            condition: condition !== undefined ? condition : 1, 
            specifications: typeof specifications === 'string' ? JSON.parse(specifications) : (specifications || {}),
            compatibleItemTypes: typeof compatibleItemTypes === 'string' ? JSON.parse(compatibleItemTypes) : (compatibleItemTypes || [])
        });

        const savedPhoneModel = await newPhoneModel.save();
        res.status(201).json({ success: true, message: "Tạo thành công", data: savedPhoneModel });
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ message: "Tên máy đã tồn tại" });
        return res.status(500).json({ success: false, error: error.message });
    }
};

// PUT /api/phone_models/update/:id
const updatePhoneModel = async (req, res) => {
    try {
        const { id } = req.params;
        let updateData = { ...req.body };

        // QUAN TRỌNG: Ghi đè link ảnh mới nếu người dùng có up ảnh
        if (req.file) {
            updateData.image = req.file.path; 
        }
        
        if (updateData.specifications && typeof updateData.specifications === 'string') {
            updateData.specifications = JSON.parse(updateData.specifications);
        }
        if (updateData.compatibleItemTypes && typeof updateData.compatibleItemTypes === 'string') {
            updateData.compatibleItemTypes = JSON.parse(updateData.compatibleItemTypes);
        }

        const updated = await Phone_model.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
        if (!updated) return res.status(404).json({ success: false, message: "Không tìm thấy máy" });
        
        res.status(200).json({ success: true, message: "Cập nhật thành công", data: updated });
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ message: "Tên máy đã tồn tại" });
        return res.status(500).json({ success: false, error: error.message });
    }
};

// GET /api/phone_models
const getPhoneModelPaginatedAndSearch = async (req, res) => {
    try {
        // FIX 1: THÊM BIẾN brand VÀO ĐỂ BẮT ĐƯỢC LỌC TỪ FRONTEND
        const { page = 1, limit = 10, search = '', brand = '', sortBy = 'name', sortOrder = 'asc' } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        
        // FIX 2: TÁCH RIÊNG LOGIC TÌM KIẾM THEO TÊN VÀ LỌC THEO HÃNG
        let andConditions = [];

        // Chỉ tìm text Regex trên trường Name
        if (search) {
            andConditions.push({ name: { $regex: search, $options: 'i' } });
        }
        
        // Lọc chính xác theo ID Hãng
        if (brand) {
            andConditions.push({ brand: brand });
        }
        
        let searchQuery = {};
        if (andConditions.length > 0) {
            searchQuery = { $and: andConditions };
        }
        
        const sortQuery = {};
        sortQuery[sortBy] = sortOrder === 'desc' ? -1 : 1;
        
        const phoneModels = await Phone_model
            .find(searchQuery)
            .populate('brand', 'name') // Lấy cả tên Hãng ra cho đẹp
            .populate('compatibleItemTypes', 'name code')
            .sort(sortQuery)
            .skip(skip)
            .limit(limitNum);
        
        const totalCount = await Phone_model.countDocuments(searchQuery);
        const totalPages = Math.ceil(totalCount / limitNum);
        
        res.status(200).json({
            success: true,
            data: phoneModels,
            pagination: {
                currentPage: pageNum, totalPages, totalCount, limit: limitNum,
                hasNextPage: pageNum < totalPages, hasPrevPage: pageNum > 1
            },
            filters: { search, brand, sortBy, sortOrder }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    getAllPhoneModels,
    createPhoneModel,
    updatePhoneModel,
    getPhoneModelPaginatedAndSearch
};
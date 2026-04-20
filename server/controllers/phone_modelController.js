const Phone_model = require("../models/Phone_model");
const Phone_brand = require("../models/PhoneBrand");
const Phone = require("../models/Phone"); 

const getAllPhoneModels = async (req, res) => {
    try {
    
        const phone_models = await Phone_model.find().populate('brand', 'name').lean();

    
        const stockCounts = await Phone.aggregate([
            { $match: { status: 'in_stock' } },
            { $group: { _id: '$phoneModelId', count: { $sum: 1 } } }
        ]);

        const stockMap = {};
        stockCounts.forEach(item => {
            stockMap[item._id.toString()] = item.count;
        });

        const modelsWithStock = phone_models.map(model => ({
            ...model,
            stockCount: stockMap[model._id.toString()] || 0
        }));

        res.status(200).json({ success: true, data: modelsWithStock });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const createPhoneModel = async (req, res) => {
    try {
        let { name, brand, specifications } = req.body;
        
        let image = "";
        if (req.file) image = req.file.path; 

        const newPhoneModel = new Phone_model({
            name, brand, image, 
            specifications: typeof specifications === 'string' ? JSON.parse(specifications) : (specifications || {})
        });

        const savedPhoneModel = await newPhoneModel.save();
        res.status(201).json({ success: true, message: "Tạo thành công", data: savedPhoneModel });
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ message: "Tên máy đã tồn tại" });
        return res.status(500).json({ success: false, error: error.message });
    }
};


const updatePhoneModel = async (req, res) => {
    try {
        const { id } = req.params;
        let updateData = { ...req.body };

        if (req.file) updateData.image = req.file.path; 
        
        if (updateData.specifications && typeof updateData.specifications === 'string') {
            updateData.specifications = JSON.parse(updateData.specifications);
        }
        delete updateData.condition;
        delete updateData.compatibleItemTypes;

        const updated = await Phone_model.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
        if (!updated) return res.status(404).json({ success: false, message: "Không tìm thấy máy" });
        
        res.status(200).json({ success: true, message: "Cập nhật thành công", data: updated });
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ message: "Tên máy đã tồn tại" });
        return res.status(500).json({ success: false, error: error.message });
    }
};
const deletePhoneModel = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Phone_model.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ success: false, message: "Không tìm thấy dòng máy" });
        
        res.status(200).json({ success: true, message: "Xóa thành công" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
const getPhoneModelPaginatedAndSearch = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', brand = '', sortBy = 'name', sortOrder = 'asc' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        
        let andConditions = [];
        if (search) andConditions.push({ name: { $regex: search, $options: 'i' } });
        if (brand) andConditions.push({ brand: brand });
        
        let searchQuery = {};
        if (andConditions.length > 0) searchQuery = { $and: andConditions };
        
        const sortQuery = {};
        sortQuery[sortBy] = sortOrder === 'desc' ? -1 : 1;
        
        const phoneModels = await Phone_model
            .find(searchQuery)
            .populate('brand', 'name') 
            .sort(sortQuery)
            .skip(skip)
            .limit(limitNum);
        
        const totalCount = await Phone_model.countDocuments(searchQuery);
        const totalPages = Math.ceil(totalCount / limitNum);
        
        res.status(200).json({
            success: true, data: phoneModels,
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

module.exports = { getAllPhoneModels, createPhoneModel, updatePhoneModel, deletePhoneModel, getPhoneModelPaginatedAndSearch };
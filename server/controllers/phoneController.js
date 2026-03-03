const Phone = require("../models/phone");

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

        // Xử lý up thêm ảnh thực tế
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => file.path);
            
            // Xử lý giữ lại ảnh cũ nếu Frontend có truyền mảng retainedImages lên
            if (req.body.retainedImages) {
                let retained = JSON.parse(req.body.retainedImages);
                updateData.specificImages = [...retained, ...newImages];
            } else {
                updateData.specificImages = newImages; // Đè ảnh mới
            }
        }

        const updatedPhone = await Phone.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
        if (!updatedPhone) return res.status(404).json({ success: false, message: "Không tìm thấy máy" });

        res.status(200).json({ success: true, message: "Cập nhật máy thành công", data: updatedPhone });
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ message: "Số IMEI này đã tồn tại trong hệ thống!" });
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getPhonesPaginatedAndSearch,
    getAllPhones,
    createPhone,
    updatePhone
};
const Item_types = require("../models/Item_type");
const Recipe = require("../models/Recipe"); // Bắt buộc phải có dòng này

const getAllItemTypes = async (req, res) => {
    try {
        const item_types = await Item_types.find();
        res.status(200).json({ success: true, data: item_types });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

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

const createItemType = async (req, res) => {
    try {
        const { name, code } = req.body;
        if (!name || !code) {
            return res.status(400).json({ success: false, message: "Thiếu các trường bắt buộc" });
        }

        const imagePath = req.file ? req.file.path : "";
        const newItemType = new Item_types({ name, code, image: imagePath });
        const savedItemType = await newItemType.save();

        // 🌟 LOGIC LIÊN KẾT NHANH CỰC KỲ AN TOÀN 🌟
        if (req.body.linkedRecipes) {
            try {
                const links = JSON.parse(req.body.linkedRecipes);
                for (let link of links) {
                    // 1. Tìm Recipe trong Database
                    const recipe = await Recipe.findById(link.recipeId);
                    if (recipe) {
                        // 2. Tìm cái Slot linh kiện khớp tên
                        const part = recipe.requiredParts.find(p => p.name === link.partName);
                        if (part) {
                            // 3. Kiểm tra xem đã có ID này trong mảng chưa, chưa có thì push vào
                            const alreadyExists = part.acceptedItemTypes.some(id => id.toString() === savedItemType._id.toString());
                            if (!alreadyExists) {
                                part.acceptedItemTypes.push(savedItemType._id);
                                await recipe.save(); // Lưu lại thay đổi
                                console.log(`[THÀNH CÔNG] Đã thêm ${name} vào công thức.`);
                            }
                        } else {
                            console.log(`[LỖI] Không tìm thấy Slot có tên: ${link.partName}`);
                        }
                    }
                }
            } catch (err) {
                console.error("[LỖI SERVER] Không thể liên kết công thức:", err);
            }
        }

        res.status(201).json({ success: true, data: savedItemType });
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ message: "Loại linh kiện hoặc Mã đã tồn tại" });
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateItemType = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, code } = req.body;

        let updateData = { name, code };

        if (req.file) {
            updateData.image = req.file.path;
        } else if (req.body.image) {
            updateData.image = req.body.image;
        }

        const updated = await Item_types.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
        if (!updated) return res.status(404).json({ success: false, message: "Không tìm thấy" });

        // 🌟 LOGIC LIÊN KẾT NHANH KHI CẬP NHẬT 🌟
        if (req.body.linkedRecipes) {
            try {
                const links = JSON.parse(req.body.linkedRecipes);
                for (let link of links) {
                    const recipe = await Recipe.findById(link.recipeId);
                    if (recipe) {
                        const part = recipe.requiredParts.find(p => p.name === link.partName);
                        if (part) {
                            const alreadyExists = part.acceptedItemTypes.some(itemTypeId => itemTypeId.toString() === updated._id.toString());
                            if (!alreadyExists) {
                                part.acceptedItemTypes.push(updated._id);
                                await recipe.save();
                                console.log(`[THÀNH CÔNG] Đã liên kết cập nhật vào công thức.`);
                            }
                        }
                    }
                }
            } catch (err) {
                console.error("[LỖI SERVER] Không thể liên kết công thức:", err);
            }
        }

        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ message: "Loại linh kiện hoặc Mã đã tồn tại" });
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAllItemTypes, getItemTypePaginatedAndSearch, createItemType, updateItemType };
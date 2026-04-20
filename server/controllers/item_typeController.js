const Item_type = require("../models/Item_type"); 
const Recipe = require("../models/Recipe"); 
const Item = require("../models/Item");

const getAllItemTypes = async (req, res) => {
    try {
        const itemTypes = await Item_type.find().lean();
        const stockCounts = await Item.aggregate([
            { $match: { status: 'in_stock' } },
            { $group: { _id: '$item_type', count: { $sum: 1 } } }
        ]);

        const stockMap = {};
        stockCounts.forEach(item => {
            if(item._id) stockMap[item._id.toString()] = item.count;
        });

        const typesWithStock = itemTypes.map(type => ({
            ...type,
            stockCount: stockMap[type._id.toString()] || 0
        }));

        res.status(200).json({ success: true, data: typesWithStock });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const getItemTypePaginatedAndSearch = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', sortBy = 'name', sortOrder = 'asc' } = req.query;
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
        
        let itemTypes = [];
        if (parseInt(limit) >= 100) {
            itemTypes = await Item_type.find(searchQuery).sort(sortQuery).lean();
        } else {
            const skip = (parseInt(page) - 1) * parseInt(limit);
            itemTypes = await Item_type.find(searchQuery).sort(sortQuery).skip(skip).limit(parseInt(limit)).lean();
        }

        const stockCounts = await Item.aggregate([
            { $match: { status: 'in_stock' } },
            { $group: { _id: '$item_type', count: { $sum: 1 } } }
        ]);

        const stockMap = {};
        stockCounts.forEach(item => {
            if(item._id) stockMap[item._id.toString()] = item.count;
        });

        const typesWithStock = itemTypes.map(type => ({
            ...type,
            stockCount: stockMap[type._id.toString()] || 0
        }));

        const totalCount = await Item_type.countDocuments(searchQuery);
        res.status(200).json({
            success: true,
            data: typesWithStock,
            pagination: {
                currentPage: parseInt(page), 
                totalPages: Math.ceil(totalCount / parseInt(limit)), 
                totalCount, 
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const createItemType = async (req, res) => {
    try {
        const { name, code } = req.body;
        if (!name || !code) return res.status(400).json({ success: false, message: "Thiếu các trường bắt buộc" });

        const imagePath = req.file ? req.file.path : (req.body.image || "");
        const newItemType = new Item_type({ name, code, image: imagePath });
        const savedItemType = await newItemType.save();

        if (req.body.linkedRecipes) {
            try {
                const links = JSON.parse(req.body.linkedRecipes);
                for (let link of links) {
                    const recipe = await Recipe.findById(link.recipeId);
                    if (recipe) {
                        const part = recipe.requiredParts.find(p => p.name === link.partName);
                        if (part) {
                            const alreadyExists = part.acceptedItemTypes.some(id => id.toString() === savedItemType._id.toString());
                            if (!alreadyExists) {
                                part.acceptedItemTypes.push(savedItemType._id);
                                await recipe.save();
                            }
                        }
                    }
                }
            } catch (err) { console.error(err); }
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
        if (req.file) updateData.image = req.file.path;
        else if (req.body.image) updateData.image = req.body.image;

        const updated = await Item_type.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
        if (!updated) return res.status(404).json({ success: false, message: "Không tìm thấy" });

        if (req.body.linkedRecipes) {
            try {
                await Recipe.updateMany(
                    { "requiredParts.acceptedItemTypes": updated._id },
                    { $pull: { "requiredParts.$[].acceptedItemTypes": updated._id } }
                );
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
                            }
                        }
                    }
                }
            } catch (err) { 
                console.error("Lỗi cập nhật Recipe:", err); 
            }
        }
        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ message: "Loại linh kiện hoặc Mã đã tồn tại" });
        res.status(500).json({ success: false, message: error.message });
    }
};
const deleteItemType = async (req, res) => {
    try {
        await Item_type.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "Deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAllItemTypes, getItemTypePaginatedAndSearch, createItemType, updateItemType, deleteItemType };
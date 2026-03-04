const Item = require("../models/Item");

// GET /api/items/all
const getAllItems = async (req, res) => {
    try {
        const items = await Item.find()
            .populate('item_type', 'name code')
            .populate('storeId', 'name address');
        
        const mappedItems = items.map(item => ({
            ...item.toObject(),
            name: item.name || item.serialCode,
            item_type: item.item_type,
            store: item.storeId,
        }));

        console.log(`Fetched ${items.length} items (all items)`);

        res.status(200).json({
            success: true,
            message: "Items retrieved successfully",
            data: mappedItems,
        });
    } catch (error) {
        console.error("Error getting all items:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

// GET /api/items
const getItemsPaginatedAndSearch = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', sortBy = 'name', sortOrder = 'asc', status = '', item_type = '', store = '' } = req.query;
        
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        
        let andConditions = [];
        
        if (item_type) {
            andConditions.push({
                $or: [
                    { item_type: item_type },
                    { itemTypeId: item_type }
                ]
            });
        }
        
        if (status) {
            andConditions.push({ status: status });
        }
        if (store) {
            andConditions.push({ storeId: store });
        }
        
        if (search) {
            andConditions.push({
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { serialCode: { $regex: search, $options: 'i' } }
                ]
            });
        }
        
        // Build final query
        let searchQuery = {};
        if (andConditions.length === 1) {
            searchQuery = andConditions[0];
        } else if (andConditions.length > 1) {
            searchQuery = { $and: andConditions };
        }
        
        console.log(`Fetching items with query: ${Object.keys(searchQuery).length} filter(s)`);
        
        const sortQuery = {};
        sortQuery[sortBy] = sortOrder === 'desc' ? -1 : 1;
        
        const items = await Item
            .find(searchQuery)
            .populate('item_type', 'name code')
            .populate('itemTypeId', 'name code')
            .populate('storeId', 'name address')
            .sort(sortQuery)
            .skip(skip)
            .limit(limitNum);
        
        const mappedItems = items.map(item => ({
            ...item.toObject(),
            name: item.name || item.serialCode,
            item_type: item.item_type || item.itemTypeId,
            store: item.storeId
        }));
        
        const totalCount = await Item.countDocuments(searchQuery);
        console.log(`Fetched ${items.length} items (total: ${totalCount})`);
        
        const totalPages = Math.ceil(totalCount / limitNum);
        const hasNextPage = pageNum < totalPages;
        const hasPrevPage = pageNum > 1;
        
        res.status(200).json({
            success: true,
            message: "Items retrieved successfully",
            data: mappedItems,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalCount,
                limit: limitNum,
                hasNextPage,
                hasPrevPage,
                nextPage: hasNextPage ? pageNum + 1 : null,
                prevPage: hasPrevPage ? pageNum - 1 : null
            },
            filters: {
                search,
                sortBy,
                sortOrder,
                status,
                item_type,
                store
            }
        });
    } catch (error) {
        console.error("Error getting paginated items:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

// GET /api/items/:id
const getItemById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const item = await Item.findById(id)
            .populate('item_type', 'name code')
            .populate('itemTypeId', 'name code')
            .populate('storeId', 'name address');
        
        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Item not found"
            });
        }
        
        const mappedItem = {
            ...item.toObject(),
            name: item.name || item.serialCode,
            item_type: item.item_type || item.itemTypeId,
            store: item.storeId
        };
        
        console.log(`Fetched item: ${item.serialCode}`);

        res.status(200).json({
            success: true,
            message: "Item retrieved successfully",
            data: mappedItem
        });
    } catch (error) {
        console.error("Error getting item by ID:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

// POST /api/items/create
const createItem = async (req, res) => {
    try {
        const {
            serialCode,
            status,
            item_type,
            phoneModelId,
            storeId
        } = req.body;

        if (!serialCode || !item_type) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: serialCode and item_type are required",
            });
        }

        const newItem = new Item({
            name: serialCode,
            serialCode,
            status: status || "in_stock",
            item_type,
            phoneModelId,
            storeId
        });

        const savedItem = await newItem.save();
        const populatedItem = await Item.findById(savedItem._id).populate('item_type', 'name code').populate('phoneModelId', 'name code').populate('storeId', 'name address');

        res.status(201).json({
            success: true,
            message: "Item created successfully",
            data: populatedItem,
        });
    } catch (error) {
        console.error("Error creating item:", error);

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Item with this name and serialCode already exists"
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

// PUT /api/items/update/:id
const updateItem = async (req, res) => {
    try {
        const { id } = req.params;
        
        const updateData = { ...req.body };
        if (updateData.serialCode) {
            updateData.name = updateData.serialCode;
        }
                const updated = await Item.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        }).populate('item_type', 'name code')
          .populate('phoneModelId', 'name brand compatibleItemTypes')
          .populate('storeId', 'name address');
                if (!updated) {
            return res
                .status(404)
                .json({ success: false, message: "Item not found" });
        }

        const mappedItem = {
            ...updated.toObject(),
            name: updated.name || updated.serialCode,
            item_type: updated.item_type,
            phoneModelId: updated.phoneModelId,
            store: updated.storeId
        };

        res.status(200).json({
            success: true,
            message: "Item updated successfully",
            data: mappedItem,
        });
    } catch (error) {
        console.error("Error updating item:", error);

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Item with this name and serialCode already exists"
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

// DELETE /api/items/:id
const deleteItem = async (req, res) => {
    try {
        const { id } = req.params;

        const deleted = await Item.findByIdAndDelete(id);

        if (!deleted) {
            return res
                .status(404)
                .json({ success: false, message: "Item not found" });
        }

        res.status(200).json({
            success: true,
            message: "Item deleted successfully",
            data: deleted,
        });
    } catch (error) {
        console.error("Error deleting item:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

module.exports = {
    getAllItems,
    getItemsPaginatedAndSearch,
    getItemById,
    createItem,
    updateItem,
    deleteItem
};
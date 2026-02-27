const Item = require("../models/Item");

// GET /api/items/all
const getAllItems = async (req, res) => {
    try {
        const items = await Item.find()
            .populate('item_type', 'name code')
            .populate('itemTypeId', 'name code')
            .populate('store', 'name address')
            .populate('storeId', 'name address');
        
        // Map the data to handle both old and new field names
        const mappedItems = items.map(item => ({
            ...item.toObject(),
            name: item.name || item.serialCode, // Use serialCode as fallback for name
            item_type: item.item_type || item.itemTypeId,
            store: item.store || item.storeId
        }));

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
        
        let searchQuery = {};
        if (search) {
            searchQuery = {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { serialCode: { $regex: search, $options: 'i' } }
                ]
            };
        }
        
        if (status) {
            searchQuery.status = status;
        }
        
        if (item_type) {
            searchQuery.item_type = item_type;
        }
        
        if (store) {
            searchQuery.store = store;
        }
        
        const sortQuery = {};
        sortQuery[sortBy] = sortOrder === 'desc' ? -1 : 1;
        
        const items = await Item
            .find(searchQuery)
            .populate('item_type', 'name code')
            .populate('itemTypeId', 'name code')
            .populate('store', 'name address')
            .populate('storeId', 'name address')
            .sort(sortQuery)
            .skip(skip)
            .limit(limitNum);
        
        // Map the data to handle both old and new field names
        const mappedItems = items.map(item => ({
            ...item.toObject(),
            name: item.name || item.serialCode, // Use serialCode as fallback for name
            item_type: item.item_type || item.itemTypeId,
            store: item.store || item.storeId
        }));
        
        const totalCount = await Item.countDocuments(searchQuery);
        
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
            .populate('store', 'name address')
            .populate('storeId', 'name address');
        
        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Item not found"
            });
        }
        
        // Map the data to handle both old and new field names
        const mappedItem = {
            ...item.toObject(),
            name: item.name || item.serialCode, // Use serialCode as fallback for name
            item_type: item.item_type || item.itemTypeId,
            store: item.store || item.storeId
        };
        
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
            store
        } = req.body;

        if (!serialCode || !item_type) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: serialCode and item_type are required",
            });
        }

        const newItem = new Item({
            name: serialCode, // Use serialCode as name
            serialCode,
            status: status || "available",
            item_type,
            store
        });

        const savedItem = await newItem.save();
        const populatedItem = await Item.findById(savedItem._id).populate('item_type', 'name code').populate('store', 'name address');

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
        
        // If serialCode is being updated, also update the name to match
        const updateData = { ...req.body };
        if (updateData.serialCode) {
            updateData.name = updateData.serialCode;
        }

        const updated = await Item.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        }).populate('item_type', 'name code')
          .populate('itemTypeId', 'name code')
          .populate('store', 'name address')
          .populate('storeId', 'name address');

        if (!updated) {
            return res
                .status(404)
                .json({ success: false, message: "Item not found" });
        }

        // Map the data to handle both old and new field names
        const mappedItem = {
            ...updated.toObject(),
            name: updated.name || updated.serialCode, // Use serialCode as fallback for name
            item_type: updated.item_type || updated.itemTypeId,
            store: updated.store || updated.storeId
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
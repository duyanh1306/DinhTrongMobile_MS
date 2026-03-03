const Item_types = require("../models/Item_type");

// GET /api/item_types/all
const getAllItemTypes = async (req, res) => {
    try {
        const item_types = await Item_types.find()

        res.status(200).json({
            success: true,
            message: "Item types retrieved successfully",
            data: item_types,
        });
    } catch (error) {
        console.error("Error getting all item types:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
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
        
        const itemTypes = await Item_types
            .find(searchQuery)
            .sort(sortQuery)
            .skip(skip)
            .limit(limitNum);
        
        const totalCount = await Item_types.countDocuments(searchQuery);
        
        const totalPages = Math.ceil(totalCount / limitNum);
        const hasNextPage = pageNum < totalPages;
        const hasPrevPage = pageNum > 1;
        
        res.status(200).json({
            success: true,
            message: "Item types retrieved successfully",
            data: itemTypes,
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
                sortOrder
            }
        });
    } catch (error) {
        console.error("Error getting paginated item types:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

// POST /api/item_types/create
const createItemType = async (req, res) => {
    try {
        const {
            name,
            code,
            price,
            baseCost
        } = req.body;

        if (
            !name ||
            !code ||
            !price ||
            !baseCost
        ) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields",
            });
        }

        const newItemType = new Item_types({
            name,
            code,
            price,
            baseCost
        });

        const savedItemType = await newItemType.save();

        res.status(201).json({
            success: true,
            message: "Item type created successfully",
            data: savedItemType,
        });
    } catch (error) {
        console.error("Error creating item type:", error);

        if (error.code === 11000) {
            return res.status(400).json({
                message: "Item_type with this name and code already exists"
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({
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

// PUT /api/item_types/update/:id
const updateItemType = async (req, res) => {
    try {
        const { id } = req.params;

        const updated = await Item_types.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true,
        })
        if (!updated)
            return res
                .status(404)
                .json({ success: false, message: "Item type not found" });

        res.status(200).json({
            success: true,
            message: "Item types updated successfully",
            data: updated,
        });
    } catch (error) {
        console.error("Error updating item tpye:", error);

        if (error.code === 11000) {
            return res.status(400).json({
                message: "Item_type with this name and code already exists"
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({
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


module.exports = {
    getAllItemTypes,
    getItemTypePaginatedAndSearch,
    createItemType,
    updateItemType
};

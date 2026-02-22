const Phone_model = require("../models/Phone_model");

//  GET /api/phone_models/all
const getAllPhoneModels = async (req, res) => {
    try{
        const phone_models = await Phone_model.find()
        res.status(200).json({
            success: true,
            message: "Phone models retrieved successfully",
            data: phone_models,
        })
    }catch(error){
        console.error("Error getting all phone models:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        })
    }
}

// POST /api/phone_models/create
const createPhoneModel = async (req, res) => {
    try {
        const {
            name,
            brand
        } = req.body;

        const newPhoneModel = new Phone_model({
            name,
            brand
        });

        const savedPhoneModel = await newPhoneModel.save();

        res.status(201).json({
            success: true,
            message: "Phone model created successfully",
            data: savedPhoneModel,
        });
    } catch (error) {
        console.error("Error creating  phone model:", error);

        if (error.code === 11000) {
            return res.status(400).json({
                message: "Item with this name already exists"
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });


    }
};

// PUT /api/phone_models/update/:id
const updatePhoneModel = async (req, res) => {
    try {
        const { id } = req.params;

        const updated = await Phone_model.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true,
        })
        if (!updated)
            return res
                .status(404)
                .json({ success: false, message: "Phone model not found" });

        res.status(200).json({
            success: true,
            message: "Phone model updated successfully",
            data: updated,
        });
    } catch (error) {
        console.error("Error updating phone model:", error);
        if (error.code === 11000) {
            return res.status(400).json({
                message: "Item with this name already exists"
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({
                message: err.message
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

// GET /api/phone_models
const getPhoneModelPaginatedAndSearch = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', sortBy = 'modelName', sortOrder = 'asc' } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        
        let searchQuery = {};
        if (search) {
            searchQuery = {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { brand: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ]
            };
        }
        
        const sortQuery = {};
        sortQuery[sortBy] = sortOrder === 'desc' ? -1 : 1;
        
        const phoneModels = await Phone_model
            .find(searchQuery)
            .sort(sortQuery)
            .skip(skip)
            .limit(limitNum);
        
        const totalCount = await Phone_model.countDocuments(searchQuery);
        
        const totalPages = Math.ceil(totalCount / limitNum);
        const hasNextPage = pageNum < totalPages;
        const hasPrevPage = pageNum > 1;
        
        res.status(200).json({
            success: true,
            message: "Phone models retrieved successfully",
            data: phoneModels,
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
        console.error("Error getting paginated phone models:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

module.exports = {
    getAllPhoneModels,
    createPhoneModel,
    updatePhoneModel,
    getPhoneModelPaginatedAndSearch
};

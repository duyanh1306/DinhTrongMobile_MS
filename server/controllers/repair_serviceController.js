const Repair_service = require("../models/Repair_service");

// GET /api/repair_services
const getRepairServices = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', sortBy = 'name', sortOrder = 'asc' } = req.query;
        const skip = (page - 1) * limit;
        
        let searchQuery = {};
        if (search) {
            searchQuery = {
                name: { $regex: search, $options: 'i' }
            };
        }
        
        const sortQuery = {};
        sortQuery[sortBy] = sortOrder === 'desc' ? -1 : 1;
        
        const totalCount = await Repair_service.countDocuments(searchQuery);
        
        const repairServices = await Repair_service.find(searchQuery)
            .skip(skip)
            .limit(parseInt(limit))
            .sort(sortQuery);
        
        res.status(200).json({
            success: true,
            data: repairServices,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / limit),
                totalItems: totalCount,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// POST /api/repair_services/create
const createRepairService = async (req, res) => {
    try {
        const { name, price } = req.body;
        
        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Name is required"
            });
        }
        
        const existingService = await Repair_service.findOne({ name });
        if (existingService) {
            return res.status(400).json({
                success: false,
                message: "Repair service with this name already exists"
            });
        }
        
        const repairService = new Repair_service({
            name: name.trim(),
            price: price || 0
        });
        
        await repairService.save();
        
        res.status(201).json({
            success: true,
            data: repairService,
            message: "Repair service created successfully"
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }
        
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// GET /api/repair_services/:id
const updateRepairService = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price } = req.body;
        
        const repairService = await Repair_service.findById(id);
        if (!repairService) {
            return res.status(404).json({
                success: false,
                message: "Repair service not found"
            });
        }
        
        if (name && name !== repairService.name) {
            const existingService = await Repair_service.findOne({ name });
            if (existingService) {
                return res.status(400).json({
                    success: false,
                    message: "Repair service with this name already exists"
                });
            }
        }
        
        if (name) repairService.name = name.trim();
        if (price) repairService.price = price;
        
        await repairService.save();
        
        res.status(200).json({
            success: true,
            data: repairService,
            message: "Repair service updated successfully"
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }
        
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: "Invalid repair service ID"
            });
        }
        
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// GET /api/repair_services/all
const getAllRepairServices = async (req, res) => {
    try {
        const repair_service = await Repair_service.find()

        res.status(200).json({
            success: true,
            message: "Item types retrieved successfully",
            data: repair_service,
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

// DELETE /api/repair_services/:id
const deleteRepairService = async (req, res) => {
    try {
        const { id } = req.params;

        const repairService = await Repair_service.findById(id);
        if (!repairService) {
            return res.status(404).json({
                success: false,
                message: "Repair service not found"
            });
        }

        await Repair_service.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: "Repair service deleted successfully"
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: "Invalid repair service ID"
            });
        }

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getAllRepairServices,
    getRepairServices,
    createRepairService,
    updateRepairService,
    deleteRepairService

}
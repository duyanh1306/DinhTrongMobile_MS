const VietnamLocation = require("../models/VietnamLocation");

exports.getAllLocations = async (req, res) => {
    try {
        const locations = await VietnamLocation.find();
        res.status(200).json(locations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
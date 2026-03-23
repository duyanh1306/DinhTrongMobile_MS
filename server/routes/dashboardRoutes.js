// routes/dashboardRoutes.js
const express = require("express");
const router = express.Router();
const { getDashboardStats } = require("../controllers/dashboardController");

router.get("/", getDashboardStats);

module.exports = router;

// Trong server.js thêm: 
// app.use("/api/dashboard", require("./routes/dashboardRoutes"));
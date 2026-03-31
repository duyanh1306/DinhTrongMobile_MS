const express = require("express");
const cors = require("cors");
const http = require("http");
const path = require("path");
const socketIo = require("socket.io");
require("dotenv").config();
const app = express();
const server = http.createServer(app);
// Cấp quyền cho Frontend được phép truy cập vào thư mục uploads để đọc ảnh
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


const connectDB = require("./connect/database");
const userRoute = require("./routes/userRoute");
const storeRoute = require("./routes/storeRoute");
const roleRoute = require("./routes/roleRoutes");
const item_typeRoute = require("./routes/item_typeRoute");
const itemRoute = require("./routes/itemRoute");
const phone_modelRoute = require("./routes/phone_modelRoute");
const recipeRoute = require("./routes/recipeRoute");
const repair_serviceRoute = require("./routes/repair_serviceRoute");
const purchase_orderRoutes = require("./routes/purchase_orderRoutes");
const { authInternal } = require("./middlewares/auth");
const repair_orderRoutes = require("./routes/repair_orderRoutes");
const inventoryTransactionRoutes = require("./routes/inventory_transactionRoutes");
const transferRequestRoutes = require("./routes/transfer_requestRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const phoneRoute = require("./routes/phoneRoute");
const cartRoute = require("./routes/cartRoute");
const orderRoute = require("./routes/orderRoute");
const phoneBrand = require("./routes/phone_brandRoute");
const review = require("./routes/reviewRoute");
const paymentRoute = require('./routes/paymentRoute');
const warrantyRoutes = require("./routes/warrantyRoutes");
connectDB();

app.use(
    cors({
        origin: true, // Allow all origins
        credentials: true,
    })
);
app.use(express.json());
app.use("/api/users", userRoute);
app.use("/api/stores", storeRoute);
app.use("/api/roles", roleRoute);
app.use("/api/item_types", item_typeRoute);
app.use("/api/items", itemRoute);
app.use("/api/phone_models", phone_modelRoute);
app.use("/api/recipes", recipeRoute);
app.use("/api/repair_services", repair_serviceRoute);
app.use("/api/purchase-orders", purchase_orderRoutes);
app.use("/api/repair-orders", authInternal, repair_orderRoutes);
app.use("/api/warranty", authInternal, warrantyRoutes);
app.use("/api/inventory-transactions", inventoryTransactionRoutes);
app.use("/api/transfer-requests", transferRequestRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/phones", phoneRoute);
app.use("/api/recipes", recipeRoute);
app.use("/api/cart", cartRoute);
app.use("/api/orders", orderRoute);
app.use("/api/phone_brands", phoneBrand);
app.use("/api/reviews", review);
app.use('/api', paymentRoute);
app.get("/", (req, res) => {
    res.status(200).json({ message: "Welcome to ExpressJS" });
});
const PORT = process.env.PORT || 9999;
// const HOSTNAME = process.env.IP_ADDRESS ? new URL(process.env.IP_ADDRESS).hostname : "0.0.0.0";

server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
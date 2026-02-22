const express = require("express");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
require("dotenv").config();
const app = express();
const server = http.createServer(app);



const connectDB = require("./connect/database");
const userRoute = require("./routes/userRoute");
const storeRoute = require("./routes/storeRoute");
const roleRoute = require("./routes/roleRoutes");
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
app.get("/", (req, res) => {
    res.status(200).json({ message: "Welcome to ExpressJS" });
});
const PORT = process.env.PORT || 9999;
const HOSTNAME = "0.0.0.0";

server.listen(PORT, HOSTNAME, () => {
    console.log(`Server is running on http://${HOSTNAME}:${PORT}`);
});
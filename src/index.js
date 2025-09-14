const dotenv = require("dotenv").config();
const express = require("express");
const cors = require("cors");
const {connectDB} = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");

// connect database
connectDB();

// initialize app
const app = express();

// middlewares
app.use(cors());
app.use(express.json());

//routes
app.use("/api/users", userRoutes);
app.use("/api/attendance", attendanceRoutes);

// root endpoint
app.get("/", (req, res) => {
    res.send("Server running successfully, ready to accept client reqest ");
});

// start server
const PORT = process.env.PORT || 6000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

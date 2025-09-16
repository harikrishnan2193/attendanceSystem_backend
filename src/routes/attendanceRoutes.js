const express = require("express");
const attendanceController = require("../controllers/attendanceController");
const { verifyToken } = require("../middleware/authMiddleware");
const { checkUserExists } = require("../middleware/userExistsMiddleware");

const router = express.Router();

router.get("/status/:userId", verifyToken, checkUserExists, attendanceController.getAttendanceStatus);
router.post("/checkin", verifyToken, checkUserExists, attendanceController.checkInController);
router.post("/checkout", verifyToken, checkUserExists, attendanceController.checkOutController);
router.get("/history/:userId", verifyToken, checkUserExists, attendanceController.getAttendanceHistory);

module.exports = router;

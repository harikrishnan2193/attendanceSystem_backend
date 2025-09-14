const express = require("express");
const attendanceController = require("../controllers/attendanceController");
const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/status/:userId", verifyToken, attendanceController.getAttendanceStatus);
router.post("/checkin", verifyToken, attendanceController.checkInController);
router.post("/checkout", verifyToken, attendanceController.checkOutController);

module.exports = router;

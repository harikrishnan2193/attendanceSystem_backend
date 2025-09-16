const express = require("express");
const leaveController = require("../controllers/leaveController");
const { verifyToken } = require("../middleware/authMiddleware");
const { checkUserExists } = require("../middleware/userExistsMiddleware");

const router = express.Router();

router.post("/submit", verifyToken, checkUserExists, leaveController.createLeave);
router.get("/getleaves", verifyToken, checkUserExists, leaveController.getLeaves);
router.put("/update-status", verifyToken, checkUserExists, leaveController.updateLeaveStatus);



module.exports = router;

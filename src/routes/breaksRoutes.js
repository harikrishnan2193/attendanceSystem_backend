const express = require("express");
const breaksController = require("../controllers/breaksController");
const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/status", verifyToken, breaksController.getCurrentBreakStatus);
router.post("/start", verifyToken, breaksController.takeABreak);
router.post("/end", verifyToken, breaksController.endCurrentBreak);

module.exports = router;

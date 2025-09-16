const express = require("express");
const userController = require("../controllers/userController");
const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", userController.registerController);
router.post("/login", userController.loginController);
router.get("/available/:userId", verifyToken, userController.getAvailableUsers);

module.exports = router;

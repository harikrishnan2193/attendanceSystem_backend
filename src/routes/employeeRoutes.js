const express = require("express");
const employeeController = require("../controllers/employeeController");
const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/all/:userId", verifyToken, employeeController.getAllEmployees);
router.delete("/:employeeId", verifyToken, employeeController.deleteEmployee);
router.post("/assign", verifyToken, employeeController.assignNewEmployee);


module.exports = router;
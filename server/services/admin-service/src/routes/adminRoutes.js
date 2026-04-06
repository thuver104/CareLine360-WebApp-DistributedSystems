const express = require("express");
const {
  getUsers,
  getPendingDoctors,
  patchUserStatus,
  getStats,
} = require("../controllers/adminController");
const { authMiddleware, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.use(authMiddleware, requireAdmin);

router.get("/users", getUsers);
router.get("/doctors/pending", getPendingDoctors);
router.patch("/users/:id/status", patchUserStatus);
router.get("/stats", getStats);

module.exports = router;

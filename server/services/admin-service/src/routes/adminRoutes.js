const express = require("express");
const {
  getUsers,
  getPendingDoctors,
  patchUserStatus,
  toggleUserStatus,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  getStats,
} = require("../controllers/adminController");
const { authMiddleware, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.use(authMiddleware, requireAdmin);

router.get("/users", getUsers);
router.post("/users", createUser);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);
router.get("/doctors/pending", getPendingDoctors);
router.patch("/users/:id/status", patchUserStatus);
router.patch("/users/:id/toggle-status", toggleUserStatus);
router.post("/users/:id/reset-password", resetUserPassword);
router.get("/stats", getStats);

module.exports = router;

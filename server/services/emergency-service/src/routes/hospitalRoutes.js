const express = require("express");
const {
  getAllHospitals,
  createHospital,
  deleteHospital,
} = require("../controllers/hospitalController");
const { authMiddleware, roleMiddleware } = require("../middleware/auth");

const router = express.Router();

router.get("/", getAllHospitals);
router.post("/", authMiddleware, roleMiddleware(["admin"]), createHospital);
router.delete("/:id", authMiddleware, roleMiddleware(["admin"]), deleteHospital);

module.exports = router;

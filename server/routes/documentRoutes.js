const express = require("express");
const { authMiddleware, roleMiddleware } = require("../middleware/auth");
const { documentUpload } = require("../middleware/documentUpload");
const {
  uploadMyDocument,
  listMyDocuments,
  deleteMyDocument,
  deleteMyDocumentPermanent,
} = require("../controllers/documentController");

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  roleMiddleware(["patient"]),
  documentUpload.single("document"),
  uploadMyDocument
);

router.get("/", authMiddleware, roleMiddleware(["patient"]), listMyDocuments);

router.delete("/:id", authMiddleware, roleMiddleware(["patient"]), deleteMyDocument);

router.delete(
  "/:id/permanent",
  authMiddleware,
  roleMiddleware(["patient"]),
  deleteMyDocumentPermanent
);

module.exports = router;

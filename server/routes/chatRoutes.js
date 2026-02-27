const express = require("express");
const { authMiddleware, roleMiddleware } = require("../middleware/auth");
const { getMessages, getUnreadCount, getChatInbox } = require("../controllers/chatController");

const router = express.Router();
const chatAuth = [authMiddleware, roleMiddleware(["doctor", "patient"])];

// Chat inbox (list of chats with last message)
router.get("/inbox", chatAuth, getChatInbox);

// Unread count (MUST be before /:appointmentId to avoid route conflict)
router.get("/unread/count", chatAuth, getUnreadCount);

// Message history for a specific appointment
router.get("/:appointmentId", chatAuth, getMessages);

module.exports = router;
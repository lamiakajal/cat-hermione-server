import { Router } from "express";
import {
  getEvents,
  getEventById,
  createEvent,
  joinEvent,
  leaveEvent,
  getMyEvents,
  getJoinedEvents,
  deleteEvent,
  updateEvent,
  getStats,
} from "../controllers/eventController.js";
import { verifyToken, optionalAuth } from "../middlewares/auth.js";

const router = Router();

// Public
router.get("/", getEvents);
router.get("/stats/summary", getStats);

// Must stay above "/:id" so "manage" is not read as an id
router.get("/manage/my-events", verifyToken, getMyEvents);
router.get("/manage/joined-events", verifyToken, getJoinedEvents);

router.get("/:id", optionalAuth, getEventById);

// Logged-in users only
router.post("/", verifyToken, createEvent);
router.post("/:id/join", verifyToken, joinEvent);
router.delete("/:id/join", verifyToken, leaveEvent);
router.put("/:id", verifyToken, updateEvent);
router.delete("/:id", verifyToken, deleteEvent);

export default router;

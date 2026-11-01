import { Router } from "express";
import {
  getEvents,
  getEventById,
  createEvent,
  joinEvent,
  getMyEvents,
  getJoinedEvents,
  deleteEvent,
  updateEvent,
} from "../controllers/eventController";

const router = Router();

// Base path: /api/events
router.get("/", getEvents);
router.get("/manage/my-events", getMyEvents);
router.get("/manage/joined-events", getJoinedEvents);
router.get("/:id", getEventById);
router.post("/", createEvent);
router.put("/:id", updateEvent);
router.post("/:id/join", joinEvent);
router.delete("/:id", deleteEvent);

export default router;

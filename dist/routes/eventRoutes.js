"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const eventController_1 = require("../controllers/eventController");
const router = (0, express_1.Router)();
// Base path: /api/events
router.get("/", eventController_1.getEvents);
router.get("/manage/my-events", eventController_1.getMyEvents);
router.get("/manage/joined-events", eventController_1.getJoinedEvents);
router.get("/:id", eventController_1.getEventById);
router.post("/", eventController_1.createEvent);
router.post("/:id/join", eventController_1.joinEvent);
router.delete("/:id", eventController_1.deleteEvent);
exports.default = router;
//# sourceMappingURL=eventRoutes.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEvent = exports.getJoinedEvents = exports.getMyEvents = exports.joinEvent = exports.createEvent = exports.getEventById = exports.getEvents = void 0;
const Event_1 = require("../models/Event");
// 1. Get all events with Search, Filter & Sort
const getEvents = async (req, res) => {
    try {
        const { search, category, sort } = req.query;
        const query = {};
        if (search && typeof search === "string") {
            query.title = { $regex: search, $options: "i" };
        }
        if (category && typeof category === "string" && category !== "All") {
            query.category = category;
        }
        let sortOption = { eventDate: 1 };
        if (sort === "desc") {
            sortOption = { eventDate: -1 };
        }
        const events = await Event_1.Event.find(query).sort(sortOption);
        res.status(200).json({ success: true, count: events.length, data: events });
    }
    catch (error) {
        res
            .status(500)
            .json({ success: false, message: "Error fetching events", error });
    }
};
exports.getEvents = getEvents;
// 2. Get single event by ID
const getEventById = async (req, res) => {
    try {
        const event = await Event_1.Event.findById(req.params.id);
        if (!event) {
            res.status(404).json({ success: false, message: "Event not found" });
            return;
        }
        res.status(200).json({ success: true, data: event });
    }
    catch {
        res.status(400).json({ success: false, message: "Invalid event ID" });
    }
};
exports.getEventById = getEventById;
// 3. Create a new event
const createEvent = async (req, res) => {
    try {
        const newEvent = await Event_1.Event.create(req.body);
        res.status(201).json({ success: true, data: newEvent });
    }
    catch (error) {
        res
            .status(400)
            .json({
            success: false,
            message: "Validation failed for event creation",
            error,
        });
    }
};
exports.createEvent = createEvent;
// 4. RSVP / Join Drive
const joinEvent = async (req, res) => {
    try {
        const { userEmail } = req.body;
        if (!userEmail) {
            res
                .status(400)
                .json({ success: false, message: "User email is required" });
            return;
        }
        const event = await Event_1.Event.findById(req.params.id);
        if (!event) {
            res.status(404).json({ success: false, message: "Event not found" });
            return;
        }
        if (event.attendees.includes(userEmail)) {
            res
                .status(400)
                .json({
                success: false,
                message: "You have already joined this event",
            });
            return;
        }
        event.attendees.push(userEmail);
        event.attendeesCount += 1;
        await event.save();
        res
            .status(200)
            .json({
            success: true,
            message: "Successfully joined the drive",
            data: event,
        });
    }
    catch {
        res.status(500).json({ success: false, message: "Failed to join event" });
    }
};
exports.joinEvent = joinEvent;
// 5. Get events created by a specific user (Manage Events)
const getMyEvents = async (req, res) => {
    try {
        const { email } = req.query;
        if (!email || typeof email !== "string") {
            res
                .status(400)
                .json({ success: false, message: "Email query param is required" });
            return;
        }
        const myEvents = await Event_1.Event.find({ organizerEmail: email }).sort({
            createdAt: -1,
        });
        res
            .status(200)
            .json({ success: true, count: myEvents.length, data: myEvents });
    }
    catch {
        res
            .status(500)
            .json({ success: false, message: "Failed to fetch user events" });
    }
};
exports.getMyEvents = getMyEvents;
// 6. Get events joined by a specific user (Joined Events)
const getJoinedEvents = async (req, res) => {
    try {
        const { email } = req.query;
        if (!email || typeof email !== "string") {
            res
                .status(400)
                .json({ success: false, message: "Email query param is required" });
            return;
        }
        const joinedEvents = await Event_1.Event.find({ attendees: email }).sort({
            eventDate: 1,
        });
        res
            .status(200)
            .json({ success: true, count: joinedEvents.length, data: joinedEvents });
    }
    catch {
        res
            .status(500)
            .json({ success: false, message: "Failed to fetch joined events" });
    }
};
exports.getJoinedEvents = getJoinedEvents;
// 7. Delete an event
const deleteEvent = async (req, res) => {
    try {
        const deleted = await Event_1.Event.findByIdAndDelete(req.params.id);
        if (!deleted) {
            res.status(404).json({ success: false, message: "Event not found" });
            return;
        }
        res
            .status(200)
            .json({ success: true, message: "Event removed successfully" });
    }
    catch {
        res.status(500).json({ success: false, message: "Failed to delete event" });
    }
};
exports.deleteEvent = deleteEvent;
//# sourceMappingURL=eventController.js.map
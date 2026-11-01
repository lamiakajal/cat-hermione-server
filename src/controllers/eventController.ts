import { Request, Response } from "express";
import { Event } from "../models/Event";

// 1. Get all events with Search, Filter & Sort
export const getEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, category, sort } = req.query;
    const query: Record<string, unknown> = {};

    if (search && typeof search === "string") {
      query.title = { $regex: search, $options: "i" };
    }

    if (category && typeof category === "string" && category !== "All") {
      query.category = category;
    }

    let sortOption: Record<string, 1 | -1> = { eventDate: 1 };
    if (sort === "desc") {
      sortOption = { eventDate: -1 };
    }

    const events = await Event.find(query).sort(sortOption);
    res.status(200).json({ success: true, count: events.length, data: events });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching events", error });
  }
};

// 2. Get single event by ID
export const getEventById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      res.status(404).json({ success: false, message: "Event not found" });
      return;
    }
    res.status(200).json({ success: true, data: event });
  } catch {
    res.status(400).json({ success: false, message: "Invalid event ID" });
  }
};

// 3. Create a new event
export const createEvent = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const newEvent = await Event.create(req.body);
    res.status(201).json({ success: true, data: newEvent });
  } catch (error) {
    res
      .status(400)
      .json({
        success: false,
        message: "Validation failed for event creation",
        error,
      });
  }
};

// 4. RSVP / Join Drive
export const joinEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userEmail } = req.body;
    if (!userEmail) {
      res
        .status(400)
        .json({ success: false, message: "User email is required" });
      return;
    }

    const event = await Event.findById(req.params.id);
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
  } catch {
    res.status(500).json({ success: false, message: "Failed to join event" });
  }
};

// 5. Get events created by a specific user (Manage Events)
export const getMyEvents = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email } = req.query;
    if (!email || typeof email !== "string") {
      res
        .status(400)
        .json({ success: false, message: "Email query param is required" });
      return;
    }

    const myEvents = await Event.find({ organizerEmail: email }).sort({
      createdAt: -1,
    });
    res
      .status(200)
      .json({ success: true, count: myEvents.length, data: myEvents });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch user events" });
  }
};

// 6. Get events joined by a specific user (Joined Events)
export const getJoinedEvents = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email } = req.query;
    if (!email || typeof email !== "string") {
      res
        .status(400)
        .json({ success: false, message: "Email query param is required" });
      return;
    }

    const joinedEvents = await Event.find({ attendees: email }).sort({
      eventDate: 1,
    });
    res
      .status(200)
      .json({ success: true, count: joinedEvents.length, data: joinedEvents });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch joined events" });
  }
};

// 7. Delete an event
export const deleteEvent = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const deleted = await Event.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404).json({ success: false, message: "Event not found" });
      return;
    }
    res
      .status(200)
      .json({ success: true, message: "Event removed successfully" });
  } catch {
    res.status(500).json({ success: false, message: "Failed to delete event" });
  }
};

import { Request, Response } from "express";
import mongoose from "mongoose";
import { Event, EVENT_TYPES } from "../models/Event.js";
import { Join } from "../models/Join.js";
import { User } from "../models/User.js";
import { AuthRequest } from "../middlewares/auth.js";
import { asString, isEmail, isImageSource } from "../utils/validate.js";

type FieldErrors = Record<string, string>;

interface EventInput {
  title: string;
  category: string;
  eventDate: Date;
  location: string;
  description: string;
  bannerImage: string;
  organizerName: string;
  contactEmail: string;
}

const escapeRegex = (s: string): string =>
  s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Shared by create and update; only whitelisted fields ever reach the database
const parseEventBody = (
  body: Record<string, unknown>,
  previousDate?: Date,
): { data?: EventInput; errors?: FieldErrors } => {
  const errors: FieldErrors = {};

  const title = asString(body.title);
  const category = asString(body.category);
  const location = asString(body.location);
  const description = asString(body.description);
  const bannerImage = asString(body.bannerImage);
  const organizerName = asString(body.organizerName);
  const contactEmail = asString(body.contactEmail).toLowerCase();
  const eventDate = new Date(asString(body.eventDate));

  if (title.length < 3 || title.length > 120)
    errors.title = "Title must be between 3 and 120 characters.";
  if (!(EVENT_TYPES as readonly string[]).includes(category))
    errors.category = "Please choose a valid event type.";
  if (location.length < 3 || location.length > 160)
    errors.location = "Location must be between 3 and 160 characters.";
  if (description.length < 20 || description.length > 2000)
    errors.description = "Description must be between 20 and 2000 characters.";
  if (!isImageSource(bannerImage))
    errors.bannerImage = "Thumbnail must be a valid image URL.";

  if (organizerName && (organizerName.length < 2 || organizerName.length > 80))
    errors.organizerName =
      "Organizer name must be between 2 and 80 characters.";
  if (contactEmail && !isEmail(contactEmail))
    errors.contactEmail = "Enter a valid contact email address.";

  if (Number.isNaN(eventDate.getTime())) {
    errors.eventDate = "Please pick a valid date.";
  } else {
    const unchanged =
      previousDate && previousDate.getTime() === eventDate.getTime();
    if (!unchanged && eventDate.getTime() <= Date.now())
      errors.eventDate = "Event date must be in the future.";
  }

  if (Object.keys(errors).length) return { errors };
  return {
    data: {
      title,
      category,
      eventDate,
      location,
      description,
      bannerImage,
      organizerName,
      contactEmail,
    },
  };
};

const badRequest = (res: Response, errors: FieldErrors): void => {
  res.status(400).json({
    success: false,
    message: Object.values(errors)[0],
    errors,
  });
};

// GET /api/events  (upcoming only; supports ?search=&category=&sort=&limit=)
export const getEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, category, sort, limit } = req.query;
    const query: Record<string, unknown> = {
      eventDate: { $gte: new Date() },
    };

    if (typeof search === "string" && search.trim()) {
      query.title = { $regex: escapeRegex(search.trim()), $options: "i" };
    }
    if (typeof category === "string" && category && category !== "All") {
      query.category = category;
    }

    const parsedLimit = Math.min(
      Math.max(parseInt(String(limit), 10) || 0, 0),
      50,
    );

    let cursor = Event.find(query).sort({
      eventDate: sort === "desc" ? -1 : 1,
    });
    if (parsedLimit) cursor = cursor.limit(parsedLimit);

    const events = await cursor.lean();
    res.status(200).json({ success: true, count: events.length, data: events });
  } catch (err) {
    console.error("[getEvents]", err);
    res.status(500).json({ success: false, message: "Could not load events." });
  }
};

// GET /api/events/:id  (public; tells a logged-in viewer whether they already joined)
export const getEventById = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(404).json({ success: false, message: "Event not found." });
    return;
  }

  try {
    const event = await Event.findById(id).lean();
    if (!event) {
      res.status(404).json({ success: false, message: "Event not found." });
      return;
    }

    const hasJoined = req.user
      ? !!(await Join.exists({ event: id, userEmail: req.user.email }))
      : false;

    res.status(200).json({ success: true, data: { ...event, hasJoined } });
  } catch (err) {
    console.error("[getEventById]", err);
    res
      .status(500)
      .json({ success: false, message: "Could not load this event." });
  }
};

// POST /api/events
export const createEvent = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { data, errors } = parseEventBody(req.body ?? {});
  if (!data) return badRequest(res, errors!);

  try {
    // Organizer comes from the verified token, never from the request body
    const organizer = await User.findById(req.user?.id);
    if (!organizer) {
      res.status(401).json({ success: false, message: "Account not found." });
      return;
    }

    // Name and contact email are shown to visitors; ownership stays tied to the account email
    const event = await Event.create({
      ...data,
      organizerName: data.organizerName || organizer.name,
      contactEmail: data.contactEmail || organizer.email,
      organizerEmail: organizer.email,
      organizerPhoto: organizer.photoURL?.startsWith("http")
        ? organizer.photoURL
        : "",
    });
    res.status(201).json({ success: true, data: event });
  } catch (err) {
    console.error("[createEvent]", err);
    res
      .status(500)
      .json({ success: false, message: "Could not create the event." });
  }
};

// PUT /api/events/:id  (owner only)
export const updateEvent = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(404).json({ success: false, message: "Event not found." });
    return;
  }

  try {
    const event = await Event.findById(id);
    if (!event) {
      res.status(404).json({ success: false, message: "Event not found." });
      return;
    }
    if (event.organizerEmail !== req.user?.email) {
      res
        .status(403)
        .json({
          success: false,
          message: "You can only edit events you created.",
        });
      return;
    }

    const { data, errors } = parseEventBody(req.body ?? {}, event.eventDate);
    if (!data) return badRequest(res, errors!);

    event.set({
      ...data,
      organizerName: data.organizerName || event.organizerName,
      contactEmail:
        data.contactEmail || event.contactEmail || event.organizerEmail,
    });
    await event.save();
    res
      .status(200)
      .json({ success: true, message: "Event updated.", data: event });
  } catch (err) {
    console.error("[updateEvent]", err);
    res
      .status(500)
      .json({ success: false, message: "Could not update the event." });
  }
};

// DELETE /api/events/:id  (owner only)
export const deleteEvent = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(404).json({ success: false, message: "Event not found." });
    return;
  }

  try {
    const event = await Event.findById(id);
    if (!event) {
      res.status(404).json({ success: false, message: "Event not found." });
      return;
    }
    if (event.organizerEmail !== req.user?.email) {
      res
        .status(403)
        .json({
          success: false,
          message: "You can only delete events you created.",
        });
      return;
    }

    await Promise.all([event.deleteOne(), Join.deleteMany({ event: id })]);
    res.status(200).json({ success: true, message: "Event deleted." });
  } catch (err) {
    console.error("[deleteEvent]", err);
    res
      .status(500)
      .json({ success: false, message: "Could not delete the event." });
  }
};

// POST /api/events/:id/join
export const joinEvent = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(404).json({ success: false, message: "Event not found." });
    return;
  }

  try {
    const [event, user] = await Promise.all([
      Event.findById(id),
      User.findById(req.user?.id),
    ]);
    if (!event) {
      res.status(404).json({ success: false, message: "Event not found." });
      return;
    }
    if (!user) {
      res.status(401).json({ success: false, message: "Account not found." });
      return;
    }
    if (event.eventDate.getTime() <= Date.now()) {
      res
        .status(400)
        .json({
          success: false,
          message: "This event has already taken place.",
        });
      return;
    }

    try {
      await Join.create({
        event: event._id,
        userEmail: user.email,
        userName: user.name,
        userPhoto: user.photoURL || "",
      });
    } catch (err) {
      // 11000 = unique index hit, the user is already registered
      if ((err as { code?: number }).code === 11000) {
        res
          .status(409)
          .json({
            success: false,
            message: "You have already joined this event.",
          });
        return;
      }
      throw err;
    }

    event.attendeesCount += 1;
    await event.save();

    res.status(200).json({
      success: true,
      message: "You have joined this event.",
      data: { attendeesCount: event.attendeesCount },
    });
  } catch (err) {
    console.error("[joinEvent]", err);
    res
      .status(500)
      .json({ success: false, message: "Could not join this event." });
  }
};

// DELETE /api/events/:id/join  (leave an event the user joined)
export const leaveEvent = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(404).json({ success: false, message: "Event not found." });
    return;
  }

  try {
    const [event, user] = await Promise.all([
      Event.findById(id),
      User.findById(req.user?.id),
    ]);
    if (!event) {
      res.status(404).json({ success: false, message: "Event not found." });
      return;
    }
    if (!user) {
      res.status(401).json({ success: false, message: "Account not found." });
      return;
    }
    if (event.eventDate.getTime() <= Date.now()) {
      res
        .status(400)
        .json({
          success: false,
          message: "This event has already taken place.",
        });
      return;
    }

    const removed = await Join.findOneAndDelete({
      event: event._id,
      userEmail: user.email,
    });
    if (!removed) {
      res
        .status(404)
        .json({ success: false, message: "You have not joined this event." });
      return;
    }

    event.attendeesCount = Math.max(0, event.attendeesCount - 1);
    await event.save();

    res.status(200).json({
      success: true,
      message: "You have left this event.",
      data: { attendeesCount: event.attendeesCount },
    });
  } catch (err) {
    console.error("[leaveEvent]", err);
    res
      .status(500)
      .json({ success: false, message: "Could not leave this event." });
  }
};

// GET /api/events/manage/my-events
export const getMyEvents = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const events = await Event.find({ organizerEmail: req.user?.email })
      .sort({ eventDate: 1 })
      .lean();
    res.status(200).json({ success: true, count: events.length, data: events });
  } catch (err) {
    console.error("[getMyEvents]", err);
    res
      .status(500)
      .json({ success: false, message: "Could not load your events." });
  }
};

// GET /api/events/manage/joined-events  (sorted by event date)
export const getJoinedEvents = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const joins = await Join.find({ userEmail: req.user?.email })
      .populate("event")
      .lean();

    type JoinedEvent = Record<string, unknown> & { eventDate: Date | string };
    const events: JoinedEvent[] = [];
    for (const j of joins) {
      if (!j.event) continue;
      const item = {
        ...(j.event as unknown as Record<string, unknown>),
        joinedAt: j.createdAt,
      } as unknown as JoinedEvent;
      events.push(item);
    }
    events.sort(
      (a, b) =>
        new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime(),
    );

    res.status(200).json({ success: true, count: events.length, data: events });
  } catch (err) {
    console.error("[getJoinedEvents]", err);
    res
      .status(500)
      .json({ success: false, message: "Could not load joined events." });
  }
};

// GET /api/events/stats/summary  (public, feeds the home page counters)
export const getStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [totalEvents, upcomingEvents, volunteersJoined, causes] =
      await Promise.all([
        Event.countDocuments(),
        Event.countDocuments({ eventDate: { $gte: new Date() } }),
        Join.countDocuments(),
        Event.distinct("category"),
      ]);

    res.status(200).json({
      success: true,
      data: {
        totalEvents,
        upcomingEvents,
        volunteersJoined,
        causes: causes.length,
      },
    });
  } catch (err) {
    console.error("[getStats]", err);
    res.status(500).json({ success: false, message: "Could not load stats." });
  }
};

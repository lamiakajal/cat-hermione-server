const express = require('express');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');
const verifyToken = require('../middlewares/verifyToken');

const router = express.Router();

// 1. Get 6 upcoming events for home page
router.get('/recent', async (req, res) => {
  try {
    const db = getDB();
    const today = new Date().toISOString().split('T')[0];

    const recentEvents = await db
      .collection('events')
      .find({ eventDate: { $gte: today } })
      .sort({ eventDate: 1 })
      .limit(6)
      .toArray();

    res.status(200).send({
      success: true,
      data: recentEvents,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: 'Failed to fetch recent events.',
      error: error.message,
    });
  }
});

// 2. Get all upcoming events (public)
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const today = new Date().toISOString().split('T')[0];

    const upcomingEvents = await db
      .collection('events')
      .find({ eventDate: { $gte: today } })
      .sort({ eventDate: 1 })
      .toArray();

    res.status(200).send({
      success: true,
      data: upcomingEvents,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: 'Failed to fetch upcoming events.',
      error: error.message,
    });
  }
});

// 3. Get single event details by id (public)
router.get('/:id', async (req, res) => {
  try {
    const db = getDB();
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({
        success: false,
        message: 'Invalid event ID format.',
      });
    }

    const event = await db.collection('events').findOne({ _id: new ObjectId(id) });

    if (!event) {
      return res.status(404).send({
        success: false,
        message: 'Event not found.',
      });
    }

    res.status(200).send({
      success: true,
      data: event,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: 'Failed to fetch event details.',
      error: error.message,
    });
  }
});

// 4. Create new event (private)
router.post('/', verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const { title, description, eventType, thumbnail, location, eventDate, creatorEmail, creatorName } = req.body;

    if (req.user?.email !== creatorEmail) {
      return res.status(403).send({
        success: false,
        message: 'Forbidden action. Token identity does not match creator email.',
      });
    }

    const today = new Date().toISOString().split('T')[0];
    if (eventDate < today) {
      return res.status(400).send({
        success: false,
        message: 'Event date must be in the future.',
      });
    }

    const newEvent = {
      title,
      description,
      eventType,
      thumbnail,
      location,
      eventDate,
      creatorEmail,
      creatorName: creatorName || 'Anonymous Organizer',
      createdAt: new Date(),
    };

    const result = await db.collection('events').insertOne(newEvent);

    res.status(201).send({
      success: true,
      message: 'Event created successfully.',
      insertedId: result.insertedId,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: 'Failed to create event.',
      error: error.message,
    });
  }
});

// 5. Get events created by logged-in user (private)
router.get('/user/:email', verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const email = req.params.email;

    if (req.user?.email !== email) {
      return res.status(403).send({
        success: false,
        message: 'Forbidden. You cannot access another user events.',
      });
    }

    const userEvents = await db
      .collection('events')
      .find({ creatorEmail: email })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).send({
      success: true,
      data: userEvents,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: 'Failed to fetch user events.',
      error: error.message,
    });
  }
});

// 6. Update event data (private - creator only)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const id = req.params.id;
    const { title, description, eventType, thumbnail, location, eventDate } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({
        success: false,
        message: 'Invalid event ID format.',
      });
    }

    const existingEvent = await db.collection('events').findOne({ _id: new ObjectId(id) });
    if (!existingEvent) {
      return res.status(404).send({
        success: false,
        message: 'Event not found.',
      });
    }

    if (existingEvent.creatorEmail !== req.user?.email) {
      return res.status(403).send({
        success: false,
        message: 'Forbidden. You can only update your own created events.',
      });
    }

    const updatedDoc = {
      $set: {
        title,
        description,
        eventType,
        thumbnail,
        location,
        eventDate,
        updatedAt: new Date(),
      },
    };

    await db.collection('events').updateOne({ _id: new ObjectId(id) }, updatedDoc);

    res.status(200).send({
      success: true,
      message: 'Event updated successfully.',
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: 'Failed to update event.',
      error: error.message,
    });
  }
});

// 7. Delete event (private - creator only)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({
        success: false,
        message: 'Invalid event ID format.',
      });
    }

    const existingEvent = await db.collection('events').findOne({ _id: new ObjectId(id) });
    if (!existingEvent) {
      return res.status(404).send({
        success: false,
        message: 'Event not found.',
      });
    }

    if (existingEvent.creatorEmail !== req.user?.email) {
      return res.status(403).send({
        success: false,
        message: 'Forbidden. You can only delete your own created events.',
      });
    }

    await db.collection('events').deleteOne({ _id: new ObjectId(id) });

    res.status(200).send({
      success: true,
      message: 'Event deleted successfully.',
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: 'Failed to delete event.',
      error: error.message,
    });
  }
});

// 8. Join an event (private)
router.post('/join', verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const { eventId, userEmail, userName } = req.body;

    if (req.user?.email !== userEmail) {
      return res.status(403).send({
        success: false,
        message: 'Forbidden action. Token identity does not match participant email.',
      });
    }

    if (!ObjectId.isValid(eventId)) {
      return res.status(400).send({
        success: false,
        message: 'Invalid event ID.',
      });
    }

    const event = await db.collection('events').findOne({ _id: new ObjectId(eventId) });
    if (!event) {
      return res.status(404).send({
        success: false,
        message: 'Event does not exist.',
      });
    }

    const alreadyJoined = await db.collection('joined_events').findOne({
      eventId: new ObjectId(eventId),
      userEmail,
    });

    if (alreadyJoined) {
      return res.status(409).send({
        success: false,
        message: 'You have already joined this event.',
      });
    }

    const joinRecord = {
      eventId: new ObjectId(eventId),
      eventTitle: event.title,
      eventType: event.eventType,
      thumbnail: event.thumbnail,
      location: event.location,
      eventDate: event.eventDate,
      userEmail,
      userName: userName || 'Participant',
      joinedAt: new Date(),
    };

    await db.collection('joined_events').insertOne(joinRecord);

    res.status(201).send({
      success: true,
      message: 'Successfully joined the event.',
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: 'Failed to join event.',
      error: error.message,
    });
  }
});

// 9. Get joined events for logged-in user (private - sorted by date)
router.get('/joined/:email', verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const email = req.params.email;

    if (req.user?.email !== email) {
      return res.status(403).send({
        success: false,
        message: 'Forbidden. You can only view your own joined events.',
      });
    }

    const joinedList = await db
      .collection('joined_events')
      .find({ userEmail: email })
      .sort({ eventDate: 1 })
      .toArray();

    res.status(200).send({
      success: true,
      data: joinedList,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: 'Failed to fetch joined events.',
      error: error.message,
    });
  }
});

module.exports = router;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Event = void 0;
const mongoose_1 = require("mongoose");
const EventSchema = new mongoose_1.Schema({
    title: { type: String, required: true, trim: true },
    category: {
        type: String,
        required: true,
        enum: ["Healthcare", "Relief", "Education", "Environment", "Community"],
    },
    eventDate: { type: Date, required: true },
    location: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    bannerImage: { type: String, required: true },
    organizerName: { type: String, required: true },
    organizerEmail: { type: String, required: true },
    organizerPhoto: { type: String },
    attendeesCount: { type: Number, default: 0 },
    attendees: { type: [String], default: [] },
}, { timestamps: true });
exports.Event = (0, mongoose_1.model)("Event", EventSchema);
//# sourceMappingURL=Event.js.map
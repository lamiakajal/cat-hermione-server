"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./config/db");
const eventRoutes_1 = __importDefault(require("./routes/eventRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
}));
app.use(express_1.default.json());
// Database connection
(0, db_1.connectDB)();
// API Routes
app.use("/api/events", eventRoutes_1.default);
// Root health check
app.get("/", (_req, res) => {
    res.status(200).json({
        status: "success",
        message: "UnityPulse Server API running smoothly",
    });
});
app.listen(PORT, () => {
    console.log(`[UnityPulse Server running on port ${PORT}]`);
});
exports.default = app;
//# sourceMappingURL=index.js.map
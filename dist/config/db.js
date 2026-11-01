"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error("MONGODB_URI is not defined in environment variables");
        }
        const conn = await mongoose_1.default.connect(mongoUri);
        console.log(`[MongoDB Connected]: ${conn.connection.host}`);
    }
    catch (error) {
        if (error instanceof Error) {
            console.error("[MongoDB Connection Error]:", error.message);
        }
        else {
            console.error("[MongoDB Connection Error]:", error);
        }
        process.exit(1);
    }
};
exports.connectDB = connectDB;
//# sourceMappingURL=db.js.map
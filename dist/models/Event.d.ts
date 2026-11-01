import { Document } from "mongoose";
export interface IEvent extends Document {
    title: string;
    category: "Healthcare" | "Relief" | "Education" | "Environment" | "Community";
    eventDate: Date;
    location: string;
    description: string;
    bannerImage: string;
    organizerName: string;
    organizerEmail: string;
    organizerPhoto?: string;
    attendeesCount: number;
    attendees: string[];
    createdAt: Date;
    updatedAt: Date;
}
export declare const Event: import("mongoose").Model<IEvent, {}, {}, {}, Document<unknown, {}, IEvent, {}, {}> & IEvent & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>;

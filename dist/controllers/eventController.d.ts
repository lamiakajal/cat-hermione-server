import { Request, Response } from "express";
export declare const getEvents: (req: Request, res: Response) => Promise<void>;
export declare const getEventById: (req: Request, res: Response) => Promise<void>;
export declare const createEvent: (req: Request, res: Response) => Promise<void>;
export declare const joinEvent: (req: Request, res: Response) => Promise<void>;
export declare const getMyEvents: (req: Request, res: Response) => Promise<void>;
export declare const getJoinedEvents: (req: Request, res: Response) => Promise<void>;
export declare const deleteEvent: (req: Request, res: Response) => Promise<void>;

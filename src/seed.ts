import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import { Event } from "./models/Event.js";

dotenv.config();

const photo = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=80`;

const daysFromNow = (days: number, hour = 9) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d;
};

const ORGANIZER = {
  organizerName: "UnityPulse Team",
  organizerEmail: "team@unitypulse.org",
};

const events = [
  {
    title: "Winter Clothes Distribution, Mirpur 10",
    category: "Donation",
    eventDate: daysFromNow(9),
    location: "Mirpur 10 Roundabout, Dhaka",
    description:
      "We are collecting and handing out warm clothes and blankets to families sleeping outdoors as the cold sets in. Volunteers help sort donations in the morning and distribute them street by street after noon.",
    bannerImage: photo("1542810634-71277d95dcbb"),
  },
  {
    title: "Buriganga Riverbank Cleanup",
    category: "Cleanup",
    eventDate: daysFromNow(14, 7),
    location: "Sadarghat Launch Terminal, Old Dhaka",
    description:
      "A morning of clearing plastic and household waste from the Buriganga embankment. Gloves and bags are provided, so all you need to bring is water and a pair of shoes you don't mind getting dirty.",
    bannerImage: photo("1618477461853-cf6ed80faba5"),
  },
  {
    title: "Free Child Health and Nutrition Camp",
    category: "Healthcare",
    eventDate: daysFromNow(21, 10),
    location: "Korail Community Centre, Banani",
    description:
      "Volunteer doctors will check height, weight and basic nutrition for children under ten and hand out vitamin supplements. We need helpers for registration, queue management and translating for families.",
    bannerImage: photo("1584515979956-d9f6e5d09982"),
  },
  {
    title: "Fruit Tree Plantation Drive",
    category: "Plantation",
    eventDate: daysFromNow(28, 8),
    location: "Uttara Sector 14 Park, Dhaka",
    description:
      "Join us to plant a thousand fruit and shade tree saplings along the park edge and nearby roadsides. Saplings, tools and refreshments are arranged, and local schools will adopt each section afterwards.",
    bannerImage: photo("1542601906990-b4d3fb778b09"),
  },
  {
    title: "Book Donation and Digital Literacy Day",
    category: "Education",
    eventDate: daysFromNow(35, 10),
    location: "Rayerbazar Community School, Dhaka",
    description:
      "Bring a story book or a school textbook to donate. Alongside the book drive we are running short beginner sessions on using a computer and searching safely online for older students.",
    bannerImage: photo("1497633762265-9d179a990aa6"),
  },
  {
    title: "Flood Safety and First-Aid Workshop",
    category: "Awareness",
    eventDate: daysFromNow(42, 11),
    location: "Shahjalal University Hall, Sylhet",
    description:
      "A hands-on workshop covering water purification, CPR basics and how to pack a flood kit. Open to students and neighbourhood volunteers, with printed guides in Bangla for everyone who attends.",
    bannerImage: photo("1544717305-2782549b5136"),
  },
];

const run = async () => {
  await connectDB();

  const upcoming = await Event.countDocuments({ eventDate: { $gte: new Date() } });
  if (upcoming >= 6) {
    console.log(`Skipped: ${upcoming} upcoming events already exist.`);
  } else {
    await Event.insertMany(events.map((e) => ({ ...e, ...ORGANIZER })));
    console.log(`Inserted ${events.length} sample events.`);
  }
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

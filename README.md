# UnityPulse API

Express and MongoDB API for the UnityPulse client: https://github.com/lamiakajal/cat-hermione-client

## Highlights

- Register and login with BetterAuth (MongoDB adapter) storing hashed credentials
- JWT issued on login, register and social login (GitHub, Google); protected routes verify the Bearer token
- Event CRUD where only the owner can update or delete
- Join and leave events, stored in a separate joins collection with event and user data
- Future-date validation on create and update; the upcoming list returns only future events
- Profile update and password change endpoints

## Setup

```bash
npm install
cp .env.example .env     # fill in the values
npm run seed             # optional sample events
npm run dev
```

Environment variables are listed in `.env.example`.

## Main routes

| Method | Route | Access |
| --- | --- | --- |
| POST | /api/auth/register, /api/auth/login | Public |
| GET | /api/auth/me | JWT |
| PUT | /api/auth/profile, /api/auth/password | JWT |
| GET | /api/events, /api/events/:id | Public |
| POST | /api/events | JWT |
| PUT, DELETE | /api/events/:id | JWT, owner only |
| POST, DELETE | /api/events/:id/join | JWT |
| GET | /api/events/manage/my-events, /api/events/manage/joined-events | JWT |

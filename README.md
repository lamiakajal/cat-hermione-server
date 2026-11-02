# ⚡ UnityPulse Server — Core RESTful API Engine

The robust backend service driving UnityPulse, delivering secure authentication workflows, optimized database queries, and role-enforced CRUD operations.

---

## 🔗 Live Deployments & Repositories

| Component                           | Target URL                                                                        |
| :---------------------------------- | :-------------------------------------------------------------------------------- |
| **Backend REST API (Live Engine)**  | [https://cat-hermione-server.vercel.app](https://cat-hermione-server.vercel.app)  |
| **Client Application (Production)** | [https://cat-hermione-client.vercel.app](https://cat-hermione-client.vercel.app)  |
| **Server Source Repository**        | [GitHub — cat-hermione-server](https://github.com/lamiakajal/cat-hermione-server) |
| **Client Source Repository**        | [GitHub — cat-hermione-client](https://github.com/lamiakajal/cat-hermione-client) |

---

## 📡 RESTful Endpoints

| Method   | Endpoint                  | Authorization         | Description                            |
| :------- | :------------------------ | :-------------------- | :------------------------------------- |
| `POST`   | `/api/auth/register`      | Public                | Account registration                   |
| `POST`   | `/api/auth/login`         | Public                | Credentials sign-in & JWT issuance     |
| `GET`    | `/api/auth/google`        | Public                | Google OAuth handshake                 |
| `GET`    | `/api/auth/github`        | Public                | GitHub OAuth handshake                 |
| `GET`    | `/api/events`             | Public                | Query events with filters              |
| `GET`    | `/api/events/:id`         | Public                | Event record details                   |
| `POST`   | `/api/events`             | Protected (Organizer) | Create a community drive               |
| `PUT`    | `/api/events/:id`         | Protected (Owner)     | Modify event details                   |
| `DELETE` | `/api/events/:id`         | Protected (Owner)     | Delete event record                    |
| `POST`   | `/api/events/:id/join`    | Protected (User)      | RSVP / Join event                      |
| `GET`    | `/api/events/user/joined` | Protected (User)      | Retrieve joined events for active user |

---

## 🛠️ Technology Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **Database & ODM:** MongoDB Atlas (Mongoose ODM)
- **Security & Cryptography:** JSON Web Tokens (JWT), bcryptjs, CORS
- **Deployment Platform:** Vercel Serverless Functions

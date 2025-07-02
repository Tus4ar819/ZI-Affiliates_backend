# ZI Affiliates Backend

## Project Overview
ZI Affiliates backend is a RESTful API server built with Node.js and Fastify, designed to power the ZI Affiliates mobile app. It manages user authentication, lead/project CRUD, analytics, and enforces security and data integrity for affiliate marketers and professionals.

---

## Features
- JWT-based authentication (3-day expiry)
- User registration and login
- CRUD for leads (add, update, delete, filter by status)
- Dashboard analytics (lead counts, monthly trends)
- JSON schema validation for all endpoints
- MongoDB integration (users, leads, projects)
- Modular, scalable, and secure architecture

---

## Architecture
```
[React Native App] ←→ [Fastify Backend (Node.js)] ←→ [MongoDB]
```
- **Frontend:** React Native (mobile app)
- **Backend:** Node.js (Fastify), JWT, AJV validation
- **Database:** MongoDB (Atlas or self-hosted)

---

## Tech Stack
- Node.js
- Fastify
- @fastify/jwt
- @fastify/mongodb
- AJV (JSON schema validation)
- MongoDB

---

## Folder Structure
```
/ (root)
├── src/
│   ├── controllers/      # Route handlers
│   ├── models/           # MongoDB models/schemas
│   ├── routes/           # Fastify route definitions
│   ├── plugins/          # Fastify plugins (JWT, DB, etc.)
│   ├── utils/            # Utility functions
│   └── index.js          # App entry point
├── test/                 # Unit and integration tests
├── .env                  # Environment variables
├── package.json
└── README.md
```

---

## Setup & Installation
1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd ZI-Affiliates_backend
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure environment variables:**
   - Copy `.env.example` to `.env` and fill in values:
     ```env
     PORT=3000
     MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/zi-affiliates
     JWT_SECRET=your_jwt_secret
     JWT_EXPIRES_IN=3d
     ```

---

## Running the Server
- **Development:**
  ```bash
  npm run dev
  ```
- **Production:**
  ```bash
  npm start
  ```

Server runs on `http://localhost:3000` by default.

---

## API Endpoints

### 1. Authentication
#### POST `/login`
- **Request:**
  ```json
  { "email": "user@example.com", "password": "yourpassword" }
  ```
- **Response:**
  ```json
  { "token": "<JWT>", "expiresIn": 259200 }
  ```

### 2. Dashboard Analytics
#### GET `/getdata`
- **Headers:** `Authorization: Bearer <JWT>`
- **Response:**
  ```json
  {
    "totalLeads": 128,
    "hotCount": 45,
    "warmCount": 53,
    "coldCount": 30,
    "monthlyReach": [ { "month": "2025-01", "count": 12 }, ... ],
    "monthlyProfit": [ { "month": "2025-01", "profit": 1200.00 }, ... ]
  }
  ```

### 3. Leads
#### POST `/leads` (Create)
- **Request:**
  ```json
  { "name": "John Doe", "phone": "+91-9876543210", "email": "john.doe@example.com", "status": "hot", "notes": "Interested", "date": "2025-06-23" }
  ```
- **Response:** Full lead object

#### PUT `/leads/:id` (Update)
- **Request:**
  ```json
  { "status": "warm", "notes": "Follow-up scheduled" }
  ```
- **Response:** Updated lead object

#### DELETE `/leads/:id` (Delete)
- **Response:**
  ```json
  { "message": "Lead deleted successfully" }
  ```

#### GET `/leads?status=hot` (Filter by status)
- **Response:** Array of leads with matching status

---

## Authentication
- All protected routes require JWT in the `Authorization` header.
- JWT expires after 3 days of inactivity.
- Passwords are hashed and salted.

---

## Validation & Error Handling
- All endpoints use JSON schema validation (AJV).
- Standardized error responses:
  ```json
  { "error": "Validation failed: email is required" }
  ```

---

## Deployment
- **Docker:**
  - Build: `docker build -t zi-affiliates-backend .`
  - Run: `docker run -p 3000:3000 --env-file .env zi-affiliates-backend`
- **Cloud:**
  - Deploy to Render, Railway, Fly.io, or GAE as per your preference.
  - Use MongoDB Atlas for managed DB.

---

## Testing
- **Unit tests:**
  ```bash
  npm test
  ```
- **Integration tests:** Located in `/test` folder.

---

## Security
- All HTTP traffic must use HTTPS.
- JWT tokens expire after 3 days.
- Passwords are securely hashed.
- CRUD operations enforce user-level access.

---

## Contribution
1. Fork the repo
2. Create a feature branch
3. Commit and push your changes
4. Open a pull request

---

## License
MIT

---

## Contact
For questions or support, contact the maintainer at [your-email@example.com].
# CollabFlow

**CollabFlow** is a modern, full-stack, real-time collaborative project management platform designed to empower engineering teams, agile squads, and cross-functional organizations. The platform integrates workspace and project management, interactive Kanban task boards, live team chat, presence tracking, and AI-assisted workflows.

---

## Technology Stack

### Client (Frontend)
- **Framework & Tooling**: [React 19](https://react.dev/), [Vite](https://vitejs.dev/)
- **Language**: JavaScript (ES Modules)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **State Management**: [Redux Toolkit (RTK)](https://redux-toolkit.js.org/) & `react-redux`
- **Routing**: [React Router v7](https://reactrouter.com/)
- **HTTP Client**: [Axios](https://axios-http.com/) (with interceptors and centralized API management)
- **Real-Time Client**: [Socket.IO Client](https://socket.io/)

### Server (Backend)
- **Runtime & Framework**: [Node.js](https://nodejs.org/), [Express 5](https://expressjs.com/)
- **Database & ODM**: [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/)
- **Real-Time Engine**: [Socket.IO](https://socket.io/) (HTTP server integration)
- **Security & Authentication**: `bcrypt`, `jsonwebtoken` (JWT), `cookie-parser`, `cors`
- **Environment Management**: `dotenv`
- **Development Tooling**: `nodemon`

---

## Directory Structure

```text
CollabFlow/
├── client/                     # Frontend Application (React + Vite)
│   ├── public/                 # Static public assets
│   ├── src/
│   │   ├── assets/             # Images, SVGs, and brand assets
│   │   ├── components/         # Reusable UI components (e.g. Navbar, StatusBadge)
│   │   ├── features/           # Feature-specific modules (auth, projects, tasks)
│   │   ├── hooks/              # Custom React hooks (e.g. useSocket)
│   │   ├── layouts/            # Application layout shells (RootLayout)
│   │   ├── pages/              # Top-level page views (HomePage, NotFoundPage)
│   │   ├── services/           # API and external service connectors (api.js)
│   │   ├── socket/             # Socket.IO client instance and helpers
│   │   ├── store/              # Redux Toolkit store and slices (systemSlice)
│   │   ├── utils/              # Application constants and utility helpers
│   │   ├── App.jsx             # Route definitions and layout binding
│   │   ├── main.jsx            # React root with Redux Provider and Router
│   │   └── index.css           # Tailwind CSS baseline styles
│   ├── .env.example            # Frontend environment variable templates
│   ├── package.json            # Frontend dependencies and scripts
│   └── vite.config.js          # Vite and Tailwind configuration
│
├── server/                     # Backend API & Real-Time Gateway (Express + Socket.IO)
│   ├── src/
│   │   ├── config/             # DB connection and centralized environment config
│   │   ├── controllers/        # Request handlers (healthController.js)
│   │   ├── middleware/         # Global & route middleware (error and 404 handlers)
│   │   ├── models/             # Mongoose schemas & models
│   │   ├── routes/             # Express API routes (healthRoutes.js, index.js)
│   │   ├── services/           # Business logic service layer
│   │   ├── sockets/            # Socket.IO initialization and event handlers
│   │   ├── utils/              # Structured logger and helpers
│   │   ├── validators/         # Input validation schemas
│   │   ├── app.js              # Express app setup, middleware, and route mounting
│   │   └── server.js           # HTTP server wrapping, socket setup, DB connect, listen
│   ├── .env.example            # Backend environment variable templates
│   └── package.json            # Backend dependencies and scripts
│
├── docs/                       # Architecture and project documentation
│   └── architecture.md         # Comprehensive system architecture document
│
├── .gitignore                  # Root gitignore protecting secrets and dependencies
├── docker-compose.yml          # Container orchestration template
└── README.md                   # Project documentation and setup guide
```

---

## Local Setup & Development

### Prerequisites
- **Node.js**: v18+ (Node 20+ recommended)
- **npm**: v9+
- **MongoDB**: Local MongoDB instance (`mongodb://localhost:27017`) or MongoDB Atlas connection URI

---

### 1. Clone & Configure Environment

Ensure dependencies and environment secrets are never committed. Copy the provided `.env.example` templates:

#### Backend Environment:
```bash
cd server
cp .env.example .env
```
Default `.env` configuration:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/collabflow
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
```

#### Frontend Environment:
```bash
cd ../client
cp .env.example .env
```
Default `.env` configuration:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

### 2. Backend Setup & Run

From the `server` directory:

```bash
# Install dependencies (if not already installed)
npm install

# Start development server with auto-reload (nodemon)
npm run dev

# Or run standard node startup
npm start
```

Backend will run at: `http://localhost:5000`

#### Verify Backend Health
```bash
curl http://localhost:5000/api/health
```
Response:
```json
{
  "status": "ok",
  "message": "CollabFlow API is healthy and operational",
  "timestamp": "2026-09-15T...",
  "uptime": 5,
  "environment": "development"
}
```

---

### 3. Frontend Setup & Run

From the `client` directory:

```bash
# Install dependencies (if not already installed)
npm install

# Start Vite development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint
```

Frontend will run at: `http://localhost:5173`

---

## Current Development Status

- [x] **Project Foundation**: Root structure (`client/`, `server/`, `docs/`) initialized.
- [x] **Frontend Architecture**: React 19 + Vite + Tailwind CSS v4 + Redux Toolkit + React Router v7 + Axios + Socket.IO Client configured.
- [x] **Backend Architecture**: Express 5 app/server decoupling, Mongoose DB connection, Socket.IO gateway, structured logging, centralized error handling.
- [x] **Health Check**: Operational `GET /api/health` endpoint with status, uptime, and metadata.
- [x] **Environment & Hygiene**: Safe `.env.example` templates, strict `.gitignore` rules.
- [x] **System Architecture**: Detailed design documented in `docs/architecture.md`.
- [ ] **Next Up**: User Authentication & Authorization (JWT, secure cookies, bcrypt, RBAC).

# CollabFlow - Initial System Architecture

## 1. Overview

**CollabFlow** is a modern, full-stack real-time collaborative project management platform designed for engineering teams, agile squads, and cross-functional organizations. The platform brings together project planning, task management, live communication, and AI-assisted workflows into a unified, high-performance interface.

This document details the architectural foundation established for CollabFlow, covering both the client and server ecosystems, communication layers, and directory conventions.

```
+-----------------------------------------------------------------------+
|                             Client Tier                               |
|   React 19 + Vite + Tailwind CSS v4 + Redux Toolkit + React Router    |
+-------------------+-------------------------------+-------------------+
                    |                               |
       REST / HTTP  |                               |  WebSockets (WS)
       (Axios)      |                               |  (Socket.IO Client)
                    v                               v
+-------------------+-------------------------------+-------------------+
|                             Server Tier                               |
|          Express 5 (app.js)  <====>  Socket.IO Gateway (server.js)     |
|          +-------------------------------------------------+          |
|          | Middleware Pipeline (CORS, Parsers, Auth, Error)|          |
|          | Controllers & Modular Route Handlers            |          |
|          | Business Services & Real-time Room Managers     |          |
|          +-------------------------------------------------+          |
+-----------------------------------+-----------------------------------+
                                    |
                            Mongoose ODM
                                    v
+-----------------------------------+-----------------------------------+
|                             Data Tier                                 |
|                       MongoDB Database                                |
+-----------------------------------------------------------------------+
```

---

## 2. Technology Stack

### 2.1 Frontend
| Technology | Role | Rationale |
| :--- | :--- | :--- |
| **React 19** | UI Library | Modern component model, concurrent features, optimal rendering |
| **Vite** | Build Tool / Dev Server | Fast Hot Module Replacement (HMR) and optimized rollup production builds |
| **Tailwind CSS v4** | Styling Engine | Modern utility-first CSS framework with zero-runtime overhead |
| **Redux Toolkit (RTK)** | Global State Management | Predictable state container with standardized async thunks and slices |
| **React Router v7** | Client-side Routing | Declarative routing, nested layouts, and route guards |
| **Axios** | HTTP Client | Promise-based client with centralized request/response interceptors |
| **Socket.IO Client** | Real-time Client | WebSocket protocol handling with automatic reconnects and room routing |

### 2.2 Backend
| Technology | Role | Rationale |
| :--- | :--- | :--- |
| **Node.js** | Runtime Environment | High-throughput, event-driven asynchronous runtime |
| **Express 5** | Web Framework | Lightweight, battle-tested HTTP routing and middleware framework |
| **Socket.IO** | Real-Time Engine | Event-driven bidirectional communication for collaborative events |
| **MongoDB & Mongoose** | Database & ODM | Schema-based document modeling with indexing and validation |
| **dotenv** | Configuration | Environment-specific secret and configuration management |
| **cors** | Security Middleware | Cross-Origin Resource Sharing controls with origin whitelisting |
| **cookie-parser** | HTTP Parsing | Secure cookie extraction for session / token handling |
| **bcrypt** | Cryptography | One-way salted password hashing |
| **jsonwebtoken** | Authentication | Stateless authentication and identity tokens |
| **nodemon** | Dev Tooling | Automated server reload upon file modifications |

---

## 3. System Architecture & Separation of Concerns

### 3.1 Server Decoupling (`app.js` vs `server.js`)
To ensure high testability, maintainability, and clean lifecycle management, the backend architecture strictly separates application configuration from server startup:

- **`server/src/app.js`**:
  - Instantiates Express application.
  - Registers global middleware (CORS, JSON parsing, URL-encoded parsing, cookie parsing).
  - Configures request tracing/logging in development mode.
  - Mounts versioned API routes under `/api`.
  - Attaches fallback 404 handler and centralized error handling middleware.
  - Exports the `app` instance without binding to network ports.
- **`server/src/server.js`**:
  - Primary executable entry point.
  - Loads environment variables via `dotenv`.
  - Wraps Express `app` in a standard Node `http.Server`.
  - Initializes the Socket.IO server on top of the HTTP server.
  - Initiates MongoDB connection via `connectDB()`.
  - Starts listening on the configured `PORT`.
  - Manages graceful shutdown signals (`SIGINT`, `SIGTERM`).

### 3.2 Frontend Feature-Oriented Architecture
The frontend codebase follows a clean, feature-driven directory layout designed for team scalability:

```
client/src/
├── assets/          # Static assets (images, svg icons, fonts)
├── components/      # Reusable presentation components
│   └── common/      # Core UI primitives (Navbar, StatusBadge, Button, etc.)
├── features/        # Domain-driven feature slices (auth, workspaces, tasks, chat)
├── hooks/           # Custom React hooks (e.g. useSocket)
├── layouts/         # Layout shells (e.g. RootLayout with Navbar and Footer)
├── pages/           # High-level route views (HomePage, NotFoundPage)
├── services/        # External services & API clients (Axios instance & endpoint helpers)
├── socket/          # Socket.IO client singleton and lifecycle helpers
├── store/           # Redux Toolkit store configuration and slices
│   └── slices/      # Redux state slices
└── utils/           # Shared constants, helpers, and validators
```

### 3.3 Backend Modular Architecture
The backend codebase follows a layered modular structure:

```
server/src/
├── config/          # Centralized configuration (db.js, environment.js)
├── controllers/     # Request handlers (healthController.js, etc.)
├── middleware/      # Global & route-level middleware (errorHandler, notFoundHandler)
├── models/          # Mongoose data schemas & models
├── routes/          # API route definitions and index router (healthRoutes.js, index.js)
├── services/        # Business logic operations isolated from HTTP transports
├── sockets/         # Real-time event handlers, rooms, and connection lifecycle
├── utils/           # Shared utilities (logger.js, formatters)
├── validators/      # Request payload validation schemas
├── app.js           # Express app setup and middleware configuration
└── server.js        # Server entrypoint, HTTP server wrapping, and DB initialization
```

---

## 4. Communication & Protocols

### 4.1 REST API Layer
- Base Path: `/api`
- Content-Type: `application/json`
- Foundational Endpoint:
  - `GET /api/health`: Returns system status, timestamp, uptime, and environment.
- Standardized Error Format:
  ```json
  {
    "status": "error",
    "message": "Human-readable error description"
  }
  ```

### 4.2 Real-Time WebSocket Layer
- Gateway: Socket.IO mounted at the root HTTP server path.
- Transport: WebSocket with automatic long-polling fallback.
- CORS Origin: Whitelisted to configured `CLIENT_URL`.
- Connection Lifecycle: Logging connection and disconnection events with unique socket identifiers.
- Future Channels:
  - Workspace rooms (`workspace:<id>`)
  - Project task update broadcasts (`project:<id>`)
  - Team channel messaging (`chat:<channel_id>`)
  - Active user presence and typing indicators

---

## 5. Security & Environment Configuration

- **Environment Isolation**: Application behavior and sensitive secrets are managed strictly through `.env` files.
- **No Hardcoded Secrets**: All configuration values default safely for development and require explicit environment variables in production.
- **Git Hygiene**: Root and nested `.gitignore` configurations enforce that all `.env` files, build directories, and `node_modules/` are untracked.
- **Templates**: Standard `.env.example` templates provided in both `client/` and `server/`.

---

## 6. Incremental Roadmap

The foundation is ready for subsequent incremental feature implementation:
1. **Authentication & Authorization**: User registration, login, JWT issuance, secure HTTP-only cookies, password hashing with bcrypt, role-based authorization middleware.
2. **Workspaces & Teams**: Multi-tenant workspace management, invitations, member roles.
3. **Projects & Kanban Boards**: Project workflows, drag-and-drop task columns, real-time board sync.
4. **Live Chat & Presence**: Direct and channel messaging, presence tracking via Socket.IO.
5. **AI Assistant Integration**: Automated sprint summarization, task breakdown recommendations.
6. **Containerization & Deployment**: Multi-stage Docker builds, Docker Compose orchestration, AWS cloud deployment.

# Real-Time Collaborative Document Editor

A MERN TypeScript collaborative document platform inspired by Google Docs and Notion. It supports authenticated users, multiple workspaces, workspace membership, document management, rich text editing, live collaboration events, comments, share links, versions, restore flows, and search.

## Tech Stack

- Frontend: React, React Router, Vite, TypeScript, Socket.IO client, Lucide icons
- Backend: Node.js, Express, TypeScript, Socket.IO, Mongoose, JWT, bcryptjs
- Database: MongoDB
- Package management: npm root scripts using `npm --prefix`

## Operational Capabilities

The current implementation supports these end-to-end capabilities:

- JWT authentication with register, login, current-user lookup, and logout on the client
- Password hashing with bcryptjs
- Multi-user support through MongoDB-backed user accounts
- Multi-workspace support with workspace creation and membership-scoped access
- Workspace member listing and owner-only member invites by email
- Workspace-scoped document and folder trees
- Create documents and folders inside selected workspaces
- Rename and edit rich text document content
- Duplicate, archive, and soft-delete documents
- Role-aware document access using workspace membership and document permissions
- Real-time document update broadcasting through authenticated Socket.IO rooms
- Presence events for collaborators joining, leaving, and updating activity
- Inline/general comment creation
- Comment status toggling between open and resolved
- Comment replies API support
- Mention parsing from comment text using `@<userObjectId>` syntax
- Share link creation with role assignment
- Version snapshot creation and restore
- Workspace-scoped document search
- Offline draft preservation in browser `localStorage`
- Centralized backend error handling with consistent JSON responses
- Health endpoint for API and MongoDB connection state
- Permissive CORS for local development and cross-origin API testing

Seeded demo users are created when MongoDB is available:

```text
demo@example.com / Password123!
editor@example.com / Password123!
```

## Repository Structure

```text
.
|-- README.md
|-- package.json                 # Root orchestration scripts
|-- backend/
|   |-- .env.example             # Backend environment variable template
|   |-- .gitignore               # Backend-specific ignored files
|   |-- package.json             # Backend dependencies and scripts
|   |-- package-lock.json
|   |-- tsconfig.json
|   |-- src/
|   |   |-- app.ts               # Express app, middleware, and route mounting
|   |   |-- index.ts             # Backend entrypoint
|   |   |-- server.ts            # HTTP server startup and shutdown handling
|   |   |-- config/
|   |   |   |-- database.ts       # MongoDB connection and connection diagnostics
|   |   |   |-- env.ts            # Environment variable loading/defaults
|   |   |-- constants/
|   |   |   |-- roles.ts          # Document roles and capabilities
|   |   |-- controllers/         # Request validation and business-flow handlers
|   |   |   |-- auth.controller.ts
|   |   |   |-- comment.controller.ts
|   |   |   |-- document.controller.ts
|   |   |   |-- search.controller.ts
|   |   |   |-- version.controller.ts
|   |   |   |-- workspace.controller.ts
|   |   |-- middleware/
|   |   |   |-- auth.middleware.ts  # JWT bearer-token protection
|   |   |   |-- error-handler.ts
|   |   |   |-- not-found.ts
|   |   |   |-- request-context.ts
|   |   |-- models/
|   |   |   |-- comment.model.ts
|   |   |   |-- document.model.ts
|   |   |   |-- share-link.model.ts
|   |   |   |-- user.model.ts
|   |   |   |-- version.model.ts
|   |   |   |-- workspace.model.ts
|   |   |-- routes/              # Thin route declarations only
|   |   |   |-- auth.routes.ts
|   |   |   |-- comment.routes.ts
|   |   |   |-- document.routes.ts
|   |   |   |-- health.routes.ts
|   |   |   |-- me.routes.ts
|   |   |   |-- search.routes.ts
|   |   |   |-- version.routes.ts
|   |   |   |-- workspace.routes.ts
|   |   |-- services/            # Reusable domain/application services
|   |   |   |-- auth.service.ts
|   |   |   |-- permission.service.ts
|   |   |   |-- seed.service.ts
|   |   |-- sockets/
|   |   |   |-- collaboration.socket.ts
|   |   |-- types/
|   |   |   |-- express.d.ts
|   |   |-- utils/
|   |       |-- app-error.ts
|   |       |-- async-handler.ts
|   |       |-- logger.ts
|   |       |-- validation.ts
|-- frontend/
    |-- package.json
    |-- package-lock.json
    |-- index.html
    |-- vite.config.ts
    |-- tsconfig.json
    |-- tsconfig.app.json
    |-- tsconfig.node.json
    |-- public/
    |   |-- favicon.svg
    |   |-- icons.svg
    |-- src/
        |-- App.css
        |-- App.tsx              # Route shell
        |-- index.css
        |-- main.tsx             # BrowserRouter mounting
        |-- api/
        |   |-- client.ts
        |-- components/
        |   |-- ApiError.tsx
        |   |-- DocumentEditor.tsx
        |   |-- EditorToolbar.tsx
        |   |-- Inspector.tsx
        |   |-- Topbar.tsx
        |   |-- WorkspaceSidebar.tsx
        |-- context/
        |   |-- AuthContext.tsx
        |   |-- auth-context-value.ts
        |   |-- useAuth.ts
        |-- pages/
        |   |-- LoginPage.tsx
        |   |-- WorkspacePage.tsx
        |-- types/
            |-- index.ts
```

Generated folders such as `node_modules/`, `dist/`, cache folders, logs, and `.env` files are intentionally excluded from git.

## Environment Variables

Create `backend/.env` from `backend/.env.example`:

```text
PORT=4000
CLIENT_ORIGIN=http://127.0.0.1:5173
MONGO_URI=your-mongo-uri
MONGO_SERVER_SELECTION_TIMEOUT_MS=5000
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
```

The frontend uses this optional variable in `frontend/.env`:

```text
VITE_API_URL=http://localhost:4000
```

If `VITE_API_URL` is not set, the frontend defaults to `http://localhost:4000`.

## Local Development

Install all dependencies from the repo root:

```powershell
npm install
```

Start MongoDB locally or configure `backend/.env` with a reachable `MONGO_URI`.

Start the backend:

```powershell
npm run dev:backend
```

Start the frontend in another terminal:

```powershell
npm run dev:frontend
```

Open the frontend:

```text
http://127.0.0.1:5173
```

Check backend health:

```text
http://localhost:4000/health
```

## Build And Start

Build both apps:

```powershell
npm run build
```

Start the compiled backend:

```powershell
npm start
```

## API Response Shape

Successful responses use:

```json
{
  "success": true,
  "data": {}
}
```

Errors use:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {}
  }
}
```

## Key API Groups

Public endpoints:

- `GET /health` - API and MongoDB connection health
- `POST /api/auth/register` - create user and return JWT
- `POST /api/auth/login` - authenticate and return JWT

Protected endpoints require `Authorization: Bearer <token>`:

- `GET /api/auth/me` - current authenticated user
- `GET /api/me` - current authenticated user alias
- `GET /api/workspaces` - list workspaces for the current user
- `POST /api/workspaces` - create workspace
- `GET /api/workspaces/:workspaceId/tree` - workspace document tree
- `GET /api/workspaces/:workspaceId/members` - list workspace members
- `POST /api/workspaces/:workspaceId/members` - add user to workspace by email
- `POST /api/documents` - create document or folder
- `GET /api/documents/:documentId` - get document metadata/content
- `PATCH /api/documents/:documentId` - update title, content, parent, or status
- `POST /api/documents/:documentId/duplicate` - duplicate a document
- `GET /api/documents/:documentId/comments` - list comments
- `POST /api/documents/:documentId/comments` - create comment
- `POST /api/comments/:commentId/replies` - add reply
- `PATCH /api/comments/:commentId` - update comment status
- `GET /api/documents/:documentId/versions` - list versions
- `POST /api/documents/:documentId/versions` - create version snapshot
- `POST /api/documents/:documentId/restore` - restore version
- `POST /api/documents/:documentId/share-links` - create share link
- `GET /api/search` - search documents in a workspace

Socket.IO collaboration also requires the JWT in the connection auth payload.

## Common Issue: Failed To Fetch

If the frontend shows `API error Failed to fetch`, the browser cannot reach the backend. Check:

- The backend process is running on `http://localhost:4000`.
- MongoDB is running or `MONGO_URI` points to a reachable database.
- `frontend/.env` has the correct `VITE_API_URL` if your backend is not on `http://localhost:4000`.
- Browser devtools Network tab shows a request to the expected backend URL.

## Useful Commands

```powershell
npm run dev:backend
npm run dev:frontend
npm run build
npm run lint
npm start
```
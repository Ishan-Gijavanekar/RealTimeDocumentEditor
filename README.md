# Real-Time Collaborative Document Editor

A MERN TypeScript collaborative document platform inspired by Google Docs and Notion. It provides a workspace document editor with real-time collaboration, document lifecycle management, comments, share links, versions, restore flows, and search.

## Tech Stack

- Frontend: React, Vite, TypeScript, Socket.IO client, Lucide icons
- Backend: Node.js, Express, TypeScript, Socket.IO, Mongoose
- Database: MongoDB
- Package management: npm workspaces-style root scripts using `npm --prefix`

## Operational Capabilities

The current implementation supports these end-to-end capabilities:

- Workspace loading with seeded demo workspace data
- Document and folder tree management
- Create documents and folders
- Rename and edit rich text document content
- Duplicate, archive, and soft-delete documents
- Real-time document update broadcasting through Socket.IO rooms
- Presence events for collaborators joining, leaving, and updating activity
- Inline/general comment creation
- Comment status toggling between open and resolved
- Comment replies API support
- Mention parsing from comment text using `@<userObjectId>` syntax
- Share link creation with role assignment
- Version snapshot creation
- Restore document content from a saved version
- Workspace-scoped document search
- Offline draft preservation in browser `localStorage`
- Centralized backend error handling with consistent JSON responses
- Health endpoint for API and MongoDB connection state
- Permissive CORS for local development and cross-origin API testing

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
|   |   |-- middleware/
|   |   |   |-- error-handler.ts  # Central API error formatter
|   |   |   |-- not-found.ts      # Unknown route handler
|   |   |   |-- request-context.ts # Demo actor extraction
|   |   |-- models/
|   |   |   |-- comment.model.ts
|   |   |   |-- document.model.ts
|   |   |   |-- share-link.model.ts
|   |   |   |-- user.model.ts
|   |   |   |-- version.model.ts
|   |   |   |-- workspace.model.ts
|   |   |-- routes/
|   |   |   |-- comment.routes.ts
|   |   |   |-- document.routes.ts
|   |   |   |-- health.routes.ts
|   |   |   |-- me.routes.ts
|   |   |   |-- search.routes.ts
|   |   |   |-- version.routes.ts
|   |   |   |-- workspace.routes.ts
|   |   |-- services/
|   |   |   |-- permission.service.ts
|   |   |   |-- seed.service.ts
|   |   |-- sockets/
|   |   |   |-- collaboration.socket.ts
|   |   |-- utils/
|   |       |-- app-error.ts
|   |       |-- async-handler.ts
|   |       |-- logger.ts
|   |       |-- validation.ts
|-- frontend/
    |-- package.json             # Frontend dependencies and scripts
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
        |-- App.tsx
        |-- index.css
        |-- main.tsx
        |-- assets/
```

Generated folders such as `node_modules/`, `dist/`, cache folders, logs, and `.env` files are intentionally excluded from git.

## Environment Variables

Create `backend/.env` from `backend/.env.example`:

```text
PORT=4000
CLIENT_ORIGIN= ALLOWED DOMAINS
MONGO_URI= Your Mongo URI
MONGO_SERVER_SELECTION_TIMEOUT_MS= TIMEOUT PERIOD
```

For MongoDB Atlas, replace `MONGO_URI` with your Atlas connection string.

The frontend uses this optional variable:

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

- `GET /health` - API and MongoDB connection health
- `GET /api/me` - current demo user
- `GET /api/workspaces` - list workspaces
- `GET /api/workspaces/:workspaceId/tree` - workspace document tree
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
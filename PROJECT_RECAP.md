# TubeTime Project - Complete Implementation

## 📋 Overview
Self-hosted YouTube chapter tracker with TV Time-style progress tracking.

## 🏗️ Architecture

### Backend (Node.js + Express)
- **Database**: SQLite + Drizzle ORM
- **Auth**: Passport.js (local strategy + sessions)
- **YT Extraction**: Multi-tier (yt-dlp → oEmbed → regex → fallback)
- **API**: RESTful endpoints for auth, videos, chapters

### Frontend (React + Vite)
- **State**: TanStack Query
- **Routing**: React Router v6 (protected routes)
- **Styling**: Tailwind CSS + CSS Variables (Yellow/Dark theme)
- **Forms**: React Hook Form + Zod

## 📁 Project Structure
```
backend/src/
  ├── config/passport.js          # Auth strategy
  ├── db/
  │   ├── schema.ts              # 4 tables: users, videos, chapters, watchProgress
  │   └── database.js            # Drizzle connection
  ├── routes/
  │   ├── auth.js                # Register, login, logout, /me
  │   ├── videos.js              # CRUD + YT extraction trigger
  │   └── chapters.js            # Watch tracking + "Mark Previous"
  ├── services/
  │   ├── youtubeExtractor.js    # Multi-tier metadata extraction
  │   └── chapterService.js      # Watch logic + previous chapter check
  └── index.js                   # Express app + middleware

frontend/src/
  ├── api/client.js              # Axios instance (withCredentials)
  ├── hooks/useAuth.js           # Auth mutations (login/register/logout)
  ├── pages/
  │   ├── Login.jsx              # Auth UI (toggle login/register)
  │   ├── Dashboard.jsx          # Video grid + add video form
  │   └── VideoDetails.jsx       # Chapter list + Hero + Modal
  ├── styles/core.css            # CSS Variables (TV Time theme)
  ├── App.jsx                    # Router + ProtectedRoute wrapper
  └── main.jsx                   # React entry + QueryClientProvider
```

## 🔑 Key Features

### 1. "Mark Previous" Logic
```javascript
// When marking Chapter N:
1. Check chapters where sortOrder < N AND watched = false
2. If found → Modal: "Mark previous X chapters?"
3. User chooses: "Just this one" OR "Mark all"
```

### 2. YouTube Extraction Tiers
```
Tier 1: yt-dlp --dump-single-json (best)
  ↓ fails
Tier 2: oEmbed API + description parse
  ↓ fails
Tier 3: Regex timestamps in description
  ↓ fails
Tier 4: Single chapter = full video
```

### 3. Auth Flow
```
Register → bcrypt hash → DB
Login → Passport verify → session cookie (HTTPOnly)
Protected Routes → req.isAuthenticated() middleware
```

## 🎨 UI Theme (TV Time Style)
```css
--color-primary: #FFC107 (Yellow)
--color-background: #121212 (Dark)
--color-surface: #1E1E1E
--color-watched: rgba(76, 175, 80, 0.15) (Green tint)
```

## 🔌 API Endpoints

**Auth**
- POST /auth/register
- POST /auth/login
- POST /auth/logout
- GET /auth/me

**Videos**
- GET /videos (list user's videos)
- POST /videos (add + extract metadata)
- GET /videos/:id (details + chapters with watch status)

**Chapters**
- POST /chapters/:id/watch?markPrevious=bool
- GET /chapters/:id/check-previous

## ✅ Implementation Status

✓ Backend infrastructure complete
✓ Frontend UI complete
✓ Multi-user authentication
✓ YouTube metadata extraction (multi-tier)
✓ Chapter tracking with watch progress
✓ "Mark Previous" modal logic
✓ Dark theme with yellow accents
✓ Docker configuration
✓ Session-based auth with HTTPOnly cookies

## 🧪 Testing Plan

1. **User Flow**: Register → Login → Dashboard
2. **Video Management**: Add YT URL → Verify metadata extraction
3. **Chapter Tracking**: Mark chapter → Verify "Mark Previous" modal
4. **Watch Progress**: Verify visual feedback (checked icons)
5. **Session**: Refresh → Verify still authenticated

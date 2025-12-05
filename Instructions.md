# Project: TubeTime - Self-Hosted YouTube Chapter Tracker

**Goal:** Generate a production-ready, self-hosted web application.
**Role:** Senior Full-Stack Developer & DevOps Engineer.

## 1\. Project Overview

A web application to track long-form YouTube videos (documentaries, tutorials) as if they were TV shows.

  * **Videos** = TV Shows
  * **Chapters** = Episodes
  * **Seasons** = Optional chapter groupings
  * **Core Feature:** "TV Time" style progress tracking for individual YouTube chapters.

### Key Functionality

1.  **Multi-user Authentication:** Secure sessions with Passport.js.
2.  **Smart Import:** Extract chapters via `yt-dlp` (Tier 1) with fallbacks to API/Description parsing.
3.  **Visuals:** Dark UI inspired by the "TV Time" app (Yellow/Black theme).
4.  **Tracking:** "Mark Previous" logic (marking ch. 10 asks to mark 1-9).
5.  **Resilience:** Caches thumbnails and metadata locally for offline viewing.

## 2\. Technology Stack

### Backend

  * **Runtime:** Node.js 20 (Alpine Linux)
  * **Framework:** Express.js
  * **Database:** SQLite3 (`better-sqlite3`)
  * **ORM:** Drizzle ORM (Type-safe, efficient)
  * **Auth:** Passport.js + `passport-local` + JWT (stored in HTTPOnly cookies)
  * **Validation:** Zod
  * **Tools:** `yt-dlp`, `ffmpeg`, `python3` (installed in Docker)

### Frontend

  * **Framework:** React 18 + Vite
  * **State:** TanStack Query (React Query)
  * **Router:** React Router v6
  * **Styling:** Tailwind CSS + CSS Variables (for theming)
  * **UI Primitives:** Headless UI (`@headlessui/react`)
  * **Drag & Drop:** `@dnd-kit/sortable`
  * **Icons:** Lucide React
  * **Forms:** React Hook Form + Zod

### DevOps

  * **Container:** Docker (Multi-stage build)
  * **Orchestration:** `docker-compose.yml`

-----

## 3\. Database Schema (SQLite)

```typescript
// backend/src/db/schema.ts
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const videos = sqliteTable('videos', {
  id: text('id').primaryKey(), // YouTube Video ID
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  description: text('description'),
  durationSeconds: integer('duration_seconds'),
  youtubeUrl: text('youtube_url').notNull(),
  addedAt: integer('added_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  lastWatchedAt: integer('last_watched_at', { mode: 'timestamp' }),
}, (table) => ({
  userIdx: index('idx_videos_user').on(table.userId),
}));

export const chapters = sqliteTable('chapters', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  videoId: text('video_id').notNull().references(() => videos.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  chapterNumber: integer('chapter_number').notNull(),
  title: text('title').notNull(),
  startTimeSeconds: integer('start_time_seconds').notNull(),
  endTimeSeconds: integer('end_time_seconds'),
  thumbnailUrl: text('thumbnail_url'),
  seasonNumber: integer('season_number').default(1),
  sortOrder: integer('sort_order'), // For drag-drop reordering
}, (table) => ({
  videoIdx: index('idx_chapters_video').on(table.videoId),
  sortIdx: index('idx_chapters_sort').on(table.videoId, table.sortOrder),
}));

export const watchProgress = sqliteTable('watch_progress', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  videoId: text('video_id').notNull().references(() => videos.id, { onDelete: 'cascade' }),
  chapterId: integer('chapter_id').notNull().references(() => chapters.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  watched: integer('watched', { mode: 'boolean' }).default(false),
  watchedAt: integer('watched_at', { mode: 'timestamp' }),
}, (table) => ({
  videoIdx: index('idx_progress_video').on(table.videoId),
}));
```

-----

## 4\. Critical Logic Implementation

### A. YouTube Extraction Service (Multi-Tier)

Implement in `backend/src/services/youtubeExtractor.js`:

1.  **Tier 1:** `yt-dlp --dump-single-json` (Best for metadata/chapters).
2.  **Tier 2:** YouTube oEmbed API + HTML description parsing.
3.  **Tier 3:** Regex parsing of description text for timestamps (e.g., `04:20 - Topic`).
4.  **Fallback:** Create a single chapter covering the full video duration.

### B. "Mark Previous" Logic

Implement in `backend/src/services/chapterService.js`:

  * When a user marks Chapter $X$ as watched:
      * Query DB for all chapters with `sortOrder < X` (or `chapterNumber < X`) for this video.
      * Filter for those where `watched = false`.
      * If `count > 0`: Return `{ requiresMarkPrevious: true, previousChapterIds: [...] }`.
      * Else: Just mark Chapter $X$.

### C. Authentication (Passport)

  * **Strategy:** `passport-local` verifying username against bcrypt hash.
  * **Session:** HTTPOnly Cookie, `SameSite: Lax`, Secure (in prod).

-----

## 5\. UI/UX Requirements

### Styling (Tailwind + Variables)

The app must support hot-swapping themes via CSS variables.
**Base Theme (TV Time Yellow):**

```css
:root {
  --color-primary: #FFC107;
  --color-primary-dark: #FFA000;
  --color-background: #121212;
  --color-surface: #1E1E1E;
  --color-surface-elevated: #2C2C2C;
  --color-text-primary: #FFFFFF;
  --color-text-secondary: #B3B3B3;
  --color-success: #4CAF50;
  --color-watched: rgba(76, 175, 80, 0.15);
  --border-radius: 12px;
}
```

### Pages

1.  **Dashboard:**
      * Grid of `VideoCard` components.
      * Badge: "Next: Chapter [X]".
      * Quick-action "Check" button on hover.
2.  **Video Details:**
      * **Hero:** Large banner.
      * **Tabs:** "About" vs "Chapters".
      * **List:** `ChapterRow` components (Sortable via `@dnd-kit`).
3.  **Modals:**
      * `ReviewChaptersModal`: Allow user to edit/add chapters before saving a video.
      * `MarkPreviousModal`: "Mark previous [N] chapters as watched?"

-----

## 6\. Implementation Checklist & File Structure

Generate the application following this strict structure:

```text
/
├── backend/
│   ├── src/
│   │   ├── config/ (auth.js, passport.js)
│   │   ├── db/ (schema.ts, database.js)
│   │   ├── routes/ (auth.js, videos.js, chapters.js, themes.js)
│   │   ├── services/ (youtubeExtractor.js, thumbnailCache.js)
│   │   └── index.js
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/ (client.js)
│   │   ├── components/ (video/, chapter/, modals/, ui/)
│   │   ├── hooks/ (useAuth.js, useTheme.js)
│   │   ├── pages/
│   │   ├── styles/ (core.css, themes/default.css)
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
├── docker-compose.yml
└── .env.example
```

**Instruction:**
Generate the complete, functional application code. Ensure `yt-dlp` is correctly installed in the Dockerfile. Use the exact Drizzle schema provided. Ensure the "Mark Previous" modal logic is wired up in the Frontend `VideoDetailsPage`.
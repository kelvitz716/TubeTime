<p align="center">
  <h1 align="center">📺 TubeTime</h1>
  <p align="center">
    <strong>Transform long YouTube videos into binge-worthy TV show experiences</strong>
  </p>
  <p align="center">
    Track your progress through chapters like episodes, pick up where you left off, and never lose your place again.
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=white" alt="React">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite&logoColor=white" alt="SQLite">
  <img src="https://img.shields.io/badge/Tailwind-3.x-38B2AC?logo=tailwindcss&logoColor=white" alt="Tailwind">
</p>

---

## ✨ Features

### 📖 Chapter-Based Progress Tracking
- Automatically extracts chapters from YouTube videos
- Track watched/unwatched status for each chapter
- Visual progress bars show completion at a glance

### 🎬 TV Show Experience
- Videos become "shows", chapters become "episodes"
- Season-based organization with progress indicators
- Satisfying completion animations

### 📋 Manual Chapter Entry
- Paste chapter timestamps from video descriptions or comments
- Supports multiple formats (with/without hours, emojis, parentheses)
- Smart parsing handles various timestamp styles

### 👥 Multi-User Support
- User registration and authentication
- Each user has their own video library and progress
- Session-based authentication for security

### 🎨 Modern UI/UX
- Dark mode interface with vibrant accents
- Smooth animations and micro-interactions
- Responsive design for all screen sizes
- Human-readable durations (1:23:45 format)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- SQLite3

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/tubetime.git
cd tubetime

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Database Setup

```bash
cd backend

# Create database and apply schema
sqlite3 tubetime.db < drizzle/0000_good_carmella_unuscione.sql

# Seed with test data (optional)
npx tsx seed.js
```

### Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm start
# Server running on http://localhost:3000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# App available at http://localhost:5173 (Development Mode)
```

> **Note:** When running via Docker, the app is available at `http://localhost:8080`.

### Default Test Account
- **Username:** `testuser`
- **Password:** `test123`

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, TanStack Query, React Router |
| **Styling** | Tailwind CSS, Lucide Icons |
| **Backend** | Node.js, Express, Passport.js |
| **Database** | SQLite, Drizzle ORM |
| **Video Data** | yt-dlp (YouTube extraction) |

---

## 📁 Project Structure

```
tubetime/
├── frontend/
│   ├── src/
│   │   ├── pages/           # React pages (Dashboard, Login, VideoDetails)
│   │   ├── components/      # Reusable UI components
│   │   ├── hooks/           # Custom hooks (useAuth)
│   │   ├── api/             # API client configuration
│   │   └── styles/          # Global CSS and Tailwind config
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── routes/          # API routes (auth, videos, chapters)
│   │   ├── services/        # Business logic (youtubeExtractor)
│   │   ├── db/              # Database schema and connection
│   │   └── config/          # Passport configuration
│   ├── drizzle/             # Database migrations
│   └── package.json
│
└── README.md
```

---

## 🎯 Key Features Explained

### Chapter Extraction
When adding a YouTube video, TubeTime:
1. Fetches video metadata using yt-dlp
2. Extracts chapter markers from the video
3. Creates trackable "episodes" from each chapter

### Manual Chapter Entry
If a video doesn't have built-in chapters, you can:
1. Copy timestamps from the description or comments
2. Paste them into the modal when prompted
3. TubeTime parses various formats automatically

**Supported formats:**
```
00:00 Introduction
01:30:00 Advanced Topics
(00:45:30) With Parentheses
🎤 (01:00:00) With Emojis
```

### Mark Previous Chapters
When marking a later chapter as watched, TubeTime asks if you want to mark all previous unwatched chapters too—perfect for catching up after a break.

---

## 🔧 Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=3000
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

---

## 📝 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Register new user |
| `POST` | `/auth/login` | Login user |
| `POST` | `/auth/logout` | Logout user |
| `GET` | `/auth/me` | Get current user |
| `GET` | `/videos` | List user's videos |
| `POST` | `/videos` | Add new video |
| `POST` | `/videos/preview` | Preview video info |
| `DELETE` | `/videos/:id` | Delete video |
| `GET` | `/videos/:id` | Get video with chapters |
| `POST` | `/chapters/:id/watch` | Mark chapter watched |
| `DELETE` | `/chapters/:id/watch` | Unmark chapter |

---

## 🐳 Docker

```bash
docker compose up --build
```

Access the app at `http://localhost:8080`

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Made with ❤️ for binge-watchers everywhere
</p>

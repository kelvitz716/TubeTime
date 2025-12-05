# TubeTime - Manual Setup & Verification Guide

## System Information
- **OS**: Fedora 43
- **Docker**: v2 (use `docker compose` not `docker-compose`)
- **Node.js**: Required for running the application

## Issue Summary
The automated setup was failing due to:
1. Missing build tools (`make`, `gcc`) for compiling `better-sqlite3`
2. Database seeding requires `npx tsx` (not plain `node`) because seed.js uses ES6 imports
3. Database initialization needs proper sequencing

## Prerequisites

### Install Development Tools (Required)
```bash
sudo dnf install @development-tools
```

This installs `make`, `gcc`, and other compilation tools needed for native Node.js modules like `better-sqlite3`.

## Manual Setup Steps

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Initialize Database

The database needs to be created and seeded. Two approaches:

**Option A: Using SQL Migration (Recommended)**
```bash
cd backend
sqlite3 tubetime.db < drizzle/0000_good_carmella_unuscione.sql
npx tsx seed.js
```

**Option B: Let seed.js create the database**
```bash
cd backend
npx tsx seed.js
```
*Note: This might fail if schema doesn't exist. Use Option A if issues occur.*

**Important:** Always use `npx tsx seed.js` not `node seed.js` - the seed file uses ES6 imports.

This creates:
- Test user: `testuser` / `test123`
- Sample video: "Sample Documentary: The Story of Time"
- 5 test chapters

### 3. Verify Database
```bash
cd backend
echo "SELECT * FROM users;" | sqlite3 tubetime.db
```
Should show the testuser entry.

### 4. Start Backend Server (Terminal 1)
```bash
cd backend
npm start
```
Should output: `Server running on port 3000`

### 5. Start Frontend Dev Server (Terminal 2)
```bash
cd frontend
npm run dev
```
Should output Vite dev server on `http://localhost:5173`

## Verification Tests

Open browser to `http://localhost:5173`

### Test 1: Login
1. Username: `testuser`
2. Password: `test123`
3. ✓ Should redirect to dashboard showing "Hi, testuser"

### Test 2: View Video
1. ✓ Should see "Sample Documentary: The Story of Time" video card
2. Click the video card
3. ✓ Should navigate to video details page

### Test 3: Chapter Tracking
1. ✓ Should see 5 chapters listed on video page
2. Click on **Chapter 3** "Understanding Spacetime"
3. ✓ Modal appears: "You have 2 unwatched chapters before this one"
4. Click "Yes, mark all"
5. ✓ Chapters 1, 2, and 3 should show as watched (checkmarks or different styling)

### Test 4: Logout
1. Click "Back to Dashboard"
2. Click "Logout"
3. ✓ Should redirect to login page

## Docker Alternative (v2 Syntax)

**Note:** On Fedora 43 with Docker v2, use `docker compose` (space, not hyphen):

```bash
docker compose up --build
```

Then access `http://localhost:5173` and run the same verification tests.

## Troubleshooting

### Database Issues

**Error: "500 Internal Server Error on login"**
```bash
cd backend
rm -f tubetime.db
sqlite3 tubetime.db < drizzle/0000_good_carmella_unuscione.sql
npx tsx seed.js
# Restart backend server
```

**Verify database has data:**
```bash
sqlite3 tubetime.db "SELECT username FROM users;"
```

### Build Issues

**Error: "gyp ERR! not found: make"**
```bash
sudo dnf install @development-tools
cd backend
rm -rf node_modules package-lock.json
npm install
```

**Error: "command not found: tsx"**
```bash
cd backend
npm install
# tsx should now be in node_modules/.bin/
```

### Server Issues

**Backend won't start:**
- Check if port 3000 is already in use: `lsof -i :3000`
- Check for errors in backend console
- Verify database file exists: `ls -lh backend/tubetime.db`

**Frontend shows blank page:**
- Verify backend is running on port 3000
- Check browser console for errors (F12)
- Verify frontend can reach backend: `curl http://localhost:3000`

## Manual Testing Recap

When running manual tests, document your attempts here for reference:

**Database initialization attempts:**
- [ ] Applied SQL schema: `sqlite3 tubetime.db < drizzle/0000_good_carmella_unuscione.sql`
- [ ] Seeded test data: `npx tsx seed.js`
- [ ] Verified data: `sqlite3 tubetime.db "SELECT * FROM users;"`

**Server startup:**
- [ ] Backend started: `npm start` in backend/
- [ ] Frontend started: `npm run dev` in frontend/

**Browser tests completed:**
- [ ] Login successful
- [ ] Video card visible and clickable
- [ ] Chapter tracking with modal working
- [ ] Logout successful

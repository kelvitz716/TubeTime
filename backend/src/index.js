import express from 'express';
import { createServer } from 'http';
import session from 'express-session';
import passport from 'passport';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import videoRoutes from './routes/videos.js';
import chapterRoutes from './routes/chapters.js';
import statsRoutes from './routes/stats.js';
import resourceRoutes from './routes/resourceRoutes.js';
import { initializeSocket } from './services/socketManager.js';
import './config/passport.js';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
// Trust first proxy (Fly.io load balancer) for secure cookies
app.set('trust proxy', 1);

const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;

// Initialize Socket.io
initializeSocket(httpServer, {
    corsOrigin: process.env.FRONTEND_URL || 'http://localhost:5173'
});

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

app.use(session({
    secret: process.env.JWT_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/chapters', chapterRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/resources', resourceRoutes);

// Health check endpoint for Docker
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Serve static files from the 'public' directory
const publicPath = path.join(process.cwd(), 'public');
if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));
}

app.get('/', (req, res) => {
    // If index.html exists, serve it (production mode)
    const indexPath = path.join(publicPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.send('TubeTime Backend API (Frontend not served)');
    }
});

app.get('*', (req, res) => {
    // API 404 handler
    if (req.path.startsWith('/api') || req.path.startsWith('/auth') || req.path.startsWith('/videos') || req.path.startsWith('/chapters') || req.path.startsWith('/stats') || req.path.startsWith('/resources')) {
        return res.status(404).json({ error: 'Not found' });
    }

    // Frontend catch-all for client-side routing
    const indexPath = path.join(publicPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Not Found');
    }
});

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT} with WebSocket support`);
});

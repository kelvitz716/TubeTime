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
import { initializeSocket } from './services/socketManager.js';
import './config/passport.js';

dotenv.config();

const app = express();
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

app.use('/auth', authRoutes);
app.use('/videos', videoRoutes);
app.use('/chapters', chapterRoutes);
app.use('/stats', statsRoutes);

// Health check endpoint for Docker
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
    res.send('TubeTime Backend API');
});

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT} with WebSocket support`);
});

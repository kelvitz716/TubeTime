import express from 'express';
import session from 'express-session';
import passport from 'passport';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import videoRoutes from './routes/videos';
import chapterRoutes from './routes/chapters';
import './config/passport';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

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

app.get('/', (req, res) => {
    res.send('TubeTime Backend API');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

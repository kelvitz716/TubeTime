import express from 'express';
import { db } from '../db/database';
import { videos, chapters, watchProgress } from '../db/schema';
import { youtubeExtractor } from '../services/youtubeExtractor';
import { eq, desc, and } from 'drizzle-orm';

const router = express.Router();

// Middleware to check auth
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ message: 'Unauthorized' });
};

router.use(isAuthenticated);

router.get('/', async (req, res) => {
    try {
        const userVideos = await db.select().from(videos).where(eq(videos.userId, req.user.id)).orderBy(desc(videos.addedAt));
        res.json(userVideos);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching videos', error });
    }
});

router.post('/', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ message: 'URL is required' });

    try {
        const info = await youtubeExtractor.extractInfo(url);

        // Save video
        await db.insert(videos).values({
            id: info.id,
            userId: req.user.id,
            title: info.title,
            thumbnailUrl: info.thumbnailUrl,
            description: info.description,
            durationSeconds: info.durationSeconds,
            youtubeUrl: url,
        }).onConflictDoNothing(); // Simple handling for now

        // Save chapters
        if (info.chapters && info.chapters.length > 0) {
            for (const ch of info.chapters) {
                await db.insert(chapters).values({
                    videoId: info.id,
                    userId: req.user.id,
                    chapterNumber: ch.chapterNumber,
                    title: ch.title,
                    startTimeSeconds: ch.startTimeSeconds,
                    endTimeSeconds: ch.endTimeSeconds,
                    sortOrder: ch.chapterNumber
                });
            }
        }

        res.status(201).json(info);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error adding video', error: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const video = await db.select().from(videos).where(eq(videos.id, req.params.id)).get();
        if (!video) return res.status(404).json({ message: 'Video not found' });

        const videoChapters = await db.select({
            ...chapters,
            watched: watchProgress.watched
        })
            .from(chapters)
            .leftJoin(watchProgress, and(
                eq(chapters.id, watchProgress.chapterId),
                eq(watchProgress.userId, req.user.id)
            ))
            .where(eq(chapters.videoId, video.id))
            .all();

        // Map null watched to false
        const chaptersWithStatus = videoChapters.map(ch => ({
            ...ch,
            watched: !!ch.watched
        }));

        res.json({ ...video, chapters: chaptersWithStatus });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching video details', error });
    }
});

export default router;

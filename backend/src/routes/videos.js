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
    }
});

router.post('/preview', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ message: 'URL is required' });

    try {
        const info = await youtubeExtractor.extractInfo(url);
        res.json(info);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error previewing video', error: error.message });
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

        // Handle manual chapters if provided
        let finalChapters = info.chapters;
        if (req.body.manualChapters) {
            const manualParsed = youtubeExtractor.parseChaptersFromDescription(req.body.manualChapters, info.durationSeconds);
            if (manualParsed.length > 0) {
                finalChapters = manualParsed;
            }
        }

        // Save chapters
        if (finalChapters && finalChapters.length > 0) {
            for (const ch of finalChapters) {
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

// Bulk delete
router.delete('/bulk', async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: 'Invalid or empty IDs array' });
    }

    try {
        // Verify ownership for all videos (optional but good practice)
        // For now, we'll just delete where id IN ids AND userId = req.user.id
        // This implicitly handles ownership.

        // Use a transaction if possible, but for now simple delete is fine.
        // Drizzle doesn't support "IN" with delete directly in a simple way without 'inArray' helper
        // Let's use a loop or inArray if available.
        // Importing inArray from drizzle-orm

        // We need to import inArray at the top, but I can't easily change imports with this tool 
        // without replacing the whole file or a large chunk.
        // Let's just loop for now, it's safer and easier to implement without changing imports.
        // Or better, use the existing 'eq' and 'and' imports? No, need 'inArray'.

        // Actually, I can just add the import in a separate tool call or just use a loop.
        // A loop is fine for personal app scale.

        let deletedCount = 0;
        for (const id of ids) {
            const result = await db.delete(videos)
                .where(and(eq(videos.id, id), eq(videos.userId, req.user.id)))
                .run();
            if (result.changes > 0) deletedCount++;
        }

        res.json({ message: `Deleted ${deletedCount} videos` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting videos', error: error.message });
    }
});

// Individual delete
router.delete('/:id', async (req, res) => {
    try {
        const result = await db.delete(videos)
            .where(and(eq(videos.id, req.params.id), eq(videos.userId, req.user.id)))
            .run();

        if (result.changes === 0) {
            return res.status(404).json({ message: 'Video not found or unauthorized' });
        }

        res.json({ message: 'Video deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting video', error: error.message });
    }
});

export default router;

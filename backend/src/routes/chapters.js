import express from 'express';
import { chapterService } from '../services/chapterService';

const router = express.Router();

const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ message: 'Unauthorized' });
};

router.use(isAuthenticated);

router.post('/:id/watch', async (req, res) => {
    const { id } = req.params;
    const { markPrevious } = req.body;

    try {
        // We need videoId for the service, but let's assume we can fetch it or just pass chapterId
        // The service implementation I wrote earlier takes (userId, videoId, chapterId).
        // I need to fetch the videoId from the chapterId first or update the service.
        // Let's update the route to fetch the chapter first to get the videoId.

        // Actually, let's just pass the chapterId and let the service handle looking up the videoId if needed,
        // BUT my service implementation expects videoId.
        // Let's quickly peek at the service implementation I wrote.
        // It does: `const targetChapter = await db.select().from(chapters).where(eq(chapters.id, chapterId)).get();`
        // So I can get videoId from there.

        // Wait, the service signature is `markChapterWatched(userId, videoId, chapterId, markPrevious)`.
        // I should probably refactor the service to not require videoId if it can look it up, OR look it up here.
        // Looking it up here is safer for now without changing the service file I just wrote.

        // However, I don't have direct DB access here easily without importing it.
        // Let's import db and chapters.

        const { db } = await import('../db/database');
        const { chapters } = await import('../db/schema');
        const { eq } = await import('drizzle-orm');

        const chapter = await db.select().from(chapters).where(eq(chapters.id, parseInt(id))).get();
        if (!chapter) return res.status(404).json({ message: 'Chapter not found' });

        const result = await chapterService.markChapterWatched(req.user.id, chapter.videoId, parseInt(id), markPrevious);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Error marking chapter', error: error.message });
    }
});

router.delete('/:id/watch', async (req, res) => {
    const { id } = req.params;
    try {
        await chapterService.unmarkChapterWatched(req.user.id, parseInt(id));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'Error unmarking chapter', error: error.message });
    }
});


router.get('/:id/check-previous', async (req, res) => {
    const { id } = req.params;
    try {
        const { db } = await import('../db/database');
        const { chapters } = await import('../db/schema');
        const { eq } = await import('drizzle-orm');

        const chapter = await db.select().from(chapters).where(eq(chapters.id, parseInt(id))).get();
        if (!chapter) return res.status(404).json({ message: 'Chapter not found' });

        const result = await chapterService.checkPreviousChapters(req.user.id, chapter.videoId, parseInt(id));
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Error checking previous chapters', error: error.message });
    }
});

export default router;

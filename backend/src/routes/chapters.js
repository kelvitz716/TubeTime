import express from 'express';
import { chapterService } from '../services/chapterService.js';
import { emitProgressUpdate } from '../services/socketManager.js';

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
        const { db } = await import('../db/database.js');
        const { chapters } = await import('../db/schema.js');
        const { eq } = await import('drizzle-orm');

        const chapter = await db.select().from(chapters).where(eq(chapters.id, parseInt(id))).get();
        if (!chapter) return res.status(404).json({ message: 'Chapter not found' });

        const result = await chapterService.markChapterWatched(req.user.id, chapter.videoId, parseInt(id), markPrevious);

        // Emit real-time update
        emitProgressUpdate(req.user.id, chapter.videoId, {
            chapterId: parseInt(id),
            watched: true,
            markPrevious
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Error marking chapter', error: error.message });
    }
});

router.delete('/:id/watch', async (req, res) => {
    const { id } = req.params;
    try {
        const { db } = await import('../db/database.js');
        const { chapters } = await import('../db/schema.js');
        const { eq } = await import('drizzle-orm');

        const chapter = await db.select().from(chapters).where(eq(chapters.id, parseInt(id))).get();

        await chapterService.unmarkChapterWatched(req.user.id, parseInt(id));

        // Emit real-time update
        if (chapter) {
            emitProgressUpdate(req.user.id, chapter.videoId, {
                chapterId: parseInt(id),
                watched: false
            });
        }

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

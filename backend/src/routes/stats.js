import express from 'express';
import { db } from '../db/database.js';
import { videos, chapters, watchProgress } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';

const router = express.Router();

// Middleware to check authentication
const requireAuth = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
    }
    next();
};

router.use(requireAuth);

router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;

        // Get total videos count
        const videoCount = await db
            .select({ count: sql`count(*)` })
            .from(videos)
            .where(eq(videos.userId, userId))
            .get();

        // Get total chapters count
        const chapterCount = await db
            .select({ count: sql`count(*)` })
            .from(chapters)
            .where(eq(chapters.userId, userId))
            .get();

        // Get watched chapters count
        const watchedCount = await db
            .select({ count: sql`count(*)` })
            .from(watchProgress)
            .where(and(
                eq(watchProgress.userId, userId),
                eq(watchProgress.watched, true)
            ))
            .get();

        // Get total watch time (simplified - sum duration of watched chapters)
        const watchTimeResult = await db
            .select({
                totalSeconds: sql`COALESCE(SUM(${chapters.endTimeSeconds} - ${chapters.startTimeSeconds}), 0)`
            })
            .from(watchProgress)
            .innerJoin(chapters, eq(watchProgress.chapterId, chapters.id))
            .where(and(
                eq(watchProgress.userId, userId),
                eq(watchProgress.watched, true)
            ))
            .get();

        // Get remaining time (all chapters minus watched)
        const totalTimeResult = await db
            .select({
                totalSeconds: sql`COALESCE(SUM(${chapters.endTimeSeconds} - ${chapters.startTimeSeconds}), 0)`
            })
            .from(chapters)
            .where(eq(chapters.userId, userId))
            .get();

        const watchedTime = watchTimeResult?.totalSeconds || 0;
        const totalTime = totalTimeResult?.totalSeconds || 0;
        const remainingTime = totalTime - watchedTime;

        // Get top videos by progress
        const topVideos = await db
            .select({
                videoId: videos.id,
                title: videos.title,
                thumbnailUrl: videos.thumbnailUrl,
            })
            .from(videos)
            .where(eq(videos.userId, userId))
            .limit(5)
            .all();

        // Enrich top videos with chapter counts
        const enrichedVideos = await Promise.all(
            topVideos.map(async (video) => {
                const totalChapters = await db
                    .select({ count: sql`count(*)` })
                    .from(chapters)
                    .where(eq(chapters.videoId, video.videoId))
                    .get();

                const watchedChapters = await db
                    .select({ count: sql`count(*)` })
                    .from(watchProgress)
                    .innerJoin(chapters, eq(watchProgress.chapterId, chapters.id))
                    .where(and(
                        eq(chapters.videoId, video.videoId),
                        eq(watchProgress.userId, userId),
                        eq(watchProgress.watched, true)
                    ))
                    .get();

                const total = totalChapters?.count || 0;
                const watched = watchedChapters?.count || 0;

                return {
                    id: video.videoId,
                    title: video.title,
                    thumbnailUrl: video.thumbnailUrl,
                    totalChapters: total,
                    watchedChapters: watched,
                    progress: total > 0 ? Math.round((watched / total) * 100) : 0
                };
            })
        );

        // Sort by progress descending
        enrichedVideos.sort((a, b) => b.progress - a.progress);

        res.json({
            summary: {
                totalVideos: videoCount?.count || 0,
                totalChapters: chapterCount?.count || 0,
                watchedChapters: watchedCount?.count || 0,
                completionPercentage: chapterCount?.count > 0
                    ? Math.round((watchedCount?.count / chapterCount?.count) * 100)
                    : 0,
                totalWatchTimeSeconds: watchedTime,
                remainingTimeSeconds: remainingTime > 0 ? remainingTime : 0,
            },
            recentActivity: [], // Simplified - can add back if needed
            topVideos: enrichedVideos
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ message: 'Error fetching statistics', error: error.message });
    }
});

export default router;


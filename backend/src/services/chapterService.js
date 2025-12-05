import { db } from '../db/database';
import { chapters, watchProgress } from '../db/schema';
import { eq, and, lt, asc } from 'drizzle-orm';

import fs from 'fs';

export class ChapterService {
    log(message) {
        fs.appendFileSync('debug_log.txt', message + '\n');
    }

    async markChapterWatched(userId, videoId, chapterId, markPrevious = false) {
        // 1. Get the target chapter to know its sort order/number
        const targetChapter = await db.select().from(chapters).where(eq(chapters.id, chapterId)).get();

        if (!targetChapter) {
            throw new Error('Chapter not found');
        }

        // 2. If markPrevious is requested, find all previous unwatched chapters
        this.log(`markChapterWatched: userId=${userId}, chapterId=${chapterId}, markPrevious=${markPrevious}`);
        if (markPrevious) {
            this.log("Marking previous chapters...");
            const previousChapters = await db.select()
                .from(chapters)
                .where(and(
                    eq(chapters.videoId, videoId),
                    lt(chapters.sortOrder, targetChapter.sortOrder) // Assuming sortOrder is reliable
                ));

            for (const prevChap of previousChapters) {
                await this.upsertWatchProgress(userId, videoId, prevChap.id, true);
            }
        }

        // 3. Mark the target chapter
        await this.upsertWatchProgress(userId, videoId, chapterId, true);

        return { success: true };
    }

    async checkPreviousChapters(userId, videoId, chapterId) {
        this.log(`checkPreviousChapters: userId=${userId}, chapterId=${chapterId}`);
        const targetChapter = await db.select().from(chapters).where(eq(chapters.id, chapterId)).get();
        if (!targetChapter) return { requiresMarkPrevious: false };

        // Find chapters before this one
        const previousChapters = await db.select()
            .from(chapters)
            .where(and(
                eq(chapters.videoId, videoId),
                lt(chapters.sortOrder, targetChapter.sortOrder)
            ))
            .orderBy(asc(chapters.sortOrder));

        // Check which ones are NOT watched
        const unwatchedPreviousIds = [];
        for (const prevChap of previousChapters) {
            const progress = await db.select()
                .from(watchProgress)
                .where(and(
                    eq(watchProgress.userId, userId),
                    eq(watchProgress.chapterId, prevChap.id),
                    eq(watchProgress.watched, true)
                ))
                .get();

            if (!progress) {
                unwatchedPreviousIds.push(prevChap.id);
            }
        }

        this.log(`checkPreviousChapters: unwatched count=${unwatchedPreviousIds.length}`);
        if (unwatchedPreviousIds.length > 0) {
            return {
                requiresMarkPrevious: true,
                previousChapterIds: unwatchedPreviousIds
            };
        }

        return { requiresMarkPrevious: false };
    }

    async upsertWatchProgress(userId, videoId, chapterId, watched) {
        this.log(`upsertWatchProgress: userId=${userId}, chapterId=${chapterId}, watched=${watched}`);
        const existing = await db.select()
            .from(watchProgress)
            .where(and(
                eq(watchProgress.userId, userId),
                eq(watchProgress.chapterId, chapterId)
            ))
            .get();

        if (existing) {
            await db.update(watchProgress)
                .set({ watched, watchedAt: new Date() })
                .where(eq(watchProgress.id, existing.id));
        } else {
            await db.insert(watchProgress).values({
                userId,
                videoId,
                chapterId,
                watched,
                watchedAt: new Date()
            });
        }
    }

    async unmarkChapterWatched(userId, chapterId) {
        this.log(`unmarkChapterWatched: userId=${userId}, chapterId=${chapterId}`);
        await db.update(watchProgress)
            .set({ watched: false, watchedAt: null })
            .where(and(
                eq(watchProgress.userId, userId),
                eq(watchProgress.chapterId, chapterId)
            ));
        return { success: true };
    }

}

export const chapterService = new ChapterService();

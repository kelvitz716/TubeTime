/**
 * Unit tests for cache service
 * Run with: npx jest cacheService.test.js
 */

import {
    getCachedVideo,
    cacheVideo,
    invalidateVideoCache,
    getCacheStats,
    clearVideoCache
} from './cacheService.js';

describe('CacheService', () => {
    beforeEach(() => {
        clearVideoCache();
    });

    describe('cacheVideo and getCachedVideo', () => {
        it('should cache and retrieve video data', () => {
            const videoId = 'test123';
            const videoData = { id: videoId, title: 'Test Video' };

            cacheVideo(videoId, videoData);
            const retrieved = getCachedVideo(videoId);

            expect(retrieved).toEqual(videoData);
        });

        it('should return undefined for non-existent key', () => {
            expect(getCachedVideo('nonexistent')).toBeUndefined();
        });
    });

    describe('invalidateVideoCache', () => {
        it('should remove cached video', () => {
            const videoId = 'test456';
            cacheVideo(videoId, { id: videoId });

            invalidateVideoCache(videoId);

            expect(getCachedVideo(videoId)).toBeUndefined();
        });
    });

    describe('getCacheStats', () => {
        it('should return cache statistics', () => {
            cacheVideo('v1', { id: 'v1' });
            cacheVideo('v2', { id: 'v2' });

            const stats = getCacheStats();

            expect(stats.keys).toBe(2);
            expect(stats.stats).toBeDefined();
        });
    });

    describe('clearVideoCache', () => {
        it('should clear all cached videos', () => {
            cacheVideo('v1', { id: 'v1' });
            cacheVideo('v2', { id: 'v2' });

            clearVideoCache();

            expect(getCacheStats().keys).toBe(0);
        });
    });
});

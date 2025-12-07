import NodeCache from 'node-cache';

// Cache for YouTube video metadata
// TTL: 24 hours (86400 seconds), check period: 10 minutes
const videoCache = new NodeCache({
    stdTTL: 86400,
    checkperiod: 600,
    useClones: false // For better performance with complex objects
});

/**
 * Get cached video info
 * @param {string} videoId - YouTube video ID
 * @returns {Object|undefined} Cached video info or undefined
 */
export function getCachedVideo(videoId) {
    return videoCache.get(videoId);
}

/**
 * Cache video info
 * @param {string} videoId - YouTube video ID
 * @param {Object} videoInfo - Video metadata to cache
 * @param {number} [ttl] - Optional custom TTL in seconds
 */
export function cacheVideo(videoId, videoInfo, ttl) {
    if (ttl) {
        videoCache.set(videoId, videoInfo, ttl);
    } else {
        videoCache.set(videoId, videoInfo);
    }
}

/**
 * Delete cached video info
 * @param {string} videoId - YouTube video ID
 */
export function invalidateVideoCache(videoId) {
    videoCache.del(videoId);
}

/**
 * Get cache statistics
 * @returns {Object} Cache stats including keys, hits, misses
 */
export function getCacheStats() {
    return {
        keys: videoCache.keys().length,
        stats: videoCache.getStats()
    };
}

/**
 * Clear all cached videos
 */
export function clearVideoCache() {
    videoCache.flushAll();
}

export default {
    getCachedVideo,
    cacheVideo,
    invalidateVideoCache,
    getCacheStats,
    clearVideoCache
};

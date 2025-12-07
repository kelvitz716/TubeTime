/**
 * Unit tests for YouTube chapter parsing
 * Run with: npx jest youtubeExtractor.test.js
 */

// Mock the cache service
jest.mock('./cacheService.js', () => ({
    getCachedVideo: jest.fn(),
    cacheVideo: jest.fn(),
}));

import { YouTubeExtractor } from './youtubeExtractor.js';

describe('YouTubeExtractor', () => {
    let extractor;

    beforeEach(() => {
        extractor = new YouTubeExtractor();
    });

    describe('extractVideoId', () => {
        it('should extract ID from standard YouTube URL', () => {
            expect(extractor.extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'))
                .toBe('dQw4w9WgXcQ');
        });

        it('should extract ID from short YouTube URL', () => {
            expect(extractor.extractVideoId('https://youtu.be/dQw4w9WgXcQ'))
                .toBe('dQw4w9WgXcQ');
        });

        it('should extract ID from embed URL', () => {
            expect(extractor.extractVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ'))
                .toBe('dQw4w9WgXcQ');
        });

        it('should return null for invalid URL', () => {
            expect(extractor.extractVideoId('not-a-url')).toBeNull();
        });
    });

    describe('parseChapters', () => {
        it('should parse simple timestamp format (MM:SS Title)', () => {
            const text = `00:00 Introduction
01:30 First Topic
05:45 Conclusion`;

            const chapters = extractor.parseChapters(text);

            expect(chapters).toHaveLength(3);
            expect(chapters[0]).toEqual({
                chapterNumber: 1,
                title: 'Introduction',
                startTimeSeconds: 0
            });
            expect(chapters[1]).toEqual({
                chapterNumber: 2,
                title: 'First Topic',
                startTimeSeconds: 90
            });
        });

        it('should parse hour format (HH:MM:SS Title)', () => {
            const text = `00:00:00 Start
01:30:00 One Hour Thirty
02:45:30 Almost Three Hours`;

            const chapters = extractor.parseChapters(text);

            expect(chapters).toHaveLength(3);
            expect(chapters[0].startTimeSeconds).toBe(0);
            expect(chapters[1].startTimeSeconds).toBe(5400); // 1.5 hours in seconds
            expect(chapters[2].startTimeSeconds).toBe(9930); // 2:45:30 in seconds
        });

        it('should parse timestamps with parentheses', () => {
            const text = `(00:00) Introduction
(05:30) Middle Part`;

            const chapters = extractor.parseChapters(text);

            expect(chapters).toHaveLength(2);
            expect(chapters[0].title).toBe('Introduction');
            expect(chapters[1].startTimeSeconds).toBe(330);
        });

        it('should handle emojis in chapter titles', () => {
            const text = `🎤 00:00 Welcome
🎵 05:00 Music Section`;

            const chapters = extractor.parseChapters(text);

            expect(chapters).toHaveLength(2);
            // Titles should have emojis stripped based on implementation
        });

        it('should return empty array for text without timestamps', () => {
            const text = 'This is just regular text without any timestamps.';
            const chapters = extractor.parseChapters(text);
            expect(chapters).toHaveLength(0);
        });
    });

    describe('parseChaptersFromDescription', () => {
        it('should add endTimeSeconds based on total duration', () => {
            const text = `00:00 Part 1
05:00 Part 2`;
            const totalDuration = 600; // 10 minutes

            const chapters = extractor.parseChaptersFromDescription(text, totalDuration);

            expect(chapters[0].endTimeSeconds).toBe(300); // ends when Part 2 starts
            expect(chapters[1].endTimeSeconds).toBe(600); // ends at video end
        });
    });
});

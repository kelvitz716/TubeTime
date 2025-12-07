/**
 * Unit tests for formatDuration utility
 * Run with: npx vitest run
 */

import { describe, it, expect } from 'vitest';

// Inline the formatDuration function for testing
// In a real app, this would be imported from a shared utils file
const formatDuration = (seconds) => {
    if (!seconds || seconds < 0) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
};

describe('formatDuration', () => {
    it('should format seconds less than a minute', () => {
        expect(formatDuration(30)).toBe('0:30');
        expect(formatDuration(5)).toBe('0:05');
        expect(formatDuration(59)).toBe('0:59');
    });

    it('should format minutes and seconds', () => {
        expect(formatDuration(60)).toBe('1:00');
        expect(formatDuration(90)).toBe('1:30');
        expect(formatDuration(125)).toBe('2:05');
        expect(formatDuration(599)).toBe('9:59');
    });

    it('should format hours, minutes and seconds', () => {
        expect(formatDuration(3600)).toBe('1:00:00');
        expect(formatDuration(3661)).toBe('1:01:01');
        expect(formatDuration(7325)).toBe('2:02:05');
        expect(formatDuration(36000)).toBe('10:00:00');
    });

    it('should handle edge cases', () => {
        expect(formatDuration(0)).toBe('0:00');
        expect(formatDuration(-5)).toBe('0:00');
        expect(formatDuration(null)).toBe('0:00');
        expect(formatDuration(undefined)).toBe('0:00');
    });

    it('should pad correctly', () => {
        expect(formatDuration(61)).toBe('1:01');
        expect(formatDuration(3605)).toBe('1:00:05');
        expect(formatDuration(3665)).toBe('1:01:05');
    });
});

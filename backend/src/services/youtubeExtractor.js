import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export class YouTubeExtractor {
    async extractInfo(url) {
        try {
            // Tier 1: yt-dlp
            return await this.extractWithYtDlp(url);
        } catch (error) {
            console.warn('Tier 1 failed, trying Tier 2...', error);
            try {
                // Tier 2: oEmbed (Mocked for now as per instructions implies logic but we can use simple fetch if needed, 
                // but for this implementation we will focus on the structure. 
                // Real oEmbed requires fetching https://www.youtube.com/oembed?url=... and parsing description)
                return await this.extractWithOEmbed(url);
            } catch (error2) {
                console.warn('Tier 2 failed, trying Tier 3...', error2);
                // Tier 3: Regex on description (Usually requires the description from Tier 2 or page scrape)
                // Fallback
                return this.getFallback(url);
            }
        }
    }

    async extractWithYtDlp(url) {
        const command = `yt-dlp --dump-single-json "${url}"`;
        const { stdout } = await execPromise(command);
        const data = JSON.parse(stdout);

        const chapters = data.chapters?.map((ch, index) => ({
            chapterNumber: index + 1,
            title: ch.title,
            startTimeSeconds: Math.floor(ch.start_time),
            endTimeSeconds: Math.floor(ch.end_time),
        })) || [];

        // If no chapters found by yt-dlp, try to parse description from yt-dlp output
        // Manual parsing disabled to avoid false positives (user feedback)
        /*
        if (chapters.length === 0 && data.description) {
            const regexChapters = this.parseChaptersFromDescription(data.description, data.duration);
            if (regexChapters.length > 0) {
                return {
                    id: data.id,
                    title: data.title,
                    description: data.description,
                    thumbnailUrl: data.thumbnail,
                    durationSeconds: data.duration,
                    chapters: regexChapters
                };
            }
        }
        */

        // Fallback logic removed to allow detection of "no chapters"
        // if (chapters.length === 0) {
        //     chapters.push({
        //         chapterNumber: 1,
        //         title: data.title,
        //         startTimeSeconds: 0,
        //         endTimeSeconds: data.duration
        //     });
        // }

        return {
            id: data.id,
            title: data.title,
            description: data.description,
            thumbnailUrl: data.thumbnail,
            durationSeconds: data.duration,
            chapters,
        };
    }

    async extractWithOEmbed(url) {
        // Placeholder for oEmbed logic
        throw new Error("oEmbed not implemented yet");
    }

    parseChapters(text) {
        const lines = text.split('\n');
        const chapters = [];
        // Regex to match timestamps like 00:00:00 or (00:00:00) or 0:00 - more permissive 
        const timeRegex = /\(?(\d{1,2}):(\d{2})(?::(\d{2}))?\)?/;

        let chapterCount = 1;
        for (const line of lines) {
            const match = line.match(timeRegex);
            if (match) {
                const hours = match[3] ? parseInt(match[1]) : 0;
                const minutes = match[3] ? parseInt(match[2]) : parseInt(match[1]);
                const seconds = match[3] ? parseInt(match[3]) : parseInt(match[2]);

                const startTime = hours * 3600 + minutes * 60 + seconds;

                // Clean title: remove the full match and leading/trailing non-alphanumeric chars
                let title = line.replace(match[0], '').trim();
                title = title.replace(/^[-\s\)\(]+/, '').trim(); // Remove leading dash, parens
                // Remove common emoji patterns
                title = title.replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}☁️🎤⭐️]+/gu, '').trim();

                chapters.push({
                    chapterNumber: chapterCount++,
                    title: title || `Chapter ${chapterCount}`,
                    startTimeSeconds: startTime,
                });
            }
        }
        return chapters;
    }

    parseChaptersFromDescription(description, totalDuration) {
        const chapters = this.parseChapters(description);

        // Calculate end times
        for (let i = 0; i < chapters.length; i++) {
            if (i < chapters.length - 1) {
                chapters[i].endTimeSeconds = chapters[i + 1].startTimeSeconds;
            } else {
                chapters[i].endTimeSeconds = totalDuration;
            }
        }

        return chapters;
    }

    getFallback(url) {
        // Minimal fallback
        return {
            id: 'unknown',
            title: 'Unknown Video',
            description: '',
            thumbnailUrl: '',
            durationSeconds: 0,
            chapters: []
        };
    }
}

export const youtubeExtractor = new YouTubeExtractor();

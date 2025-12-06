
const format1 = `⭐️ Contents ⭐️
00:00:00 Introduction
00:15:27 Identity access and resource setup
02:45:28 Billing configuration`;

const format2 = `☁️ Introduction
🎤 (00:00:00) Meet Your Instructor
🎤 (00:16:56) Google Cloud Certifications and Exams
☁️ Cloud Computing Fundamentals
🎤 (00:46:35) What Is Cloud Computing`;

function parseChapters(text) {
    const lines = text.split('\n');
    const chapters = [];
    // Regex to match timestamps like 00:00:00 or (00:00:00) or 0:00
    // It captures: 1. Hours (optional), 2. Minutes, 3. Seconds (optional but usually present if hours are)
    // Adjusted to be more flexible with surrounding characters
    const timeRegex = /(?:^|\s|\()(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\)|$|\s)/;

    let chapterCount = 1;
    for (const line of lines) {
        const match = line.match(timeRegex);
        if (match) {
            const hours = match[3] ? parseInt(match[1]) : 0;
            const minutes = match[3] ? parseInt(match[2]) : parseInt(match[1]);
            const seconds = match[3] ? parseInt(match[3]) : parseInt(match[2]);

            const startTime = hours * 3600 + minutes * 60 + seconds;

            // Clean title: remove timestamp and leading/trailing non-alphanumeric chars
            let title = line.replace(match[0], '').trim();
            title = title.replace(/^[-\s\)\(]+/, '').trim(); // Remove leading dash, parens
            title = title.replace(/^[\u{1F300}-\u{1F9FF}]/u, '').trim(); // Remove leading emojis (simple range)

            // If title is empty/garbage, maybe use a default? 
            // For now, let's see what we get.

            chapters.push({
                chapterNumber: chapterCount++,
                title: title || `Chapter ${chapterCount}`,
                startTimeSeconds: startTime,
            });
        }
    }
    return chapters;
}

console.log("--- Format 1 ---");
console.log(JSON.stringify(parseChapters(format1), null, 2));

console.log("\n--- Format 2 ---");
console.log(JSON.stringify(parseChapters(format2), null, 2));

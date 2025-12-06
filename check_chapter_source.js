import { youtubeExtractor } from './backend/src/services/youtubeExtractor.js';

async function run() {
    const urls = [
        'https://www.youtube.com/watch?v=Mg2n7xw0WUc',
        'https://www.youtube.com/watch?v=D4hXU51eY6E',
        'https://www.youtube.com/watch?v=nCvWqf_mv4g'
    ];

    for (const url of urls) {
        console.log(`\nAnalyzing: ${url}`);
        try {
            // We need to bypass the extractInfo wrapper to see internal logic, 
            // or we can just modify the extractor to log. 
            // But since I can't easily see logs from the running server, I'll use this script 
            // which imports the extractor directly.

            // Note: This requires the backend environment (node_modules) to be set up.
            // I'll assume I can run this with `npx tsx`.

            const info = await youtubeExtractor.extractWithYtDlp(url);
            console.log(`Title: ${info.title}`);
            console.log(`Chapter Count: ${info.chapters.length}`);
            if (info.chapters.length > 0) {
                console.log("First Chapter:", info.chapters[0]);
            }
        } catch (error) {
            console.error("Error:", error.message);
        }
    }
}

run();

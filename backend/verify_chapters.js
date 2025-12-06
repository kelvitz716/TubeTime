
import { youtubeExtractor } from './src/services/youtubeExtractor.js';

const urls = [
    'https://www.youtube.com/watch?v=X6pTPztUJBA',
    'https://youtu.be/Mb6H7trzMfI?si=34fXni1pNXsCeTTP',
    'https://www.youtube.com/watch?v=nE9P85IywgQ'
];

async function verify() {
    for (const url of urls) {
        console.log(`\nTesting URL: ${url}`);
        try {
            const info = await youtubeExtractor.extractInfo(url);
            console.log(`Title: ${info.title}`);
            console.log(`Chapter Count: ${info.chapters ? info.chapters.length : 0}`);
            if (info.chapters && info.chapters.length > 0) {
                console.log('Chapters found:');
                info.chapters.forEach(ch => console.log(`- ${ch.title} (${ch.startTimeSeconds}s)`));
            } else {
                console.log('No chapters found.');
            }
        } catch (error) {
            console.error(`Error extracting info: ${error.message}`);
        }
    }
}

verify();

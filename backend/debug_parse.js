
import { youtubeExtractor } from './src/services/youtubeExtractor.js';

const manualText = `00:00 Intro
01:30 Topic 1
03:45 Conclusion`;

const chapters = youtubeExtractor.parseChaptersFromDescription(manualText, 300);
console.log("Parsed chapters:");
console.log(JSON.stringify(chapters, null, 2));

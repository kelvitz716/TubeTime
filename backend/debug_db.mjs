import Database from 'better-sqlite3';
const db = new Database('tubetime.db');

console.log('--- Watch Progress ---');
const progress = db.prepare('SELECT * FROM watch_progress').all();
console.log(JSON.stringify(progress, null, 2));

console.log('--- Chapters (Video 1) ---');
// Get first video ID
const video = db.prepare('SELECT id FROM videos LIMIT 1').get();
if (video) {
    const chapters = db.prepare('SELECT id, video_id, chapter_number, sort_order, title FROM chapters WHERE video_id = ?').all(video.id);
    console.log(JSON.stringify(chapters, null, 2));
} else {
    console.log('No videos found');
}

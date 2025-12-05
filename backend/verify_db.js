import Database from 'better-sqlite3';
const db = new Database('tubetime.db');
const userCount = db.prepare('SELECT count(*) as count FROM users').get();
const videoCount = db.prepare('SELECT count(*) as count FROM videos').get();
console.log(`Users: ${userCount.count}`);
console.log(`Videos: ${videoCount.count}`);
db.close();

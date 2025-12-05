import Database from 'better-sqlite3';
const db = new Database('tubetime.db');
const user = db.prepare('SELECT * FROM users WHERE username = ?').get('testuser');
console.log('User:', user);
db.close();

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const db = new Database('tubetime.db');
const migrationPath = path.join(process.cwd(), 'drizzle', '0000_good_carmella_unuscione.sql');
const migrationSql = fs.readFileSync(migrationPath, 'utf-8');

console.log('Applying migration...');
db.exec(migrationSql);
console.log('Migration applied successfully.');
db.close();

// Mock data script to populate database for testing
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './src/db/schema.ts';
import bcrypt from 'bcryptjs';

import dotenv from 'dotenv';

dotenv.config();

const dbPath = process.env.DATABASE_URL || 'tubetime.db';
const sqlite = new Database(dbPath);
const db = drizzle(sqlite, { schema });

async function seedDatabase() {
    console.log('🌱 Seeding database with test data...');

    // Create test user
    const passwordHash = await bcrypt.hash('test123', 10);
    const user = await db.insert(schema.users).values({
        username: 'testuser',
        passwordHash
    }).returning();
    console.log('✓ Created test user:', user[0].username);

    // Create test video with chapters
    const videoId = 'dQw4w9WgXcQ'; // Sample YouTube ID
    await db.insert(schema.videos).values({
        id: videoId,
        userId: user[0].id,
        title: 'Sample Documentary: The Story of Time',
        thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
        description: 'A comprehensive documentary about time and space.',
        durationSeconds: 3600,
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    });
    console.log('✓ Created test video');

    // Create test chapters
    const chapters = [
        { chapterNumber: 1, title: 'Introduction', startTimeSeconds: 0, endTimeSeconds: 300 },
        { chapterNumber: 2, title: 'The Beginning of Time', startTimeSeconds: 300, endTimeSeconds: 900 },
        { chapterNumber: 3, title: 'Understanding Spacetime', startTimeSeconds: 900, endTimeSeconds: 1800 },
        { chapterNumber: 4, title: 'Modern Physics', startTimeSeconds: 1800, endTimeSeconds: 2700 },
        { chapterNumber: 5, title: 'Future Implications', startTimeSeconds: 2700, endTimeSeconds: 3600 }
    ];

    for (const ch of chapters) {
        await db.insert(schema.chapters).values({
            videoId,
            userId: user[0].id,
            ...ch,
            sortOrder: ch.chapterNumber
        });
    }
    console.log('✓ Created 5 test chapters');

    console.log('\n✅ Database seeded successfully!');
    console.log('Test credentials:');
    console.log('  Username: testuser');
    console.log('  Password: test123');

    sqlite.close();
}

seedDatabase().catch(console.error);

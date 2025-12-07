import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    username: text('username').unique().notNull(),
    passwordHash: text('password_hash').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const videos = sqliteTable('videos', {
    id: text('id').primaryKey(), // YouTube Video ID
    userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    thumbnailUrl: text('thumbnail_url'),
    description: text('description'),
    durationSeconds: integer('duration_seconds'),
    youtubeUrl: text('youtube_url').notNull(),
    addedAt: integer('added_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
    lastWatchedAt: integer('last_watched_at', { mode: 'timestamp' }),
}, (table) => ({
    userIdx: index('idx_videos_user').on(table.userId),
}));

export const chapters = sqliteTable('chapters', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    videoId: text('video_id').notNull().references(() => videos.id, { onDelete: 'cascade' }),
    userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    chapterNumber: integer('chapter_number').notNull(),
    title: text('title').notNull(),
    startTimeSeconds: integer('start_time_seconds').notNull(),
    endTimeSeconds: integer('end_time_seconds'),
    thumbnailUrl: text('thumbnail_url'),
    seasonNumber: integer('season_number').default(1),
    sortOrder: integer('sort_order'), // For drag-drop reordering
}, (table) => ({
    videoIdx: index('idx_chapters_video').on(table.videoId),
    sortIdx: index('idx_chapters_sort').on(table.videoId, table.sortOrder),
}));

export const watchProgress = sqliteTable('watch_progress', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    videoId: text('video_id').notNull().references(() => videos.id, { onDelete: 'cascade' }),
    chapterId: integer('chapter_id').notNull().references(() => chapters.id, { onDelete: 'cascade' }),
    userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    watched: integer('watched', { mode: 'boolean' }).default(false),
    watchedAt: integer('watched_at', { mode: 'timestamp' }),
}, (table) => ({
    videoIdx: index('idx_progress_video').on(table.videoId),
}));

export const resourceAccounts = sqliteTable('resource_accounts', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    email: text('email'),
    isActive: integer('is_active', { mode: 'boolean' }).default(false),
    startedUsingAt: integer('started_using_at', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const resourceQuotas = sqliteTable('resource_quotas', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    accountId: integer('account_id').notNull().references(() => resourceAccounts.id, { onDelete: 'cascade' }),
    resourceType: text('resource_type').notNull(), // 'GEMINI', 'CLAUDE'
    status: text('status').notNull().default('AVAILABLE'), // 'AVAILABLE', 'EXHAUSTED'
    exhaustedAt: integer('exhausted_at', { mode: 'timestamp' }),
    refreshAt: integer('refresh_at', { mode: 'timestamp' }),
}, (table) => ({
    accountIdx: index('idx_quotas_account').on(table.accountId),
}));


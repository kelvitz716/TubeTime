CREATE TABLE `chapters` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`video_id` text NOT NULL,
	`user_id` integer NOT NULL,
	`chapter_number` integer NOT NULL,
	`title` text NOT NULL,
	`start_time_seconds` integer NOT NULL,
	`end_time_seconds` integer,
	`thumbnail_url` text,
	`season_number` integer DEFAULT 1,
	`sort_order` integer,
	FOREIGN KEY (`video_id`) REFERENCES `videos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `videos` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`title` text NOT NULL,
	`thumbnail_url` text,
	`description` text,
	`duration_seconds` integer,
	`youtube_url` text NOT NULL,
	`added_at` integer,
	`last_watched_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `watch_progress` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`video_id` text NOT NULL,
	`chapter_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`watched` integer DEFAULT false,
	`watched_at` integer,
	FOREIGN KEY (`video_id`) REFERENCES `videos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`chapter_id`) REFERENCES `chapters`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_chapters_video` ON `chapters` (`video_id`);--> statement-breakpoint
CREATE INDEX `idx_chapters_sort` ON `chapters` (`video_id`,`sort_order`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE INDEX `idx_videos_user` ON `videos` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_progress_video` ON `watch_progress` (`video_id`);
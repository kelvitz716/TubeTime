CREATE TABLE `resource_accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`status` text DEFAULT 'AVAILABLE' NOT NULL,
	`is_active` integer DEFAULT false,
	`started_using_at` integer,
	`exhausted_at` integer,
	`refresh_at` integer,
	`created_at` integer
);

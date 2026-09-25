CREATE TABLE `media_items` (
	`key` text PRIMARY KEY NOT NULL,
	`profile_id` integer NOT NULL,
	`kind` text NOT NULL,
	`filename` text NOT NULL,
	`content_type` text NOT NULL,
	`size` integer NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `media_items_profile_kind_sort_idx` ON `media_items` (`profile_id`,`kind`,`sort_order`);
--> statement-breakpoint
ALTER TABLE `content_items` ADD `media_key` text;
--> statement-breakpoint
CREATE INDEX `content_items_media_key_idx` ON `content_items` (`media_key`);

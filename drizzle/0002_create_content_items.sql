CREATE TABLE `content_items` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `type` text NOT NULL,
  `title` text NOT NULL,
  `description` text,
  `image_key` text NOT NULL,
  `image_url` text NOT NULL,
  `created_at` integer NOT NULL
);
CREATE INDEX `idx_content_items_type_created` ON `content_items` (`type`,`created_at`);

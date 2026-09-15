CREATE TABLE `project_profiles` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `created_at` integer NOT NULL
);
INSERT INTO `project_profiles` (`id`, `name`, `created_at`) VALUES (1, 'Perfil principal', 1789437600);
CREATE TABLE `project_profile_settings` (
  `profile_id` integer NOT NULL,
  `key` text NOT NULL,
  `value` text NOT NULL,
  `updated_at` integer NOT NULL,
  PRIMARY KEY (`profile_id`, `key`)
);
ALTER TABLE `content_items` ADD COLUMN `profile_id` integer NOT NULL DEFAULT 1;
ALTER TABLE `appointments` ADD COLUMN `profile_id` integer NOT NULL DEFAULT 1;
DROP INDEX `idx_appointments_date_time`;
CREATE UNIQUE INDEX `idx_appointments_profile_date_time` ON `appointments` (`profile_id`,`appointment_date`,`appointment_time`);
CREATE INDEX `idx_content_items_profile_type_created` ON `content_items` (`profile_id`,`type`,`created_at`);
PRAGMA optimize;

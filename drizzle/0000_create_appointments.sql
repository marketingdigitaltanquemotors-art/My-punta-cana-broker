CREATE TABLE `appointments` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `lot_id` text NOT NULL,
  `appointment_date` text NOT NULL,
  `appointment_time` text NOT NULL,
  `client_name` text NOT NULL,
  `phone` text NOT NULL,
  `email` text,
  `reservation_code` text NOT NULL UNIQUE,
  `created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_appointments_date_time` ON `appointments` (`appointment_date`,`appointment_time`);
--> statement-breakpoint
PRAGMA optimize;

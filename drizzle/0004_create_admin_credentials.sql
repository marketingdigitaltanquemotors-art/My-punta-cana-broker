CREATE TABLE `admin_credentials` (
  `id` integer PRIMARY KEY NOT NULL CHECK (`id` = 1),
  `username` text NOT NULL,
  `password_hash` text NOT NULL,
  `password_salt` text NOT NULL,
  `updated_at` integer NOT NULL
);

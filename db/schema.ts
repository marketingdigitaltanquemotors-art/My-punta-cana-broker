export const appointmentsSchema = {
  table: 'appointments',
  columns: ['id', 'profile_id', 'lot_id', 'appointment_date', 'appointment_time', 'client_name', 'phone', 'email', 'reservation_code', 'created_at'],
  uniqueSlot: ['profile_id', 'appointment_date', 'appointment_time'],
} as const;

export const siteSettingsSchema = {
  table: 'site_settings',
  columns: ['key', 'value', 'updated_at'],
} as const;

export const contentItemsSchema = {
  table: 'content_items',
  columns: ['id', 'profile_id', 'type', 'title', 'description', 'image_key', 'image_url', 'created_at'],
} as const;

export const projectProfilesSchema = {
  table: 'project_profiles',
  columns: ['id', 'name', 'created_at'],
} as const;

export const projectProfileSettingsSchema = {
  table: 'project_profile_settings',
  columns: ['profile_id', 'key', 'value', 'updated_at'],
} as const;

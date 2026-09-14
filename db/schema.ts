export const appointmentsSchema = {
  table: 'appointments',
  columns: ['id', 'lot_id', 'appointment_date', 'appointment_time', 'client_name', 'phone', 'email', 'reservation_code', 'created_at'],
  uniqueSlot: ['appointment_date', 'appointment_time'],
} as const;

export const siteSettingsSchema = {
  table: 'site_settings',
  columns: ['key', 'value', 'updated_at'],
} as const;

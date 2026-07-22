ALTER TABLE settings ADD COLUMN IF NOT EXISTS wifi_name text;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS wifi_password text;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS maps_url text;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS location_notes jsonb DEFAULT '{}';

ALTER TABLE products ADD COLUMN IF NOT EXISTS portion_min integer;
ALTER TABLE products ADD COLUMN IF NOT EXISTS portion_max integer;
ALTER TABLE products ADD COLUMN IF NOT EXISTS portion_unit varchar(8);

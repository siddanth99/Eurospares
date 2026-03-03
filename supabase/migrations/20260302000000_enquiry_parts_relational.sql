-- Add requested_date to enquiries (legacy columns kept for migration)
ALTER TABLE enquiries
ADD COLUMN IF NOT EXISTS requested_date date;

-- Create enquiry_parts table
CREATE TABLE IF NOT EXISTS enquiry_parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id uuid NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
  part_name text,
  price numeric,
  cost_price numeric,
  supplier_available_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_enquiry_parts_enquiry_id ON enquiry_parts(enquiry_id);

-- Migrate existing data: one part row per enquiry that has part_name
INSERT INTO enquiry_parts (enquiry_id, part_name, price, cost_price, created_at)
SELECT id, part_name, price, cost_price, created_at
FROM enquiries
WHERE part_name IS NOT NULL;

-- Do NOT drop legacy columns (part_name, price, cost_price) on enquiries yet.

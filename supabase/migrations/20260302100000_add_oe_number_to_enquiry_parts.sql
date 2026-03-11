-- Add OE number to enquiry_parts (nullable, no existing columns modified)
ALTER TABLE enquiry_parts
ADD COLUMN IF NOT EXISTS oe_number text;

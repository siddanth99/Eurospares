export type EnquiryPart = {
  id: string;
  enquiry_id: string;
  part_name: string | null;
  price: number | null;
  cost_price: number | null;
  supplier_available_date: string | null;
  oe_number: string | null;
  created_at: string;
};

export type Enquiry = {
  id: string;
  car_model: string | null;
  customer: string | null;
  customer_name?: string | null;
  customer_phone: string | null;
  notes: string | null;
  status: string | null;
  requested_date: string | null;
  created_at: string;
};

export type EnquiryWithParts = Enquiry & {
  parts: EnquiryPart[];
};

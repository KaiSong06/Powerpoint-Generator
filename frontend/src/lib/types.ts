export type ProductCategory =
  | "workstation"
  | "task_seating"
  | "meeting"
  | "lounge"
  | "reception"
  | "storage"
  | "table"
  | "accessory"
  | "phone_booth"
  | "gaming"
  | "planter";

export interface Consultant {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
}

export interface Product {
  product_code: string;
  name: string;
  specifications: string | null;
  image_url: string | null;
  price: number | null;
  markup_percent: number | null;
  category: ProductCategory | null;
  created_at: string;
}

export interface Presentation {
  id: number;
  file_url: string | null;
  file_name: string | null;
  category: string | null;
  product_count: number | null;
  sq_ft: number | null;
  client_name: string | null;
  office_address: string | null;
  suite_number: string | null;
  floor_plan_url: string | null;
  consultant_id: number | null;
  generated_at: string;
}

export interface PresentationProduct {
  id: number;
  presentation_id: number;
  product_code: string;
  quantity: number;
}

export interface CreatePresentationRequest {
  category: string;
  client_name: string;
  office_address: string;
  suite_number?: string;
  sq_ft?: number;
  consultant_id: number;
  floor_plan_url?: string;
  products: { product_code: string; quantity: number }[];
}

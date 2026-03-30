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

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  workstation: "Workstations",
  task_seating: "Task Seating",
  meeting: "Meeting",
  lounge: "Lounge",
  reception: "Reception",
  storage: "Storage",
  table: "Tables",
  accessory: "Accessories",
  phone_booth: "Phone Booths",
  gaming: "Gaming",
  planter: "Planters",
};

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
  price: number;
  markup_percent: number | null;
  category: ProductCategory | null;
}

export interface Presentation {
  id: number;
  file_url: string | null;
  file_name: string | null;
  category?: string | null;
  client_name: string;
  office_address: string;
  product_count: number | null;
  sq_ft: number;
  generated_at: string | null;
  suite_number?: string | null;
  floor_plan_url?: string | null;
  consultant?: Consultant | null;
  products?: Product[];
}

export interface PresentationProduct {
  id: number;
  presentation_id: number;
  product_code: string;
  quantity: number;
}

export interface CreatePresentationRequest {
  client_name: string;
  office_address: string;
  suite_number?: string;
  sq_ft: number;
  consultant_id?: number;
  products: { product_code: string; quantity: number }[];
}

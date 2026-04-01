export type ProductCategory =
  | "cafe_furniture"
  | "conference_seating"
  | "guest_seating"
  | "lounge"
  | "meeting_table"
  | "office_suite"
  | "task_seating"
  | "workstation";

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  cafe_furniture: "Café Furniture",
  conference_seating: "Conference Seating",
  guest_seating: "Guest Seating",
  lounge: "Lounge",
  meeting_table: "Meeting Tables",
  office_suite: "Office Suite",
  task_seating: "Task Seating",
  workstation: "Workstations",
};

export interface Consultant {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
}

export type SpaceType =
  | "open_workstation"
  | "private_office"
  | "executive_office"
  | "conference_room"
  | "huddle_room"
  | "lounge"
  | "break_area"
  | "reception";

export type ProductRole = "primary" | "secondary" | "accessory";

export type QuantityRule = "per_workstation" | "per_room" | "per_capacity" | "per_floor";

export interface Product {
  product_code: string;
  name: string;
  specifications: string | null;
  image_url: string | null;
  price: number;
  markup_percent: number | null;
  category: ProductCategory | null;
  space_type: SpaceType[] | null;
  product_role: ProductRole | null;
  capacity: number | null;
  quantity_rule: QuantityRule | null;
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

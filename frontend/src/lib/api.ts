import { createSupabaseBrowserClient } from "./supabase";
import type {
  Product,
  Consultant,
  Presentation,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {};
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }
  return headers;
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const authHeaders = await getAuthHeaders();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...authHeaders,
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API error ${response.status}: ${errorBody}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

// ── Products ─────────────────────────────────────────────────────────────────

export async function getProducts(category?: string): Promise<Product[]> {
  const params = category ? `?category=${encodeURIComponent(category)}` : "";
  return apiFetch<Product[]>(`/api/products${params}`);
}

export async function getCategories(): Promise<string[]> {
  return apiFetch<string[]>("/api/products/categories");
}

// ── Consultants ──────────────────────────────────────────────────────────────

export async function getConsultants(): Promise<Consultant[]> {
  return apiFetch<Consultant[]>("/api/consultants");
}

// ── Presentations ────────────────────────────────────────────────────────────

export async function getPresentations(): Promise<Presentation[]> {
  return apiFetch<Presentation[]>("/api/presentations");
}

export async function getPresentation(id: number): Promise<Presentation> {
  return apiFetch<Presentation>(`/api/presentations/${id}`);
}

export async function deletePresentation(id: number): Promise<void> {
  await apiFetch<void>(`/api/presentations/${id}`, { method: "DELETE" });
}

/**
 * Generate a presentation. Uses multipart/form-data for the floor plan upload.
 */
export async function generatePresentation(data: {
  client_name: string;
  office_address: string;
  suite_number?: string;
  sq_ft: number;
  consultant_id: number;
  products: { product_code: string; quantity: number }[];
  floor_plan?: File | null;
}): Promise<Presentation> {
  const authHeaders = await getAuthHeaders();

  const formData = new FormData();
  formData.append("client_name", data.client_name);
  formData.append("office_address", data.office_address);
  if (data.suite_number) formData.append("suite_number", data.suite_number);
  formData.append("sq_ft", String(data.sq_ft));
  formData.append("consultant_id", String(data.consultant_id));
  formData.append("products", JSON.stringify(data.products));
  if (data.floor_plan) formData.append("floor_plan", data.floor_plan);

  const response = await fetch(`${API_URL}/api/presentations/generate`, {
    method: "POST",
    headers: authHeaders,
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API error ${response.status}: ${errorBody}`);
  }

  return response.json() as Promise<Presentation>;
}

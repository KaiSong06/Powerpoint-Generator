import { createSupabaseBrowserClient } from "./supabase";
import type {
  Product,
  Consultant,
  Presentation,
  CreatePresentationRequest,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API error ${response.status}: ${errorBody}`);
  }

  return response.json() as Promise<T>;
}

export async function getProducts(): Promise<Product[]> {
  return apiFetch<Product[]>("/products");
}

export async function getConsultants(): Promise<Consultant[]> {
  return apiFetch<Consultant[]>("/consultants");
}

export async function createPresentation(
  data: CreatePresentationRequest
): Promise<Presentation> {
  return apiFetch<Presentation>("/presentations", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getPresentations(): Promise<Presentation[]> {
  return apiFetch<Presentation[]>("/presentations");
}

export async function getPresentation(id: number): Promise<Presentation> {
  return apiFetch<Presentation>(`/presentations/${id}`);
}

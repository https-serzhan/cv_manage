import { apiRequest } from "../../../shared/api/client";
import type {
  Attribute,
  AttributeCategory,
  AttributesListResponse,
  CreateAttributePayload,
  GetAttributesParams,
  UpdateAttributePayload
} from "../model/types";

function buildQueryString(params: GetAttributesParams): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  }

  const queryString = searchParams.toString();

  return queryString ? `?${queryString}` : "";
}

export function getAttributeCategories() {
  return apiRequest<AttributeCategory[]>("/api/attributes/categories");
}

export function getAttributes(params: GetAttributesParams = {}) {
  return apiRequest<AttributesListResponse>(`/api/attributes${buildQueryString(params)}`);
}

export function getAttributeById(id: string) {
  return apiRequest<Attribute>(`/api/attributes/${id}`);
}

export function createAttribute(payload: CreateAttributePayload) {
  return apiRequest<Attribute>("/api/attributes", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateAttribute(id: string, payload: UpdateAttributePayload) {
  return apiRequest<Attribute>(`/api/attributes/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function deleteAttribute(id: string, version: number) {
  const queryString = new URLSearchParams({ version: String(version) }).toString();

  return apiRequest<void>(`/api/attributes/${id}?${queryString}`, {
    method: "DELETE"
  });
}

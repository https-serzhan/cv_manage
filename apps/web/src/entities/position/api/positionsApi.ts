import { apiRequest } from "../../../shared/api/client";

import type {
  PositionDto,
  PositionsListResponse,
  PositionAccessDto,
  GetPositionsParams,
  CreatePositionPayload,
  DuplicatePositionPayload,
  UpdatePositionPayload,
  UpdatePositionAccessPayload
} from "../model/types";

function buildQueryString(params: GetPositionsParams = {}) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

export function getPositions(params: GetPositionsParams = {}) {
  return apiRequest<PositionsListResponse>(`/api/positions${buildQueryString(params)}`);
}

export function getPositionById(id: string) {
  return apiRequest<PositionDto>(`/api/positions/${id}`);
}

export function createPosition(payload: CreatePositionPayload) {
  return apiRequest<PositionDto>("/api/positions", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updatePosition(id: string, payload: UpdatePositionPayload) {
  return apiRequest<PositionDto>(`/api/positions/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function deletePosition(id: string, version: number) {
  return apiRequest<void>(`/api/positions/${id}?version=${version}`, {
    method: "DELETE"
  });
}

export function duplicatePosition(id: string, payload?: DuplicatePositionPayload) {
  return apiRequest<PositionDto>(`/api/positions/${id}/duplicate`, {
    method: "POST",
    body: payload ? JSON.stringify(payload) : undefined
  });
}

export function getPositionAccess(id: string) {
  return apiRequest<PositionAccessDto>(`/api/positions/${id}/access`);
}

export function updatePositionAccess(id: string, payload: UpdatePositionAccessPayload) {
  return apiRequest<PositionAccessDto>(`/api/positions/${id}/access`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

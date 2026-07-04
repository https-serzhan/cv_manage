import { apiRequest } from "../../../shared/api/client";
import type {
  CandidateProject,
  CreateProjectPayload,
  GetProjectTagsParams,
  Profile,
  ProfileAttributeValue,
  ProjectTagsListResponse,
  UpdateProfileAttributeValuePayload,
  UpdateProfilePayload,
  UpdateProjectPayload
} from "../model/types";

function buildQueryString(params: GetProjectTagsParams): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  }

  const queryString = searchParams.toString();

  return queryString ? `?${queryString}` : "";
}

export function getMyProfile() {
  return apiRequest<Profile>("/api/profile/me");
}

export function updateMyProfile(payload: UpdateProfilePayload) {
  return apiRequest<Profile>("/api/profile/me", {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function getMyProfileAttributes() {
  return apiRequest<ProfileAttributeValue[]>("/api/profile/me/attributes");
}

export function updateMyProfileAttributeValue(
  attributeId: string,
  payload: UpdateProfileAttributeValuePayload
) {
  return apiRequest<ProfileAttributeValue>(`/api/profile/me/attributes/${attributeId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function getMyProjects() {
  return apiRequest<CandidateProject[]>("/api/profile/me/projects");
}

export function createMyProject(payload: CreateProjectPayload) {
  return apiRequest<CandidateProject>("/api/profile/me/projects", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateMyProject(projectId: string, payload: UpdateProjectPayload) {
  return apiRequest<CandidateProject>(`/api/profile/me/projects/${projectId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function deleteMyProject(projectId: string, version: number) {
  const queryString = new URLSearchParams({ version: String(version) }).toString();

  return apiRequest<void>(`/api/profile/me/projects/${projectId}?${queryString}`, {
    method: "DELETE"
  });
}

export function getProjectTags(params: GetProjectTagsParams = {}) {
  return apiRequest<ProjectTagsListResponse>(
    `/api/profile/project-tags${buildQueryString(params)}`
  );
}

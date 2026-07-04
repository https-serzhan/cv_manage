import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createMyProject,
  deleteMyProject,
  getMyProfile,
  getMyProfileAttributes,
  getMyProjects,
  getProjectTags,
  updateMyProfile,
  updateMyProfileAttributeValue,
  updateMyProject
} from "../api/profileApi";
import type {
  CreateProjectPayload,
  GetProjectTagsParams,
  UpdateProfileAttributeValuePayload,
  UpdateProfilePayload,
  UpdateProjectPayload
} from "./types";

export const profileQueryKeys = {
  all: ["profile"] as const,
  me: () => [...profileQueryKeys.all, "me"] as const,
  attributes: () => [...profileQueryKeys.all, "attributes"] as const,
  projects: () => [...profileQueryKeys.all, "projects"] as const,
  projectTagsAll: () => [...profileQueryKeys.all, "project-tags"] as const,
  projectTags: (params: GetProjectTagsParams) =>
    [...profileQueryKeys.projectTagsAll(), params] as const
};

export function useMyProfileQuery() {
  return useQuery({
    queryKey: profileQueryKeys.me(),
    queryFn: getMyProfile
  });
}

export function useUpdateMyProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateMyProfile(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: profileQueryKeys.me() });
    }
  });
}

export function useMyProfileAttributesQuery() {
  return useQuery({
    queryKey: profileQueryKeys.attributes(),
    queryFn: getMyProfileAttributes
  });
}

export function useUpdateMyProfileAttributeValueMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      attributeId,
      payload
    }: {
      attributeId: string;
      payload: UpdateProfileAttributeValuePayload;
    }) => updateMyProfileAttributeValue(attributeId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: profileQueryKeys.attributes() });
    }
  });
}

export function useMyProjectsQuery() {
  return useQuery({
    queryKey: profileQueryKeys.projects(),
    queryFn: getMyProjects
  });
}

export function useCreateMyProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProjectPayload) => createMyProject(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: profileQueryKeys.projects() }),
        queryClient.invalidateQueries({ queryKey: profileQueryKeys.projectTagsAll() })
      ]);
    }
  });
}

export function useUpdateMyProjectMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProjectPayload) => updateMyProject(projectId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: profileQueryKeys.projects() }),
        queryClient.invalidateQueries({ queryKey: profileQueryKeys.projectTagsAll() })
      ]);
    }
  });
}

export function useDeleteMyProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, version }: { projectId: string; version: number }) =>
      deleteMyProject(projectId, version),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: profileQueryKeys.projects() });
    }
  });
}

export function useProjectTagsQuery(params: GetProjectTagsParams) {
  return useQuery({
    queryKey: profileQueryKeys.projectTags(params),
    queryFn: () => getProjectTags(params),
    staleTime: 60_000
  });
}

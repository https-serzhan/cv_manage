import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createAttribute,
  deleteAttribute,
  getAttributeById,
  getAttributeCategories,
  getAttributes,
  updateAttribute
} from "../api/attributesApi";
import type { CreateAttributePayload, GetAttributesParams, UpdateAttributePayload } from "./types";

export const attributeQueryKeys = {
  all: ["attributes"] as const,
  lists: () => [...attributeQueryKeys.all, "list"] as const,
  list: (params: GetAttributesParams) => [...attributeQueryKeys.lists(), params] as const,
  details: () => [...attributeQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...attributeQueryKeys.details(), id] as const,
  categories: () => [...attributeQueryKeys.all, "categories"] as const
};

export function useAttributeCategoriesQuery() {
  return useQuery({
    queryKey: attributeQueryKeys.categories(),
    queryFn: getAttributeCategories,
    staleTime: 5 * 60_000
  });
}

export function useAttributesQuery(params: GetAttributesParams) {
  return useQuery({
    queryKey: attributeQueryKeys.list(params),
    queryFn: () => getAttributes(params),
    placeholderData: (previousData) => previousData
  });
}

export function useAttributeQuery(id: string, enabled = true) {
  return useQuery({
    queryKey: attributeQueryKeys.detail(id),
    queryFn: () => getAttributeById(id),
    enabled: enabled && Boolean(id)
  });
}

export function useCreateAttributeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAttributePayload) => createAttribute(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: attributeQueryKeys.lists() });
    }
  });
}

export function useUpdateAttributeMutation(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateAttributePayload) => updateAttribute(id, payload),
    onSuccess: async (attribute) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: attributeQueryKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: attributeQueryKeys.detail(attribute.id) })
      ]);
    }
  });
}

export function useDeleteAttributeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, version }: { id: string; version: number }) => deleteAttribute(id, version),
    onSuccess: async (_result, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: attributeQueryKeys.lists() }),
        queryClient.removeQueries({ queryKey: attributeQueryKeys.detail(variables.id) })
      ]);
    }
  });
}

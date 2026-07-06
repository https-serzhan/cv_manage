import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getPositions,
  getPositionById,
  createPosition,
  updatePosition,
  deletePosition,
  duplicatePosition,
  getPositionAccess,
  updatePositionAccess
} from "../api/positionsApi";

import type {
  DuplicatePositionPayload,
  UpdatePositionPayload,
  UpdatePositionAccessPayload,
  GetPositionsParams
} from "./types";

export const positionQueryKeys = {
  all: ["positions"] as const,
  lists: () => [...positionQueryKeys.all, "list"] as const,
  list: (params: GetPositionsParams) => [...positionQueryKeys.lists(), params] as const,
  details: () => [...positionQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...positionQueryKeys.details(), id] as const,
  access: (id: string) => [...positionQueryKeys.detail(id), "access"] as const
};

export function usePositionsQuery(params: GetPositionsParams = {}) {
  return useQuery({
    queryKey: positionQueryKeys.list(params),
    queryFn: () => getPositions(params)
  });
}

export function usePositionQuery(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: positionQueryKeys.detail(id),
    queryFn: () => getPositionById(id),
    enabled: Boolean(id) && enabled
  });
}

export function usePositionAccessQuery(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: positionQueryKeys.access(id),
    queryFn: () => getPositionAccess(id),
    enabled: Boolean(id) && enabled
  });
}

export function useCreatePositionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPosition,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: positionQueryKeys.lists()
      });
    }
  });
}

type UpdatePositionVariables = {
  id: string;
  payload: UpdatePositionPayload;
};

export function useUpdatePositionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: UpdatePositionVariables) => updatePosition(id, payload),
    onSuccess: (updatedPosition) => {
      void queryClient.invalidateQueries({ queryKey: positionQueryKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: positionQueryKeys.detail(updatedPosition.id)
      });
      void queryClient.invalidateQueries({
        queryKey: positionQueryKeys.access(updatedPosition.id)
      });
    }
  });
}

type DeletePositionVariables = {
  id: string;
  version: number;
};

export function useDeletePositionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, version }: DeletePositionVariables) => deletePosition(id, version),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: positionQueryKeys.lists() });
      queryClient.removeQueries({
        queryKey: positionQueryKeys.detail(variables.id)
      });
    }
  });
}

type DuplicatePositionVariables = {
  id: string;
  payload?: DuplicatePositionPayload;
};

export function useDuplicatePositionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: DuplicatePositionVariables) => duplicatePosition(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: positionQueryKeys.lists() });
    }
  });
}

type UpdatePositionAccessVariables = {
  id: string;
  payload: UpdatePositionAccessPayload;
};

export function useUpdatePositionAccessMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: UpdatePositionAccessVariables) =>
      updatePositionAccess(id, payload),
    onSuccess: (updatePositionAccess) => {
      void queryClient.invalidateQueries({ queryKey: positionQueryKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: positionQueryKeys.detail(updatePositionAccess.positionId)
      });
      void queryClient.invalidateQueries({
        queryKey: positionQueryKeys.access(updatePositionAccess.positionId)
      });
    }
  });
}

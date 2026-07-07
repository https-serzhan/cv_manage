import { useQuery } from "@tanstack/react-query";

import { getCvPreview } from "../api/cvsApi";

export const cvQueryKeys = {
  all: ["cvs"] as const,
  previews: () => [...cvQueryKeys.all, "preview"] as const,
  preview: (positionId: string) => [...cvQueryKeys.previews(), positionId] as const
};

export function useCvPreviewQuery(positionId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: cvQueryKeys.preview(positionId),
    queryFn: () => getCvPreview(positionId),
    enabled: Boolean(positionId) && enabled
  });
}

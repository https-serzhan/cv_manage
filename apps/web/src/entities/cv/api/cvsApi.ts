import { apiRequest } from "../../../shared/api/client";

import type { CvPreviewDto } from "../model/types";

export function getCvPreview(positionId: string) {
  return apiRequest<CvPreviewDto>(`/api/cvs/preview/${positionId}`);
}

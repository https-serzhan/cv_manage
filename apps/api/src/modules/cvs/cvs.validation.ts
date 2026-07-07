import { z } from "zod";

export const cvPreviewParamsSchema = z.object({
  positionId: z.string().trim().min(1)
});

export type CvPreviewParams = z.infer<typeof cvPreviewParamsSchema>;

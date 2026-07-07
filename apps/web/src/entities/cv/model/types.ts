import type { AttributeType } from "../../attribute/model/types";
import type { PositionAccessMode } from "../../position/model/types";

export type CvPreviewDto = {
  position: {
    id: string;
    title: string;
    description: string | null;
    accessMode: PositionAccessMode;
    maxProjects: number | null;
    projectTags: Array<{
      id: string;
      name: string;
    }>;
  };
  candidate: {
    id: string;
    displayName: string;
    email: string;
    profile: {
      headline: string | null;
      summary: string | null;
      location: string | null;
      avatarImageUrl: string | null;
    };
  };
  attributes: CvPreviewAttributeDto[];
  projects: CvPreviewProjectDto[];
  missingRequiredAttributes: CvMissingRequiredAttributeDto[];
  generatedAt: string;
};

export type CvPreviewAttributeDto = {
  attributeId: string;
  name: string;
  type: AttributeType;
  category: {
    id: string;
    name: string;
  };
  isRequired: boolean;
  value: string | number | boolean | null;
  displayValue: string | null;
};

export type CvPreviewProjectDto = {
  id: string;
  title: string;
  description: string | null;
  role: string | null;
  url: string | null;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  tags: Array<{
    id: string;
    name: string;
  }>;
};

export type CvMissingRequiredAttributeDto = {
  attributeId: string;
  name: string;
  type: AttributeType;
};

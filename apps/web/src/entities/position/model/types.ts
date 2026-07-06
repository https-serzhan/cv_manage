import type {
  AttributeCategory,
  AttributeOption,
  AttributeType
} from "../../attribute/model/types";

export type PositionAccessMode = "PUBLIC" | "RESTRICTED";

export type PositionAttributeItem = {
  attribute: {
    id: string;
    name: string;
    description: string | null;
    type: AttributeType;
    category: AttributeCategory;
    options: AttributeOption[];
  };
  sortOrder: number;
  isRequired: boolean;
};

export type PositionProjectTag = {
  id: string;
  name: string;
};

export type PositionAllowedCandidate = {
  id: string;
  displayName: string;
  email: string;
};

export type PositionDto = {
  id: string;
  title: string;
  description: string | null;
  accessMode: PositionAccessMode;
  maxProjects: number | null;
  createdBy: { id: string; displayName: string } | null;
  attributes: PositionAttributeItem[];
  projectTags: PositionProjectTag[];
  candidateAccessCount: number;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type PositionsPagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PositionsListResponse = {
  items: PositionDto[];
  pagination: PositionsPagination;
};

export type GetPositionsParams = {
  prefix?: string;
  accessMode?: PositionAccessMode;
  attributeId?: string;
  projectTagId?: string;
  page?: number;
  pageSize?: number;
};

export type PositionAttributePayload = {
  attributeId: string;
  isRequired?: boolean;
};

export type CreatePositionPayload = {
  title: string;
  description?: string | null;
  accessMode: PositionAccessMode;
  maxProjects?: number | null;
  attributes: PositionAttributePayload[];
  projectTagNames?: string[];
  allowedCandidateUserIds?: string[];
};

export type UpdatePositionPayload = CreatePositionPayload & {
  version: number;
};

export type DuplicatePositionPayload = {
  title?: string;
};

export type UpdatePositionAccessPayload = {
  accessMode: PositionAccessMode;
  allowedCandidateUserIds: string[];
  version: number;
};

export type PositionAccessDto = {
  positionId: string;
  accessMode: PositionAccessMode;
  allowedCandidates: PositionAllowedCandidate[];
};

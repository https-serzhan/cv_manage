import type { AttributeType } from "../../attribute/model/types";

export type Profile = {
  id: string;
  headline: string | null;
  summary: string | null;
  location: string | null;
  avatarImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type UpdateProfilePayload = {
  headline?: string | null;
  summary?: string | null;
  location?: string | null;
  avatarImageUrl?: string | null;
  version: number;
};

export type ProfileAttribute = {
  id: string;
  name: string;
  description: string | null;
  type: AttributeType;
  category: {
    id: string;
    name: string;
  };
};

export type ProfileAttributeValue = {
  id: string;
  attribute: ProfileAttribute;
  stringValue: string | null;
  textValue: string | null;
  imageUrl: string | null;
  numericValue: string | null;
  dateValue: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  booleanValue: boolean | null;
  selectedOption: {
    id: string;
    value: string;
    sortOrder: number;
  } | null;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type UpdateProfileAttributeValuePayload = {
  stringValue?: string | null;
  textValue?: string | null;
  imageUrl?: string | null;
  numericValue?: string | number | null;
  dateValue?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  booleanValue?: boolean | null;
  selectedOptionId?: string | null;
  version?: number;
};

export type CandidateProject = {
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
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type ProjectTag = {
  id: string;
  name: string;
  createdAt: string;
};

export type CreateProjectPayload = {
  title: string;
  description?: string | null;
  role?: string | null;
  url?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isCurrent?: boolean;
  tagNames?: string[];
};

export type UpdateProjectPayload = CreateProjectPayload & {
  version: number;
};

export type ProjectTagsListResponse = {
  items: ProjectTag[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type GetProjectTagsParams = {
  prefix?: string;
  page?: number;
  pageSize?: number;
};

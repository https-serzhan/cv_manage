export type AttributeType =
  | "STRING"
  | "TEXT"
  | "IMAGE"
  | "NUMERIC"
  | "DATE"
  | "PERIOD"
  | "BOOLEAN"
  | "DROPDOWN";

export const attributeTypes = [
  "STRING",
  "TEXT",
  "IMAGE",
  "NUMERIC",
  "DATE",
  "PERIOD",
  "BOOLEAN",
  "DROPDOWN"
] as const satisfies AttributeType[];

export type AttributeOption = {
  id: string;
  value: string;
  sortOrder: number;
};

export type AttributeCategory = {
  id: string;
  name: string;
  createdAt?: string;
};

export type AttributePagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type Attribute = {
  id: string;
  name: string;
  description: string | null;
  type: AttributeType;
  createdAt: string;
  updatedAt: string;
  version: number;
  category: AttributeCategory;
  options: AttributeOption[];
};

export type CreateAttributePayload = {
  categoryId: string;
  name: string;
  description: string | null;
  type: AttributeType;
  options?: string[];
};

export type UpdateAttributePayload = {
  categoryId: string;
  name: string;
  description: string | null;
  type: AttributeType;
  options?: string[];
  version: number;
};

export type AttributesListResponse = {
  items: Attribute[];
  pagination: AttributePagination;
};

export type GetAttributesParams = {
  prefix?: string;
  categoryId?: string;
  type?: AttributeType;
  page?: number;
  pageSize?: number;
};

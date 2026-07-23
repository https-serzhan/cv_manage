const defaultApiBaseUrl = "http://localhost:4000";

function normalizeApiBaseUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

export const apiBaseUrl = normalizeApiBaseUrl(
  import.meta.env.VITE_API_BASE_URL?.trim() || defaultApiBaseUrl
);

export function createApiUrl(path: string): string {
  return `${apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

type ApiErrorIssue = {
  path?: Array<string | number>;
  message: string;
};

type ApiErrorBody = {
  message?: string;
  issues?: ApiErrorIssue[];
};

type ApiRequestOptions = RequestInit & {
  skipJsonContentType?: boolean;
};

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: ApiErrorBody | null
  ) {
    super(body?.message ?? `API request failed with status ${status}`);
    this.name = "ApiError";
  }
}

async function readJsonBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json") || response.status === 204) {
    return null;
  }

  return response.json();
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (!value || typeof value !== "object") {
    return false;
  }

  return "message" in value || "issues" in value;
}

export function getApiErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return "Unexpected error";
  }

  const issueMessages =
    error.body?.issues
      ?.map((issue) => {
        const path = issue.path?.join(".");
        return path ? `${path}: ${issue.message}` : issue.message;
      })
      .filter(Boolean) ?? [];

  if (issueMessages.length > 0) {
    return issueMessages.join("\n");
  }

  return error.message;
}

export async function apiRequest<TResponse>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<TResponse> {
  const { skipJsonContentType, headers, ...requestOptions } = options;
  const response = await fetch(createApiUrl(path), {
    credentials: "include",
    headers: {
      ...(skipJsonContentType ? {} : { "Content-Type": "application/json" }),
      ...headers
    },
    ...requestOptions
  });

  const responseBody = await readJsonBody(response);

  if (!response.ok) {
    throw new ApiError(response.status, isApiErrorBody(responseBody) ? responseBody : null);
  }

  return responseBody as TResponse;
}

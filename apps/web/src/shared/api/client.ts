export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

type ApiRequestOptions = RequestInit & {
  skipJsonContentType?: boolean;
};

export async function apiRequest<TResponse>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<TResponse> {
  const { skipJsonContentType, headers, ...requestOptions } = options;
  const response = await fetch(`${apiBaseUrl}${path}`, {
    credentials: "include",
    headers: {
      ...(skipJsonContentType ? {} : { "Content-Type": "application/json" }),
      ...headers
    },
    ...requestOptions
  });

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return response.json() as Promise<TResponse>;
}

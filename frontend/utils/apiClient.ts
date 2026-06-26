/**
 * Authenticated API client for backend requests.
 */

export function getBackendUrl(): string {
  return process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
}

function getApiKey(): string | undefined {
  return process.env.NEXT_PUBLIC_API_KEY;
}

export function getAuthHeaders(
  extra: Record<string, string> = {}
): Record<string, string> {
  const headers: Record<string, string> = { ...extra };
  const apiKey = getApiKey();
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }
  return headers;
}

export function getBackendWsHost(): string {
  if (process.env.NEXT_PUBLIC_WS_HOST) {
    return process.env.NEXT_PUBLIC_WS_HOST;
  }
  const backendUrl = getBackendUrl();
  try {
    const url = new URL(backendUrl);
    return url.host;
  } catch {
    return "localhost:8000";
  }
}

export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${getBackendUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = getAuthHeaders(
    (options.headers as Record<string, string>) || {}
  );

  return fetch(url, { ...options, headers });
}

/**
 * Build WebSocket URL for execution updates.
 */
export function buildExecutionWebSocketUrl(executionId: string): string {
  const wsProtocol =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "wss:"
      : "ws:";
  const wsHost = getBackendWsHost();
  return `${wsProtocol}//${wsHost}/ws/execution/${executionId}`;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(message: string, code: string = "UNKNOWN_ERROR", status: number = 500) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include" // send HTTP-only cookies
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.error?.message || "An unexpected network error occurred.";
    const errorCode = data?.error?.code || "HTTP_ERROR";
    
    if (response.status === 401 && typeof window !== "undefined") {
      // Trigger custom auth expiration event if client-side
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }
    
    throw new ApiError(errorMsg, errorCode, response.status);
  }

  return data as T;
}

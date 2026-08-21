import type { ApiError } from '../types/api';

const baseUrl =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1';

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: ApiError,
  ) {
    super(Array.isArray(body.message) ? body.message.join(', ') : body.message);
  }
}

export async function api<T>(
  path: string,
  token?: string | null,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  if (!response.ok) {
    const body = await response
      .json()
      .catch(() => ({
        statusCode: response.status,
        message: 'Request failed without a JSON response.',
      }));
    throw new HttpError(response.status, body as ApiError);
  }
  return response.json() as Promise<T>;
}

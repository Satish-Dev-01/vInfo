import { ApiError } from './api-error';
import { logger } from '../logger';
import { handleUnauthorizedSession } from '../auth-helpers';

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  private async fetchWithTimeout(url: string, options: RequestOptions = {}): Promise<Response> {
    const { timeoutMs = 8000, ...fetchOptions } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });
      return response;
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') {
        throw new ApiError(`Request timed out after ${timeoutMs}ms`, 408, 'REQUEST_TIMEOUT');
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { retries = 2, retryDelayMs = 500, ...fetchOptions } = options;
    const url = `${this.baseUrl}${endpoint}`;

    let attempt = 0;
    while (attempt <= retries) {
      try {
        const response = await this.fetchWithTimeout(url, {
          ...fetchOptions,
          headers: {
            'Content-Type': 'application/json',
            ...(fetchOptions.headers || {}),
          },
        });

        if (response.status === 401) {
          handleUnauthorizedSession();
          const errorBody = await response.json().catch(() => null);
          throw new ApiError(
            errorBody?.error?.message || errorBody?.message || 'Unauthorized session. Please log in again.',
            401,
            'UNAUTHORIZED'
          );
        }

        if (!response.ok) {
          const errorBody = await response.json().catch(() => null);
          throw new ApiError(
            errorBody?.error?.message || `HTTP error ${response.status}: ${response.statusText}`,
            response.status,
            errorBody?.error?.code || 'HTTP_ERROR',
            errorBody?.error?.details
          );
        }

        const data = await response.json();
        return data as T;
      } catch (error) {
        attempt++;
        if (attempt > retries) {
          logger.error(`API request failed after ${retries} retries: ${url}`, 'ApiClient', error);
          if (error instanceof ApiError) throw error;
          throw new ApiError((error as Error).message || 'Network request failed', 500);
        }

        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs * Math.pow(2, attempt - 1)));
      }
    }

    throw new ApiError('Max retries exceeded', 500);
  }

  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(process.env.NEXT_PUBLIC_API_BASE_URL || '/api');

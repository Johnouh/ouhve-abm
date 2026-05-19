// Centralized API client with error handling and retry logic
import { queryClient } from "./queryClient";

interface ApiRequestOptions {
  retries?: number;
  timeout?: number;
}

export async function apiRequestWithRetry<T>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  url: string,
  data?: any,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { retries = 2, timeout = 10000 } = options;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: data ? JSON.stringify(data) : undefined,
        credentials: 'include',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 401) {
          // Clear auth cache on unauthorized
          queryClient.setQueryData(["/api/user"], null);
          throw new Error('인증이 필요합니다');
        }
        
        if (response.status >= 500 && attempt < retries) {
          // Retry on server errors
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      
      if (method === 'DELETE' && response.status === 204) {
        return null as T;
      }
      
      return await response.json();
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      
      // Don't retry on client errors (4xx) except 401
      if (error instanceof Error && error.message.includes('HTTP 4')) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  
  throw new Error('Request failed after retries');
}

// Input validation and sanitization
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential XSS characters
    .substring(0, 1000); // Limit length
}

// Phone number formatting
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  }
  return phone;
}

// Date formatting for Korean locale
export function formatKoreanDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

// Currency formatting
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW'
  }).format(amount);
}
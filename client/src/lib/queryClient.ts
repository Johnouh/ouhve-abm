// 📡 API 클라이언트 및 쿼리 설정 (API Client and Query Configuration)
// 🎯 Purpose: 서버와의 HTTP 통신 및 상태 관리를 위한 중앙화된 설정 (Centralized configuration for HTTP communication and state management with server)

import { QueryClient, QueryFunction } from "@tanstack/react-query";

// ❌ HTTP 응답 오류 처리 함수 (HTTP response error handling function)
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// 🌐 API 요청 함수 (API request function)
// 🔒 보안: JWT 토큰 자동 포함 (Security: Automatically include JWT tokens)
// 📝 204 응답 처리: 빈 응답 시 null 반환하는 헬퍼 함수 추가
export async function apiRequest(
  method: string,
  url: string,
  data?: any,
  options: {
    headers?: Record<string, string>;
    timeout?: number;
  } = {}
): Promise<Response> {
  // 🔐 세션 기반 인증 사용 (Use session-based authentication)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // 🌐 Express API 엔드포인트로 요청 (Request to Express API endpoint)
  const apiUrl = url.startsWith('/api') ? url : `/api${url}`;
  
  // 🚀 성능 최적화: 요청 타임아웃 설정 (Performance optimization: Request timeout configuration)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || 30000);
  
  try {
    const res = await fetch(apiUrl, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      signal: controller.signal,
      credentials: 'include', // 🔒 세션 쿠키 포함 (Include session cookies)
    });

    clearTimeout(timeoutId);
    
    // 향상된 에러 처리 (Enhanced error handling)
    if (!res.ok) {
      let errorMessage = "Request failed";
      
      try {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await res.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } else {
          const errorText = await res.text();
          errorMessage = errorText || errorMessage;
        }
      } catch {
        errorMessage = `HTTP ${res.status}: ${res.statusText}`;
      }

      const error = new Error(errorMessage);
      (error as any).status = res.status;
      throw error;
    }
    
    return res;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('요청 시간이 초과되었습니다. 다시 시도해주세요.');
      }
      if (error.message.includes('Failed to fetch')) {
        throw new Error('네트워크 연결을 확인해주세요.');
      }
    }
    
    throw error;
  }
}

// 📝 API 응답 JSON 파싱 헬퍼 (API response JSON parsing helper)
// 🔒 204 No Content 응답 시 null 반환 (Returns null for 204 No Content responses)
export async function parseApiResponse<T = any>(res: Response): Promise<T | null> {
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return null;
  }
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await res.json();
  }
  return null;
}

// 🔐 인증 실패 시 동작 타입 정의 (Unauthorized behavior type definition)
type UnauthorizedBehavior = "returnNull" | "throw";

// 📊 쿼리 함수 생성기 (Query function generator)
// 🔒 보안: 401 오류 시 동작 방식 설정 가능 (Security: Configurable behavior on 401 errors)
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // 🔒 세션 기반 인증 사용 (Use session-based authentication)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // 🌐 Express API 엔드포인트로 요청 (Request to Express API endpoint)
    const url = queryKey[0] as string;
    const apiUrl = url.startsWith('/api') ? url : `/api${url}`;
    
    const res = await fetch(apiUrl, {
      headers,
      credentials: 'include', // 🔒 세션 쿠키 포함 (Include session cookies)
    });

    // 🚫 인증 실패 시 null 반환 (Return null on authentication failure)
    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// 🔧 전역 쿼리 클라이언트 설정 (Global query client configuration)
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false, // 🔄 자동 새로고침 비활성화 (Disable automatic refetch)
      refetchOnWindowFocus: false, // 🔄 윈도우 포커스 시 새로고침 비활성화 (Disable refetch on window focus)
      refetchOnReconnect: true, // 🔄 네트워크 재연결 시 새로고침 활성화 (Enable refetch on network reconnection)
      staleTime: 2 * 60 * 1000, // ⏰ 2분간 데이터 유효 (2 minutes data validity for better UX)
      gcTime: 15 * 60 * 1000, // 15 minutes cache (더 긴 캐시 유지)
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors except 401
        if (error?.message?.includes('4') && !error?.message?.includes('401')) {
          return false;
        }
        return failureCount < 2;
      },
      // 🚀 성능 최적화: 네트워크 요청 최적화 (Performance optimization: Network request optimization)
      networkMode: 'online', // 온라인 상태에서만 요청 (Only request when online)
      notifyOnChangeProps: ['data', 'error', 'isLoading'], // 필요한 프로퍼티만 리렌더링 (Only re-render necessary properties)
    },
    mutations: {
      retry: 1,
      networkMode: 'online',
    },
  },
});

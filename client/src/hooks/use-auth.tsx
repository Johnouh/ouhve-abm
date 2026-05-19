// 🔐 인증 컨텍스트 및 훅 (Authentication Context and Hook)
// 🎯 Purpose: 전역 사용자 인증 상태 관리 및 로그인/로그아웃 기능 제공 (Global user authentication state management and login/logout functionality)

import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// 🏷️ 인증 컨텍스트 타입 정의 (Authentication context type definition)
type AuthContextType = {
  user: SelectUser | null; // 현재 로그인된 사용자 정보 (Current logged-in user information)
  isLoading: boolean; // 인증 상태 로딩 여부 (Authentication state loading status)
  error: Error | null; // 인증 오류 정보 (Authentication error information)
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>; // 로그인 변경 함수 (Login mutation function)
  logoutMutation: UseMutationResult<void, Error, void>; // 로그아웃 변경 함수 (Logout mutation function)
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>; // 회원가입 변경 함수 (Registration mutation function)
};

// 🏷️ 로그인 데이터 타입 정의 (Login data type definition)
type LoginData = Pick<InsertUser, "username" | "password">;

// 🔐 인증 컨텍스트 생성 (Create authentication context)
export const AuthContext = createContext<AuthContextType | null>(null);

// 🏗️ 인증 프로바이더 컴포넌트 (Authentication provider component)
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  // 📊 현재 사용자 정보 조회 (Query current user information)
  // 🔒 보안: 401 에러 시 null 반환하여 로그인 페이지로 리다이렉트 (Security: Return null on 401 error to redirect to login page)
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    staleTime: 0,
  });

  // 🔑 로그인 변경 함수 (Login mutation function)
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      const data = await res.json();
      return data;
    },
    onSuccess: (data: any) => {
      // 🔥 완전한 캐시 무효화 - 모든 이전 데이터 제거 (Complete cache invalidation - Remove all previous data)
      queryClient.clear();
      
      // ✅ 성공 시 사용자 정보를 캐시에 저장 (Store user information in cache on success)
      queryClient.setQueryData(["/api/user"], data);
      
      // 🔄 모든 데이터 쿼리 강제 재요청 (Force refetch all data queries)
      queryClient.invalidateQueries();
    },
    onError: (error: Error) => {
      // ❌ 실패 시 토스트 메시지 표시 (Show toast message on failure)
      toast({
        title: "로그인 실패 (Login failed)",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 📝 회원가입 변경 함수 (Registration mutation function)
  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest("POST", "/api/auth/register", credentials);
      const data = await res.json();
      return data;
    },
    onSuccess: (data: any) => {
      // ✅ 성공 시 자동 로그인 처리 (Automatic login on successful registration)
      queryClient.setQueryData(["/api/user"], data);
    },
    onError: (error: Error) => {
      // ❌ 실패 시 토스트 메시지 표시 (Show toast message on failure)
      toast({
        title: "회원가입 실패 (Registration failed)",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 🚪 로그아웃 변경 함수 (Logout mutation function)
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      // 🔥 완전한 캐시 무효화 - 모든 데이터 제거 (Complete cache invalidation - Remove all data)
      queryClient.clear();
      
      // ✅ 성공 시 사용자 정보를 캐시에서 제거 (Remove user information from cache on success)
      queryClient.setQueryData(["/api/user"], null);
      queryClient.removeQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: Error) => {
      // ❌ 실패 시 토스트 메시지 표시 (Show toast message on failure)
      toast({
        title: "로그아웃 실패 (Logout failed)",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// 🔐 인증 훅 사용 함수 (Authentication hook usage function)
// 🎯 Purpose: 컴포넌트에서 인증 상태와 기능에 접근할 수 있도록 제공 (Provide access to authentication state and functions in components)
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    // ⚠️ 에러 처리: AuthProvider 외부에서 사용 시 오류 발생 (Error handling: Throw error when used outside AuthProvider)
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

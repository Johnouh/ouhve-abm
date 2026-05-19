// 🏪 키오스크 전용 로그인 페이지 (Kiosk Login Page)
// 🎯 Purpose: kiosk.ouhve.app 전용 로그인 UI — 로그인 후 /kiosk/home으로 이동

import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Monitor } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const loginSchema = z.object({
  username: z.string().min(1, "아이디를 입력해주세요"),
  password: z.string().min(1, "비밀번호를 입력해주세요"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function KioskAuthPage() {
  const [, setLocation] = useLocation();
  const { user, loginMutation } = useAuth();

  // 이미 로그인된 경우 키오스크 홈으로 이동 (Redirect to kiosk home if already logged in)
  useEffect(() => {
    if (user) setLocation("/kiosk/home");
  }, [user, setLocation]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data, {
      onSuccess: () => setLocation("/kiosk/home"),
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        {/* 로고 영역 (Logo area) */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-orange-500 flex items-center justify-center mx-auto shadow-lg">
            <Monitor className="w-8 h-8 text-white shrink-0" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">키오스크</h1>
            <p className="text-sm text-gray-400 mt-1">관리자 계정으로 로그인해주세요</p>
          </div>
        </div>

        {/* 로그인 폼 (Login form) */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm text-gray-300">
              아이디
            </Label>
            <Input
              id="username"
              {...register("username")}
              placeholder="아이디 입력"
              autoComplete="username"
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus-visible:ring-orange-500 focus-visible:ring-1 h-11"
            />
            {errors.username && (
              <p className="text-xs text-red-400">{errors.username.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm text-gray-300">
              비밀번호
            </Label>
            <Input
              id="password"
              type="password"
              {...register("password")}
              placeholder="비밀번호 입력"
              autoComplete="current-password"
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus-visible:ring-orange-500 focus-visible:ring-1 h-11"
            />
            {errors.password && (
              <p className="text-xs text-red-400">{errors.password.message}</p>
            )}
          </div>

          {loginMutation.isError && (
            <p className="text-xs text-red-400 text-center">
              아이디 또는 비밀번호가 올바르지 않습니다
            </p>
          )}

          <Button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white font-semibold"
          >
            {loginMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            ) : (
              "로그인"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

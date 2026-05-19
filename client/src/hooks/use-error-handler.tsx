// 🛡️ 에러 핸들러 훅 (Error Handler Hook)
// 🎯 Purpose: 전역 에러 처리 및 사용자 친화적 메시지 제공 (Global error handling and user-friendly messages)

import { useToast } from '@/hooks/use-toast';
import { useCallback } from 'react';

export const useErrorHandler = () => {
  const { toast } = useToast();

  const handleError = useCallback((error: any, context?: string) => {
    console.error(`Error in ${context || 'application'}:`, error);
    
    let message = '알 수 없는 오류가 발생했습니다.';
    
    if (error?.message) {
      if (error.message.includes('network') || error.message.includes('Failed to fetch')) {
        message = '네트워크 연결을 확인해주세요.';
      } else if (error.message.includes('timeout')) {
        message = '요청 시간이 초과되었습니다. 다시 시도해주세요.';
      } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        message = '인증이 필요합니다. 다시 로그인해주세요.';
      } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
        message = '접근 권한이 없습니다.';
      } else if (error.message.includes('404') || error.message.includes('Not Found')) {
        message = '요청한 데이터를 찾을 수 없습니다.';
      } else if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
        message = '서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      } else {
        message = error.message;
      }
    }

    toast({
      title: context ? `${context} 오류` : '오류 발생',
      description: message,
      variant: 'destructive',
    });
  }, [toast]);

  return { handleError };
};
// 🚨 에러 표시 컴포넌트 (Error Display Component)
// 🎯 Purpose: 일관된 에러 UI 제공 (Provide consistent error UI)

import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorDisplayProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showRefresh?: boolean;
  className?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  title = '오류가 발생했습니다',
  message = '잠시 후 다시 시도해주세요.',
  onRetry,
  showRefresh = true,
  className = ''
}) => {
  return (
    <div className={`p-8 text-center ${className}`}>
      <div className="flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>
      <div className="text-red-600 font-medium mb-2">{title}</div>
      <div className="text-sm text-gray-500 mb-4">{message}</div>
      
      <div className="flex justify-center space-x-2">
        {onRetry && (
          <Button 
            onClick={onRetry}
            variant="outline"
            size="sm"
            className="text-blue-500 border-blue-500 hover:bg-blue-50"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            다시 시도
          </Button>
        )}
        
        {showRefresh && (
          <Button 
            onClick={() => window.location.reload()}
            variant="outline"
            size="sm"
            className="text-gray-500 border-gray-500 hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            새로고침
          </Button>
        )}
      </div>
    </div>
  );
};
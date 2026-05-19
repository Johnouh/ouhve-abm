// 🔄 로딩 스피너 컴포넌트 (Loading Spinner Component)
// 🎯 Purpose: 일관된 로딩 표시 UI 제공 (Provide consistent loading UI)

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text = '로딩 중...',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-gray-500`} />
      {text && <span className="text-gray-500">{text}</span>}
    </div>
  );
};
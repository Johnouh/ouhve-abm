// 📊 데이터 테이블 컴포넌트 (Data Table Component)
// 🎯 Purpose: 일관된 테이블 UI 및 에러 처리 제공 (Provide consistent table UI and error handling)

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorDisplay } from '@/components/ui/error-display';

interface DataTableProps<T> {
  data: T[];
  isLoading: boolean;
  error?: Error | null;
  onRetry?: () => void;
  headers: string[];
  renderRow: (item: T, index: number) => React.ReactNode;
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T>({
  data,
  isLoading,
  error,
  onRetry,
  headers,
  renderRow,
  emptyMessage = '데이터가 없습니다.',
  className = ''
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-8">
          <LoadingSpinner text="데이터를 불러오는 중..." />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-0">
          <ErrorDisplay
            title="데이터를 불러오는 중 오류가 발생했습니다"
            message="네트워크 연결을 확인하시거나 잠시 후 다시 시도해주세요."
            onRetry={onRetry}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-0">
        {/* Table Header */}
        <div className="grid gap-4 p-4 border-b font-medium text-sm text-gray-700" 
             style={{ gridTemplateColumns: `repeat(${headers.length}, minmax(0, 1fr))` }}>
          {headers.map((header, index) => (
            <div key={index}>{header}</div>
          ))}
        </div>

        {/* Table Rows */}
        {data.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {emptyMessage}
          </div>
        ) : (
          data.map((item, index) => (
            <div
              key={index}
              className="grid gap-4 p-4 border-b text-sm hover:bg-gray-50 transition-colors"
              style={{ gridTemplateColumns: `repeat(${headers.length}, minmax(0, 1fr))` }}
            >
              {renderRow(item, index)}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
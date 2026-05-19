// 🛡️ 전역 에러 바운더리 (Global Error Boundary)
// 🎯 Purpose: React 컴포넌트 에러 포착 및 사용자 친화적 오류 표시 (Catch React component errors and display user-friendly error messages)

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('에러 바운더리에서 포착된 에러:', error);
    console.error('에러 정보:', errorInfo);
    
    // 에러 리포팅 서비스로 전송 (예: Sentry, LogRocket 등)
    // 실제 환경에서는 여기에 에러 리포팅 로직을 추가
    
    this.setState({
      hasError: true,
      error,
      errorInfo
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // 사용자 정의 fallback UI가 제공된 경우
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 기본 에러 UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                문제가 발생했습니다
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  예기치 않은 오류가 발생했습니다. 페이지를 새로고침하거나 다시 시도해주세요.
                </p>
              </div>
              
              {/* 개발 환경에서만 에러 세부사항 표시 */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg">
                  <p className="text-xs font-medium text-red-800 mb-2">개발 모드 에러 정보:</p>
                  <pre className="text-xs text-red-700 overflow-auto max-h-32">
                    {this.state.error.message}
                  </pre>
                </div>
              )}
              
              <div className="flex space-x-2">
                <Button
                  onClick={this.handleRetry}
                  className="flex-1"
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  다시 시도
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  className="flex-1"
                >
                  페이지 새로고침
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// 🔄 Hook 기반 에러 바운더리 래퍼 (Hook-based error boundary wrapper)
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
): React.ComponentType<P> {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
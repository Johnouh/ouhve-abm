// 🛡️ 전역 에러 바운더리 (Global Error Boundary)
// 🎯 Purpose: React 컴포넌트 에러 포착 및 사용자 친화적 오류 표시 (Catch React component errors and display user-friendly error messages)

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 🔍 에러 로깅 (Error logging)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // 🔄 프로덕션에서는 에러 리포팅 서비스로 전송 (Send to error reporting service in production)
    if (process.env.NODE_ENV === 'production') {
      // TODO: 에러 리포팅 서비스 연동 (Integrate error reporting service)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-xl text-red-600">문제가 발생했습니다</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 text-center">
                예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
              </p>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
                  <summary className="cursor-pointer font-medium">개발자 정보</summary>
                  <pre className="mt-2 whitespace-pre-wrap break-all">
                    {this.state.error.message}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
              <div className="flex gap-2">
                <Button 
                  onClick={this.handleReset}
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
export function withErrorBoundary<T extends {}>(
  Component: React.ComponentType<T>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: T) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
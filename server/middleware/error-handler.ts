// 🚨 서버 에러 핸들링 미들웨어 (Server Error Handling Middleware)
// 🎯 Purpose: 전역 에러 처리 및 안전한 에러 응답 (Global error handling and safe error responses)

import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

// 🔍 에러 로깅 함수 (Error logging function)
function logError(error: AppError, req: Request) {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl || req.url;
  const userAgent = req.get('User-Agent') || 'Unknown';
  const ip = req.ip || req.connection.remoteAddress || 'Unknown';
  
  console.error(`[${timestamp}] ERROR:`, {
    message: error.message,
    stack: error.stack,
    statusCode: error.statusCode || 500,
    method,
    url,
    userAgent,
    ip,
    body: method !== 'GET' ? req.body : undefined,
    query: req.query,
    params: req.params,
  });
}

// 🛡️ 개발용 에러 응답 (Development error response)
function sendErrorDev(error: AppError, res: Response) {
  res.status(error.statusCode || 500).json({
    status: 'error',
    error: {
      message: error.message,
      stack: error.stack,
      statusCode: error.statusCode || 500,
    },
  });
}

// 🔒 프로덕션용 에러 응답 (Production error response)
function sendErrorProd(error: AppError, res: Response) {
  // 🎯 운영 에러만 클라이언트에 노출 (Only expose operational errors to client)
  if (error.isOperational) {
    res.status(error.statusCode || 500).json({
      status: 'error',
      message: error.message,
    });
  } else {
    // 🔒 내부 에러는 일반적인 메시지로 대체 (Replace internal errors with generic message)
    res.status(500).json({
      status: 'error',
      message: '서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
    });
  }
}

// 🚨 전역 에러 핸들러 미들웨어 (Global error handler middleware)
export function errorHandler(
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // 🔍 에러 로깅 (Log error)
  logError(error, req);
  
  // 🎯 기본 상태 코드 설정 (Set default status code)
  error.statusCode = error.statusCode || 500;
  
  // 🌍 환경별 에러 응답 (Environment-specific error response)
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
}

// 🔄 비동기 함수 래퍼 (Async function wrapper)
export function catchAsync(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// 🎯 커스텀 에러 클래스 (Custom error class)
export class AppErrorClass extends Error implements AppError {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// 🚫 404 에러 핸들러 (404 error handler)
export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  const error = new AppErrorClass(`${req.originalUrl} 경로를 찾을 수 없습니다.`, 404);
  next(error);
}
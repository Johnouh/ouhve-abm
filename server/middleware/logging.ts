// 📝 구조화된 로깅 시스템 (Structured Logging System)
// 🎯 Purpose: 체계적인 로그 수집, 분석, 모니터링
// 🔍 Features: 로그 레벨, 컨텍스트 추적, 에러 스택 추적

import { Request, Response, NextFunction } from 'express';
import { writeFileSync, appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: any;
  requestId?: string;
  userId?: number;
  franchiseId?: number;
  ip?: string;
  userAgent?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  responseTime?: number;
  stack?: string;
}

class Logger {
  private currentLevel: LogLevel = LogLevel.INFO;
  private logDir: string = 'logs';
  private context: any = {};

  constructor() {
    // 로그 디렉토리 생성
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }

    // 환경에 따른 로그 레벨 설정
    if (process.env.NODE_ENV === 'development') {
      this.currentLevel = LogLevel.DEBUG;
    } else if (process.env.NODE_ENV === 'production') {
      this.currentLevel = LogLevel.WARN;
    }
  }

  // 🎯 컨텍스트 설정 (Set context)
  public setContext(context: any) {
    this.context = { ...this.context, ...context };
  }

  // 🔍 로그 작성 (Write log)
  private writeLog(level: LogLevel, message: string, context?: any) {
    if (level < this.currentLevel) return;

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      message,
      context: { ...this.context, ...context }
    };

    // 콘솔 출력
    const logString = this.formatLog(logEntry);
    console.log(logString);

    // 파일 저장
    this.saveToFile(logEntry);
  }

  // 🎨 로그 포맷팅 (Format log)
  private formatLog(entry: LogEntry): string {
    const { timestamp, level, message, context } = entry;
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    
    // 환경에 따른 포맷팅
    if (process.env.NODE_ENV === 'development') {
      const colors = {
        DEBUG: '\x1b[36m', // 청록색
        INFO: '\x1b[32m',  // 녹색
        WARN: '\x1b[33m',  // 노란색
        ERROR: '\x1b[31m', // 빨간색
        FATAL: '\x1b[35m'  // 자홍색
      };
      const reset = '\x1b[0m';
      return `${colors[level as keyof typeof colors]}[${timestamp}] ${level}: ${message}${reset}${contextStr}`;
    }
    
    return `[${timestamp}] ${level}: ${message}${contextStr}`;
  }

  // 💾 파일 저장 (Save to file)
  private saveToFile(entry: LogEntry) {
    const today = new Date().toISOString().split('T')[0];
    const filename = join(this.logDir, `${today}.log`);
    
    try {
      const logLine = JSON.stringify(entry) + '\n';
      appendFileSync(filename, logLine);
    } catch (error) {
      console.error('Failed to write log to file:', error);
    }
  }

  // 📊 로그 메서드들 (Log methods)
  public debug(message: string, context?: any) {
    this.writeLog(LogLevel.DEBUG, message, context);
  }

  public info(message: string, context?: any) {
    this.writeLog(LogLevel.INFO, message, context);
  }

  public warn(message: string, context?: any) {
    this.writeLog(LogLevel.WARN, message, context);
  }

  public error(message: string, context?: any) {
    this.writeLog(LogLevel.ERROR, message, context);
  }

  public fatal(message: string, context?: any) {
    this.writeLog(LogLevel.FATAL, message, context);
  }

  // 🔍 HTTP 요청 로그 (HTTP request log)
  public httpRequest(req: Request, res: Response, responseTime: number) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'HTTP',
      message: `${req.method} ${req.path}`,
      requestId: req.headers['x-request-id'] as string,
      userId: (req as any).user?.id,
      franchiseId: (req as any).franchiseId,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime
    };

    this.saveToFile(entry);
  }

  // 🚨 에러 로그 (Error log)
  public logError(error: Error, context?: any) {
    this.writeLog(LogLevel.ERROR, error.message, {
      ...context,
      stack: error.stack,
      name: error.name
    });
  }
}

// 전역 로거 인스턴스
export const logger = new Logger();

// 📊 HTTP 요청 로깅 미들웨어 (HTTP request logging middleware)
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  
  // 요청 시작 로그
  logger.info('Request started', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // 응답 완료 시 로그
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    logger.httpRequest(req, res, responseTime);
    
    // 에러 응답 로그
    if (res.statusCode >= 400) {
      logger.warn('Error response', {
        statusCode: res.statusCode,
        method: req.method,
        path: req.path,
        responseTime
      });
    }
  });

  next();
}

// 🔍 데이터베이스 쿼리 로깅 (Database query logging)
export function logDatabaseQuery(query: string, params?: any, duration?: number) {
  logger.debug('Database query', {
    query,
    params,
    duration: duration ? `${duration}ms` : undefined
  });
}

// 🚨 보안 이벤트 로깅 (Security event logging)
export function logSecurityEvent(event: string, context?: any) {
  logger.warn(`Security event: ${event}`, context);
}

// 📊 비즈니스 로직 로깅 (Business logic logging)
export function logBusinessEvent(event: string, context?: any) {
  logger.info(`Business event: ${event}`, context);
}
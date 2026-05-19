// 🔒 입력 검증 미들웨어 (Input Validation Middleware)
// 🎯 Purpose: 모든 API 입력에 대한 안전한 검증 및 새니타이제이션
// 🛡️ Security: XSS 방지, SQL 인젝션 방지, 입력 정규화

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// 🔍 입력 새니타이제이션 함수 (Input sanitization function)
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    // HTML 태그 제거 및 특수 문자 이스케이프
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/[<>]/g, '')
      .trim();
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    Object.keys(input).forEach(key => {
      sanitized[key] = sanitizeInput(input[key]);
    });
    return sanitized;
  }
  
  return input;
}

// 🛡️ 스키마 검증 미들웨어 팩토리 (Schema validation middleware factory)
export function validateSchema(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // 입력 새니타이제이션
      req.body = sanitizeInput(req.body);
      
      // 스키마 검증
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        );
        return res.status(400).json({
          error: 'Validation failed',
          details: errorMessages
        });
      }
      
      console.error('Validation error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}

// 🔒 프랜차이즈 ID 검증 미들웨어 (Franchise ID validation middleware)
export function validateFranchiseId(req: Request, res: Response, next: NextFunction) {
  const franchiseId = req.franchiseId;
  
  if (!franchiseId || franchiseId <= 0) {
    return res.status(400).json({ error: 'Invalid franchise ID' });
  }
  
  next();
}

// 📊 페이지네이션 검증 미들웨어 (Pagination validation middleware)
export function validatePagination(req: Request, res: Response, next: NextFunction) {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  
  if (page < 1 || limit < 1 || limit > 100) {
    return res.status(400).json({ error: 'Invalid pagination parameters' });
  }
  
  req.pagination = { page, limit, offset: (page - 1) * limit };
  next();
}

// 타입 확장
declare global {
  namespace Express {
    interface Request {
      pagination?: {
        page: number;
        limit: number;
        offset: number;
      };
    }
  }
}
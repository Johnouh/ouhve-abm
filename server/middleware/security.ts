// 🛡️ 보안 미들웨어 (Security Middleware)
// 🎯 Purpose: HTTP 보안 헤더 및 보안 정책 적용
// 🔒 Security: CSRF, XSS, 클릭재킹 방지, 보안 헤더 설정

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

// 🔒 보안 헤더 설정 미들웨어 (Security headers middleware)
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // XSS 방지
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // 클릭재킹 방지
  res.setHeader('X-Frame-Options', 'DENY');
  
  // MIME 타입 스니핑 방지
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // 리퍼러 정책
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // 콘텐츠 보안 정책 (개발 환경)
  if (process.env.NODE_ENV !== 'production') {
    res.setHeader('Content-Security-Policy', 
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
    );
  }
  
  // HSTS (프로덕션 환경)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  next();
}

// 🚦 요청 제한 설정 (Rate limiting configuration)
export const createRateLimit = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      console.warn(`Rate limit exceeded for ${req.ip}: ${req.method} ${req.path}`);
      res.status(429).json({ error: message });
    }
  });
};

// 🔐 로그인 제한 (Login rate limiting)
export const loginRateLimit = createRateLimit(
  15 * 60 * 1000, // 15분
  5, // 5회 시도
  'Too many login attempts, please try again later'
);

// 🔐 일반 API 제한 (General API rate limiting)
export const apiRateLimit = createRateLimit(
  60 * 1000, // 1분
  100, // 100회 요청
  'Too many requests, please try again later'
);

// 🔐 민감한 작업 제한 (Sensitive operations rate limiting)
export const sensitiveRateLimit = createRateLimit(
  60 * 60 * 1000, // 1시간
  10, // 10회 시도
  'Too many sensitive operations, please try again later'
);

// 🔍 의심스러운 활동 감지 (Suspicious activity detection)
export function detectSuspiciousActivity(req: Request, res: Response, next: NextFunction) {
  const userAgent = req.get('User-Agent') || '';
  const ip = req.ip || '';
  
  // 봇 감지
  const botPatterns = [
    /bot/i, /crawler/i, /spider/i, /scraper/i
  ];
  
  if (botPatterns.some(pattern => pattern.test(userAgent))) {
    console.warn(`Suspected bot activity from ${ip}: ${userAgent}`);
    return res.status(403).json({ error: 'Access denied' });
  }
  
  // 비정상적인 요청 패턴 감지
  const suspiciousPatterns = [
    /\.\./,  // 디렉토리 트래버설
    /<script/i, // XSS 시도
    /union.*select/i, // SQL 인젝션 시도
    /drop.*table/i // SQL 인젝션 시도
  ];
  
  const requestString = `${req.url} ${JSON.stringify(req.body)} ${JSON.stringify(req.query)}`;
  
  if (suspiciousPatterns.some(pattern => pattern.test(requestString))) {
    console.error(`Suspicious request from ${ip}: ${requestString}`);
    return res.status(403).json({ error: 'Access denied' });
  }
  
  next();
}

// 🔒 CORS 설정 (CORS configuration)
export function corsConfig(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:5000',
    'https://localhost:5000',
    ...(process.env.ALLOWED_ORIGINS?.split(',') || [])
  ];
  
  if (!origin || allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
}
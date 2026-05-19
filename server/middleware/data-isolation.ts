// 🔐 데이터 격리 미들웨어 (Data Isolation Middleware)
// 🎯 Purpose: 모든 API 엔드포인트에 프랜차이즈 기반 데이터 격리 자동 적용
// 🔒 Security: 완전한 데이터 격리 보장 및 무단 접근 방지

import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

// 🔍 현재 사용자의 프랜차이즈 ID 추출 함수
export const getCurrentFranchiseId = async (req: Request): Promise<number | null> => {
  try {
    // 세션 기반 인증 확인
    if (req.isAuthenticated && req.isAuthenticated()) {
      const user = req.user;
      if (user?.franchiseId) {
        return user.franchiseId;
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting franchise ID:', error);
    return null;
  }
};

// 🔒 필수 인증 및 프랜차이즈 ID 확인 미들웨어
export const requireFranchiseAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // superadmin은 franchiseId 없이도 접근 허용 (전체 데이터 조회)
    if (req.isAuthenticated?.() && req.user?.role === 'superadmin') {
      req.franchiseId = req.user.franchiseId || null;
      return next();
    }

    const franchiseId = await getCurrentFranchiseId(req);

    if (!franchiseId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    req.franchiseId = franchiseId;
    next();
  } catch (error) {
    console.error('Error in requireFranchiseAuth:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// 🔒 선택적 인증 미들웨어 (빈 결과 반환)
export const optionalFranchiseAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const franchiseId = await getCurrentFranchiseId(req);
    req.franchiseId = franchiseId;
    next();
  } catch (error) {
    console.error('Error in optionalFranchiseAuth:', error);
    req.franchiseId = null;
    next();
  }
};

// 🔒 데이터 소유권 확인 미들웨어 팩토리
export const checkOwnership = (getItemFunction: (id: number) => Promise<any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const itemId = parseInt(req.params.id);
      const item = await getItemFunction(itemId);
      
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      
      // 프랜차이즈 ID 확인
      if (req.franchiseId && item.franchiseId !== req.franchiseId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      req.verifiedItem = item;
      next();
    } catch (error) {
      console.error('Error in checkOwnership:', error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
};

// 🔧 Create 작업용 프랜차이즈 ID 자동 설정 미들웨어
export const setFranchiseId = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.franchiseId && req.body) {
      req.body.franchiseId = req.franchiseId;
    }
    next();
  } catch (error) {
    console.error('Error in setFranchiseId:', error);
    next();
  }
};

// 🔒 Superadmin 전용 미들웨어 (superadmin만 접근 가능)
export const requireSuperAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (req.user?.role !== 'superadmin') {
      return res.status(403).json({ error: "Superadmin access required" });
    }
    if (req.user?.franchiseId) {
      req.franchiseId = req.user.franchiseId;
    }
    next();
  } catch (error) {
    console.error('Error in requireSuperAdmin:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// 타입 확장
declare global {
  namespace Express {
    interface Request {
      franchiseId?: number | null;
      verifiedItem?: any;
    }
  }
}
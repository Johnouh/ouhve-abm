// 🔐 인증 및 데이터 격리 미들웨어 (Authentication and Data Isolation Middleware)
// 🎯 Purpose: 사용자 인증 및 프랜차이즈 기반 데이터 격리 보장 (User authentication and franchise-based data isolation)

import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

// 🔒 인증된 사용자의 프랜차이즈 ID를 가져오는 미들웨어
export const getFranchiseId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 인증된 사용자 확인 (세션 기반)
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const user = req.user;
    
    if (!user || !user.franchiseId) {
      return res.status(401).json({ error: "User franchise information not found" });
    }

    // 요청 객체에 프랜차이즈 ID 추가
    req.franchiseId = user.franchiseId;
    next();
  } catch (error) {
    console.error('❌ ERROR in getFranchiseId middleware:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// 🔒 선택적 인증 미들웨어 (개발 중 사용)
export const getOptionalFranchiseId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let franchiseId = null;
    
    if (req.isAuthenticated && req.isAuthenticated()) {
      const user = req.user;
      if (user?.franchiseId) {
        franchiseId = user.franchiseId;
      }
    }
    
    // 요청 객체에 프랜차이즈 ID 추가 (null일 수 있음)
    req.franchiseId = franchiseId;
    next();
  } catch (error) {
    console.error('Error in getOptionalFranchiseId middleware:', error);
    req.franchiseId = null;
    next();
  }
};

// 🔒 데이터 소유권 확인 미들웨어
export const checkDataOwnership = (getItemFunction: (id: number) => Promise<any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const itemId = parseInt(req.params.id);
      const item = await getItemFunction(itemId);
      
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      
      // 프랜차이즈 ID가 일치하는지 확인
      if (item.franchiseId !== req.franchiseId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // 검증된 아이템을 요청 객체에 추가
      req.verifiedItem = item;
      next();
    } catch (error) {
      console.error('Error in checkDataOwnership middleware:', error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
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
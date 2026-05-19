// 📊 성능 모니터링 미들웨어 (Performance Monitoring Middleware)
// 🎯 Purpose: API 성능 추적, 메모리 사용량 모니터링, 병목 구간 식별
// 🚀 Performance: 응답 시간, 메모리 누수 감지, 느린 쿼리 추적

import { Request, Response, NextFunction } from 'express';

interface PerformanceMetrics {
  requestCount: number;
  averageResponseTime: number;
  slowRequests: Array<{
    path: string;
    method: string;
    duration: number;
    timestamp: Date;
  }>;
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  errorCount: number;
  activeConnections: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    requestCount: 0,
    averageResponseTime: 0,
    slowRequests: [],
    memoryUsage: {
      rss: 0,
      heapTotal: 0,
      heapUsed: 0,
      external: 0
    },
    errorCount: 0,
    activeConnections: 0
  };

  private responseTimes: number[] = [];
  private readonly SLOW_REQUEST_THRESHOLD = 1000; // 1초
  private readonly MAX_SLOW_REQUESTS = 100;

  // 🔍 요청 성능 추적 미들웨어 (Request performance tracking middleware)
  public trackPerformance() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      this.metrics.requestCount++;
      this.metrics.activeConnections++;

      // 응답 완료 시 성능 데이터 수집
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        this.updateResponseTime(duration);
        this.metrics.activeConnections--;

        // 느린 요청 추적
        if (duration > this.SLOW_REQUEST_THRESHOLD) {
          this.trackSlowRequest(req, duration);
        }

        // 에러 추적
        if (res.statusCode >= 400) {
          this.metrics.errorCount++;
        }
      });

      next();
    };
  }

  // 📈 응답 시간 업데이트 (Update response time)
  private updateResponseTime(duration: number) {
    this.responseTimes.push(duration);
    
    // 최근 1000개 요청만 유지
    if (this.responseTimes.length > 1000) {
      this.responseTimes.shift();
    }
    
    // 평균 응답 시간 계산
    this.metrics.averageResponseTime = 
      this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length;
  }

  // 🐌 느린 요청 추적 (Track slow requests)
  private trackSlowRequest(req: Request, duration: number) {
    this.metrics.slowRequests.unshift({
      path: req.path,
      method: req.method,
      duration,
      timestamp: new Date()
    });

    // 최대 개수 제한
    if (this.metrics.slowRequests.length > this.MAX_SLOW_REQUESTS) {
      this.metrics.slowRequests.pop();
    }

    console.warn(`⚠️ Slow request detected: ${req.method} ${req.path} (${duration}ms)`);
  }

  // 🧠 메모리 사용량 모니터링 (Memory usage monitoring)
  public startMemoryMonitoring() {
    setInterval(() => {
      const memUsage = process.memoryUsage();
      this.metrics.memoryUsage = {
        rss: Math.round(memUsage.rss / 1024 / 1024), // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        external: Math.round(memUsage.external / 1024 / 1024) // MB
      };

      // 메모리 사용량 경고
      if (this.metrics.memoryUsage.heapUsed > 500) { // 500MB 이상
        console.warn(`⚠️ High memory usage detected: ${this.metrics.memoryUsage.heapUsed}MB`);
      }
    }, 30000); // 30초마다 체크
  }

  // 📊 성능 지표 조회 (Get performance metrics)
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // 🔄 지표 초기화 (Reset metrics)
  public resetMetrics() {
    this.metrics = {
      requestCount: 0,
      averageResponseTime: 0,
      slowRequests: [],
      memoryUsage: {
        rss: 0,
        heapTotal: 0,
        heapUsed: 0,
        external: 0
      },
      errorCount: 0,
      activeConnections: 0
    };
    this.responseTimes = [];
  }

  // 📈 성능 리포트 생성 (Generate performance report)
  public generateReport(): string {
    const metrics = this.getMetrics();
    const uptime = process.uptime();
    
    return `
🚀 Performance Report
=====================
📊 Total Requests: ${metrics.requestCount}
⏱️ Average Response Time: ${metrics.averageResponseTime.toFixed(2)}ms
🔗 Active Connections: ${metrics.activeConnections}
❌ Error Count: ${metrics.errorCount}
⏰ Uptime: ${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s

🧠 Memory Usage:
- RSS: ${metrics.memoryUsage.rss}MB
- Heap Total: ${metrics.memoryUsage.heapTotal}MB
- Heap Used: ${metrics.memoryUsage.heapUsed}MB
- External: ${metrics.memoryUsage.external}MB

🐌 Slow Requests (Top 5):
${metrics.slowRequests.slice(0, 5).map(req => 
  `  ${req.method} ${req.path} - ${req.duration}ms`
).join('\n')}
`;
  }
}

// 전역 성능 모니터 인스턴스
export const performanceMonitor = new PerformanceMonitor();

// 📊 성능 지표 엔드포인트 미들웨어 (Performance metrics endpoint middleware)
export function metricsEndpoint(req: Request, res: Response) {
  const metrics = performanceMonitor.getMetrics();
  res.json({
    timestamp: new Date().toISOString(),
    ...metrics,
    uptime: process.uptime(),
    nodejs: process.version,
    platform: process.platform,
    arch: process.arch
  });
}

// 📈 성능 리포트 엔드포인트 (Performance report endpoint)
export function reportEndpoint(req: Request, res: Response) {
  const report = performanceMonitor.generateReport();
  res.set('Content-Type', 'text/plain');
  res.send(report);
}
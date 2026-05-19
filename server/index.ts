import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import {
  ensureSiteGateConfig,
  searchEngineBlockHeader,
  siteGateMiddleware,
  siteLoginHandler,
  siteLogoutHandler,
  robotsTxtHandler,
} from "./middleware/site-gate";
// Security middleware imports moved to routes.ts

const app = express();

// Security middleware moved to routes.ts for better organization

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// 🔒 Site Gate: 전체 사이트 비밀번호 보호
// fail-closed (prod에서 SITE_PASSWORD/SITE_AUTH_SECRET 미설정 시 시작 throw)
ensureSiteGateConfig();
app.use(searchEngineBlockHeader);
app.get("/robots.txt", robotsTxtHandler);
app.post("/api/site-login", siteLoginHandler);
app.post("/api/site-logout", siteLogoutHandler);
app.use(siteGateMiddleware);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Environment variable validation
  const requiredEnvVars = ['DATABASE_URL', 'SESSION_SECRET'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    process.exit(1);
  }

  const server = await registerRoutes(app);

  // 기본 에러 핸들러는 제거 (Remove basic error handler)

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // 🚫 404 에러 핸들러 추가 (Add 404 error handler after Vite setup)
  const { notFoundHandler, errorHandler } = await import("./middleware/error-handler");
  app.use(notFoundHandler);
  
  // 🚨 전역 에러 핸들러 추가 (Add global error handler after Vite setup)
  app.use(errorHandler);

  const port = Number(process.env.PORT) || 3000;
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();

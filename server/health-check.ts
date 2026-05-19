import { Express } from "express";
import { db } from "./db";

export function setupHealthCheck(app: Express) {
  // Health check endpoint for deployment monitoring
  app.get("/health", async (req, res) => {
    try {
      // Check database connection
      await db.execute("SELECT 1");
      
      const healthStatus = {
        status: "healthy",
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || "1.0.0",
        environment: process.env.NODE_ENV || "development",
        uptime: process.uptime(),
        database: "connected"
      };
      
      res.status(200).json(healthStatus);
    } catch (error) {
      const errorStatus = {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
        database: "disconnected"
      };
      
      res.status(503).json(errorStatus);
    }
  });

  // Readiness check for load balancers
  app.get("/ready", async (req, res) => {
    try {
      // Perform more comprehensive checks
      await db.execute("SELECT 1");
      
      // Check required environment variables
      const requiredVars = ['DATABASE_URL', 'SESSION_SECRET'];
      const missing = requiredVars.filter(v => !process.env[v]);
      
      if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
      }
      
      res.status(200).json({ status: "ready" });
    } catch (error) {
      res.status(503).json({ 
        status: "not ready", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
}
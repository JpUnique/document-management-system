import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "node:path";
import fs from "node:fs";

import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/auth";
import usersRoutes from "./routes/users";
import foldersRoutes from "./routes/folders";
import documentsRoutes from "./routes/documents";
import tagsRoutes from "./routes/tags";
import auditRoutes from "./routes/audit";
import sharesRoutes from "./routes/shares";

import statsRoutes from "./routes/stats";
import trashRoutes from "./routes/trash";
import versionsRoutes from "./routes/versions";
import bulkRoutes from "./routes/bulk";
import profileRoutes from "./routes/profile";

const app = express();

// Ensure upload directory exists
const uploadDir = path.resolve(env.UPLOAD.dir);
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(env.API_PREFIX, limiter);

// Health check
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    env: env.NODE_ENV,
  });
});

app.get("/", (_req, res) => {
  res.json({
    name: "DMS Backend API",
    version: "1.0.0",
    docs: "/api",
    health: "/health",
  });
});

// API routes
app.use(`${env.API_PREFIX}/auth`, authRoutes);
app.use(`${env.API_PREFIX}/users`, usersRoutes);
app.use(`${env.API_PREFIX}/folders`, foldersRoutes);
app.use(`${env.API_PREFIX}/documents`, documentsRoutes);
app.use(`${env.API_PREFIX}/documents`, versionsRoutes); // /documents/:id/versions
app.use(`${env.API_PREFIX}/tags`, tagsRoutes);
app.use(`${env.API_PREFIX}/audit`, auditRoutes);
app.use(`${env.API_PREFIX}/shares`, sharesRoutes);
app.use(`${env.API_PREFIX}/stats`, statsRoutes);
app.use(`${env.API_PREFIX}/trash`, trashRoutes);
app.use(`${env.API_PREFIX}/bulk`, bulkRoutes);
app.use(`${env.API_PREFIX}/profile`, profileRoutes);

// 404 + error handling
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`\n🚀 DMS Backend running on http://localhost:${env.PORT}`);
  console.log(`📡 API: http://localhost:${env.PORT}${env.API_PREFIX}`);
  console.log(`💚 Health: http://localhost:${env.PORT}/health`);
  console.log(`📁 Uploads: ${uploadDir}`);
  console.log(`🌍 Environment: ${env.NODE_ENV}\n`);
});

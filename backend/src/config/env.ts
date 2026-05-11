import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "4000", 10),
  API_PREFIX: process.env.API_PREFIX || "/api",

  DB: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432", 10),
    name: process.env.DB_NAME || "dms_db",
    user: process.env.DB_USER || "dms_user",
    password: process.env.DB_PASSWORD || "dms_password",
    url: process.env.DATABASE_URL || "",
  },

  JWT: {
    accessSecret:
      process.env.JWT_ACCESS_SECRET || "dev-access-secret-change-me",
    refreshSecret:
      process.env.JWT_REFRESH_SECRET || "dev-refresh-secret-change-me",
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },

  UPLOAD: {
    dir: process.env.UPLOAD_DIR || "./uploads",
    maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || "100", 10),
  },

  CORS_ORIGIN: (process.env.CORS_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((s) => s.trim()),

  ADMIN: {
    email: process.env.ADMIN_EMAIL || "admin@docmanager.com",
    password: process.env.ADMIN_PASSWORD || "PdAdmin",
    name: process.env.ADMIN_NAME || "System Administrator",
  },
};

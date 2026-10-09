import "dotenv/config";

export const env = {
  PORT: parseInt(process.env.PORT || "3099", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  DATABASE_URL: process.env.DATABASE_URL || "postgresql://postgres:123@localhost:5432/monitor_err",
  DIRECT_URL: process.env.DIRECT_URL || process.env.DATABASE_URL || "postgresql://postgres:123@localhost:5432/monitor_err",
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || "admin@widya.com",
  ADMIN_NAME: process.env.ADMIN_NAME || "Super Admin",
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "admin123",
};

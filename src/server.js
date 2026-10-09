import express from "express";
import { env } from "./config/env.js";
import db from "./config/db.js";
import { getDatabaseStatus } from "./services/dbStatusService.js";
import { executeSeed } from "./services/seedService.js";
import { executeTruncate } from "./services/truncateService.js";
import { renderDashboard } from "./views/renderDashboard.js";

const app = express();

// Parse form and JSON bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Keep latest action in memory for display
let lastActionState = null;

// Home page: SSR render
app.get("/", async (req, res) => {
  try {
    const status = await getDatabaseStatus();
    const html = renderDashboard({
      status,
      lastAction: lastActionState,
    });
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (error) {
    console.error("Error rendering dashboard:", error);
    const html = renderDashboard({
      status: { connected: false, tables: [], totalRows: 0 },
      error: error.message,
    });
    res.status(500).send(html);
  }
});

// Trigger Seed Mechanism
app.post("/seed", async (req, res) => {
  try {
    console.log("🌱 Triggering seed mechanism...");
    const seedResult = await executeSeed();
    lastActionState = {
      type: "seed",
      result: seedResult,
    };

    if (req.headers.accept?.includes("application/json")) {
      return res.json(seedResult);
    }

    const status = await getDatabaseStatus();
    const html = renderDashboard({
      status,
      lastAction: lastActionState,
    });
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (error) {
    console.error("Error executing seed:", error);
    lastActionState = {
      type: "seed",
      result: {
        success: false,
        error: error.message,
        logs: [{ text: `❌ Unhandled error: ${error.message}`, type: "error" }],
        durationSeconds: 0,
      },
    };

    if (req.headers.accept?.includes("application/json")) {
      return res.status(500).json(lastActionState.result);
    }

    const status = await getDatabaseStatus();
    const html = renderDashboard({
      status,
      lastAction: lastActionState,
      error: error.message,
    });
    res.status(500).send(html);
  }
});

// Trigger Truncate Mechanism
app.post("/truncate", async (req, res) => {
  try {
    console.log("🗑️ Triggering truncate mechanism...");
    const truncateResult = await executeTruncate();
    lastActionState = {
      type: "truncate",
      result: truncateResult,
    };

    if (req.headers.accept?.includes("application/json")) {
      return res.json(truncateResult);
    }

    const status = await getDatabaseStatus();
    const html = renderDashboard({
      status,
      lastAction: lastActionState,
    });
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (error) {
    console.error("Error executing truncate:", error);
    lastActionState = {
      type: "truncate",
      result: {
        success: false,
        error: error.message,
        logs: [{ text: `❌ Unhandled error: ${error.message}`, type: "error" }],
        durationSeconds: 0,
      },
    };

    if (req.headers.accept?.includes("application/json")) {
      return res.status(500).json(lastActionState.result);
    }

    const status = await getDatabaseStatus();
    const html = renderDashboard({
      status,
      lastAction: lastActionState,
      error: error.message,
    });
    res.status(500).send(html);
  }
});

// Health check endpoint for Docker / Container
app.get("/health", async (req, res) => {
  try {
    const status = await getDatabaseStatus();
    res.json({
      status: "ok",
      uptime: process.uptime(),
      database: {
        connected: status.connected,
        totalRows: status.totalRows,
      },
    });
  } catch (err) {
    res.status(503).json({ status: "error", message: err.message });
  }
});

// Start server
const server = app.listen(env.PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 ERAD Data Generator Service running on http://localhost:${env.PORT}`);
  console.log(`   - Environment: ${env.NODE_ENV}`);
  console.log(`   - Target DB:   ${env.DATABASE_URL.replace(/:[^:@]+@/, ":****@")}`);
  console.log(`   - Mode:        Native PostgreSQL Driver (No Prisma Generate Required)`);
  console.log(`====================================================`);
});

// Graceful shutdown
async function gracefulShutdown(signal) {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    try {
      await db.disconnect();
      console.log("Database connection pool closed. Process exited.");
      process.exit(0);
    } catch (err) {
      console.error("Error closing database connection pool:", err);
      process.exit(1);
    }
  });
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

import db from "../config/db.js";
import { env } from "../config/env.js";

export const DATABASE_TABLES = [
  { name: "users", label: "Users (Web)" },
  { name: "telegram_users", label: "Telegram Users" },
  { name: "clients", label: "Clients" },
  { name: "locations", label: "Locations" },
  { name: "components", label: "Components" },
  { name: "failure_codes", label: "Failure Codes" },
  { name: "assets", label: "Assets" },
  { name: "tickets", label: "Tickets" },
  { name: "ticket_history", label: "Ticket History" },
  { name: "ticket_assignees", label: "Ticket Assignees" },
  { name: "telegram_groups", label: "Telegram Groups" },
  { name: "export_jobs", label: "Export Jobs" },
  { name: "audit_logs", label: "Audit Logs" },
  { name: "refresh_tokens", label: "Refresh Tokens" },
  { name: "telegram_events", label: "Telegram Events" },
  { name: "bot_sessions", label: "Bot Sessions" },
];

export function maskDatabaseUrl(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname;
    const port = parsed.port || "5432";
    const database = parsed.pathname.replace(/^\//, "");
    return `postgresql://${parsed.username || "postgres"}:****@${host}:${port}/${database}`;
  } catch {
    return "postgresql://****";
  }
}

export async function getDatabaseStatus() {
  try {
    // Check connection
    await db.query("SELECT 1");

    const tableCounts = [];
    let totalRows = 0;

    for (const table of DATABASE_TABLES) {
      try {
        const countResult = await db.query(
          `SELECT COUNT(*)::int as count FROM "${table.name}"`
        );
        const count = countResult.rows[0]?.count ?? 0;
        tableCounts.push({
          name: table.name,
          label: table.label,
          count,
        });
        totalRows += count;
      } catch (err) {
        tableCounts.push({
          name: table.name,
          label: table.label,
          count: 0,
          error: err.message,
        });
      }
    }

    return {
      connected: true,
      maskedUrl: maskDatabaseUrl(env.DATABASE_URL),
      tables: tableCounts,
      totalRows,
      checkedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      connected: false,
      maskedUrl: maskDatabaseUrl(env.DATABASE_URL),
      error: error.message,
      tables: DATABASE_TABLES.map((t) => ({ name: t.name, label: t.label, count: 0 })),
      totalRows: 0,
      checkedAt: new Date().toISOString(),
    };
  }
}

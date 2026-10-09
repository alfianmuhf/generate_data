import db from "../config/db.js";

export async function executeTruncate() {
  const startTime = Date.now();
  const logs = [];

  function addLog(msg, type = "info") {
    const timestamp = new Date().toLocaleTimeString("id-ID", { hour12: false });
    const entry = `[${timestamp}] ${msg}`;
    logs.push({ text: entry, type });
    console.log(entry);
  }

  addLog("⚠️  MEMULAI TRUNCATE SEMUA TABEL DATABASE ERAD...", "warning");

  const tables = [
    "ticket_assignees",
    "ticket_history",
    "tickets",
    "telegram_groups",
    "failure_codes",
    "components",
    "assets",
    "locations",
    "clients",
    "export_jobs",
    "audit_logs",
    "refresh_tokens",
    "telegram_events",
    "bot_sessions",
    "telegram_users",
    "users",
  ];

  try {
    const truncateQuery = `TRUNCATE TABLE ${tables.map((t) => `"${t}"`).join(", ")} CASCADE;`;
    addLog(`Menjalankan query: ${truncateQuery}`, "info");

    await db.query(truncateQuery);

    addLog("✅ SELURUH TABEL BERHASIL DITRUNCATE (BERSIH TOTAL)!", "success");

    // Verifikasi jumlah row tiap tabel
    addLog("📊 Memverifikasi jumlah row seluruh tabel...", "info");
    const counts = [];
    for (const table of tables) {
      const countResult = await db.query(
        `SELECT COUNT(*)::int as count FROM "${table}"`
      );
      const count = countResult.rows[0]?.count ?? 0;
      counts.push({ name: table, count });
      addLog(`- ${table.padEnd(20)} : ${count} row`, count === 0 ? "success" : "warning");
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    addLog(`✨ Proses truncate selesai dalam ${duration} detik.`, "success");

    return {
      success: true,
      logs,
      counts,
      durationSeconds: duration,
      executedAt: new Date().toISOString(),
    };
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    addLog(`❌ Gagal melakukan truncate: ${error.message}`, "error");
    return {
      success: false,
      error: error.message,
      logs,
      durationSeconds: duration,
      executedAt: new Date().toISOString(),
    };
  }
}

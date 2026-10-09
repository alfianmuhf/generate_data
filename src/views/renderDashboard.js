/**
 * SSR HTML Renderer for ERAD Data Generator Service
 * Crisp, clean, modern white aesthetic
 */

export function renderDashboard({
  status,
  lastAction = null, // { type: 'seed' | 'truncate', result: { success, logs, durationSeconds, credentials } }
  error = null,
}) {
  const isConnected = status?.connected ?? false;
  const tables = status?.tables ?? [];
  const totalRows = status?.totalRows ?? 0;
  const maskedUrl = status?.maskedUrl ?? "postgresql://****";

  // Pre-render log rows
  const logs = lastAction?.result?.logs ?? [];
  const logHtml = logs.length > 0
    ? logs
        .map((log) => {
          let colorClass = "text-slate-600";
          let badgeClass = "bg-slate-100 text-slate-700";
          if (log.type === "success") {
            colorClass = "text-emerald-700";
            badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
          } else if (log.type === "warning") {
            colorClass = "text-amber-700";
            badgeClass = "bg-amber-50 text-amber-700 border-amber-200";
          } else if (log.type === "error") {
            colorClass = "text-rose-700";
            badgeClass = "bg-rose-50 text-rose-700 border-rose-200";
          }
          return `<div class="log-line ${colorClass}">
            <span class="log-badge ${badgeClass}">${escapeHtml(log.text)}</span>
          </div>`;
        })
        .join("\n")
    : `<div class="log-empty">Belum ada aktivitas yang dijalankan. Klik tombol <strong>Seed Database</strong> atau <strong>Truncate Database</strong> di atas.</div>`;

  // Credentials card if seeded
  const credentials = lastAction?.result?.credentials ?? [];
  const credentialsHtml =
    credentials.length > 0
      ? `
      <div class="credentials-card">
        <div class="credentials-header">
          <div class="credentials-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <span>Kredensial Pengguna Hasil Seeding</span>
          </div>
          <span class="badge-success">Siap Login</span>
        </div>
        <div class="credentials-grid">
          ${credentials
            .map(
              (c) => `
            <div class="cred-item">
              <div class="cred-role">${escapeHtml(c.role)}</div>
              <div class="cred-row">
                <span class="cred-label">Email:</span>
                <code class="cred-val">${escapeHtml(c.email)}</code>
              </div>
              <div class="cred-row">
                <span class="cred-label">Password:</span>
                <code class="cred-val">${escapeHtml(c.password)}</code>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `
      : "";

  // Action Banner if completed
  let bannerHtml = "";
  if (lastAction) {
    const isSuccess = lastAction.result?.success;
    const actionLabel = lastAction.type === "seed" ? "Seeding Database" : "Truncate Database";
    const duration = lastAction.result?.durationSeconds || "0";

    if (isSuccess) {
      bannerHtml = `
        <div class="alert alert-success animate-fade-in">
          <div class="alert-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <div class="alert-content">
            <div class="alert-title">${actionLabel} Berhasil!</div>
            <div class="alert-desc">Operasi berhasil diselesaikan dalam waktu <strong>${duration} detik</strong>. Tabel database telah diperbarui.</div>
          </div>
        </div>
      `;
    } else {
      bannerHtml = `
        <div class="alert alert-error animate-fade-in">
          <div class="alert-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e11d48" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <div class="alert-content">
            <div class="alert-title">${actionLabel} Gagal Dilakukan</div>
            <div class="alert-desc">${escapeHtml(lastAction.result?.error || "Terjadi kesalahan saat memproses query database.")}</div>
          </div>
        </div>
      `;
    }
  } else if (error) {
    bannerHtml = `
      <div class="alert alert-error animate-fade-in">
        <div class="alert-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e11d48" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <div class="alert-content">
          <div class="alert-title">Koneksi Database Bermasalah</div>
          <div class="alert-desc">${escapeHtml(error)}</div>
        </div>
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ERAD Data Generator Service</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-page: #f8fafc;
      --bg-card: #ffffff;
      --text-main: #0f172a;
      --text-muted: #64748b;
      --text-light: #94a3b8;
      --border-color: #e2e8f0;
      --border-focus: #cbd5e1;
      --primary: #2563eb;
      --primary-hover: #1d4ed8;
      --success: #059669;
      --success-hover: #047857;
      --success-light: #ecfdf5;
      --danger: #dc2626;
      --danger-hover: #b91c1c;
      --danger-light: #fef2f2;
      --font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
      --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
      --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
      --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05);
      --radius-sm: 8px;
      --radius-md: 12px;
      --radius-lg: 16px;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg-page);
      color: var(--text-main);
      font-family: var(--font-sans);
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
      padding-bottom: 60px;
    }

    /* Container */
    .container {
      max-width: 1140px;
      margin: 0 auto;
      padding: 32px 24px;
    }

    /* Header Nav */
    header {
      background: #ffffff;
      border-bottom: 1px solid var(--border-color);
      position: sticky;
      top: 0;
      z-index: 40;
    }

    .nav-inner {
      max-width: 1140px;
      margin: 0 auto;
      padding: 16px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .brand-icon {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      border: 1px solid #bfdbfe;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--primary);
      box-shadow: var(--shadow-sm);
    }

    .brand-title {
      font-size: 1.25rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: var(--text-main);
    }

    .brand-subtitle {
      font-size: 0.82rem;
      color: var(--text-muted);
      font-weight: 500;
    }

    .header-status {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .db-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 600;
      border: 1px solid var(--border-color);
      background: #ffffff;
    }

    .db-badge.connected {
      background: var(--success-light);
      border-color: #a7f3d0;
      color: #065f46;
    }

    .db-badge.disconnected {
      background: var(--danger-light);
      border-color: #fecaca;
      color: #991b1b;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: currentColor;
      box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.8);
      position: relative;
    }

    .db-badge.connected .status-dot {
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% { transform: scale(0.95); opacity: 0.8; }
      50% { transform: scale(1.2); opacity: 1; }
      100% { transform: scale(0.95); opacity: 0.8; }
    }

    /* Hero / Action Section */
    .hero-card {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 32px;
      box-shadow: var(--shadow-md);
      margin-top: 24px;
      margin-bottom: 24px;
    }

    .hero-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .hero-text h1 {
      font-size: 1.6rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: var(--text-main);
      margin-bottom: 6px;
    }

    .hero-text p {
      color: var(--text-muted);
      font-size: 0.95rem;
      max-width: 680px;
    }

    .target-db-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-family: var(--font-mono);
      font-size: 0.78rem;
      background: #f1f5f9;
      color: #334155;
      padding: 6px 12px;
      border-radius: var(--radius-sm);
      border: 1px solid #e2e8f0;
    }

    /* Actions Grid */
    .actions-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 24px;
    }

    @media (max-width: 768px) {
      .actions-grid {
        grid-template-columns: 1fr;
      }
    }

    .action-panel {
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 24px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: all 0.2s ease;
      background: #ffffff;
    }

    .action-panel.panel-seed {
      background: linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%);
      border-color: #bbf7d0;
    }

    .action-panel.panel-seed:hover {
      box-shadow: 0 8px 16px -4px rgba(5, 150, 105, 0.12);
      border-color: #86efac;
    }

    .action-panel.panel-truncate {
      background: linear-gradient(180deg, #ffffff 0%, #fff1f2 100%);
      border-color: #fecdd3;
    }

    .action-panel.panel-truncate:hover {
      box-shadow: 0 8px 16px -4px rgba(220, 38, 38, 0.12);
      border-color: #fda4af;
    }

    .panel-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }

    .panel-icon-seed {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: #dcfce7;
      color: #15803d;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.3rem;
    }

    .panel-icon-truncate {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: #fee2e2;
      color: #b91c1c;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.3rem;
    }

    .panel-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--text-main);
    }

    .panel-desc {
      font-size: 0.88rem;
      color: var(--text-muted);
      line-height: 1.45;
      margin-bottom: 20px;
    }

    .panel-features {
      list-style: none;
      margin-bottom: 24px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .panel-features li {
      font-size: 0.82rem;
      color: #475569;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .panel-features li svg {
      flex-shrink: 0;
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      font-family: var(--font-sans);
      font-size: 0.95rem;
      font-weight: 700;
      padding: 14px 24px;
      border-radius: var(--radius-md);
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      width: 100%;
      box-shadow: var(--shadow-sm);
    }

    .btn:active {
      transform: scale(0.98);
    }

    .btn-seed {
      background: #059669;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25);
    }

    .btn-seed:hover {
      background: #047857;
      box-shadow: 0 6px 16px rgba(5, 150, 105, 0.35);
    }

    .btn-truncate {
      background: #dc2626;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.25);
    }

    .btn-truncate:hover {
      background: #b91c1c;
      box-shadow: 0 6px 16px rgba(220, 38, 38, 0.35);
    }

    .btn-secondary {
      background: #f1f5f9;
      color: #334155;
      border: 1px solid #cbd5e1;
    }

    .btn-secondary:hover {
      background: #e2e8f0;
      color: #0f172a;
    }

    /* Alerts */
    .alert {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 18px 22px;
      border-radius: var(--radius-md);
      margin-bottom: 24px;
      border: 1px solid transparent;
    }

    .alert-success {
      background: #ecfdf5;
      border-color: #a7f3d0;
      color: #065f46;
    }

    .alert-error {
      background: #fff1f2;
      border-color: #fecdd3;
      color: #9f1239;
    }

    .alert-title {
      font-size: 1rem;
      font-weight: 700;
      margin-bottom: 4px;
    }

    .alert-desc {
      font-size: 0.88rem;
      opacity: 0.95;
    }

    /* Credentials Box */
    .credentials-card {
      background: #ffffff;
      border: 1px solid #bbf7d0;
      border-radius: var(--radius-md);
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: var(--shadow-sm);
    }

    .credentials-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .credentials-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 1rem;
      font-weight: 700;
      color: #065f46;
    }

    .badge-success {
      background: #dcfce7;
      color: #166534;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 9999px;
      border: 1px solid #86efac;
    }

    .credentials-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
      gap: 14px;
    }

    .cred-item {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: var(--radius-sm);
      padding: 14px;
    }

    .cred-role {
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--primary);
      margin-bottom: 8px;
    }

    .cred-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.78rem;
      margin-top: 4px;
    }

    .cred-label {
      color: var(--text-muted);
    }

    .cred-val {
      font-family: var(--font-mono);
      background: #ffffff;
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
      color: #0f172a;
      font-size: 0.76rem;
    }

    /* Table Counts Section */
    .tables-section {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 28px;
      box-shadow: var(--shadow-md);
      margin-bottom: 24px;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 12px;
    }

    .section-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--text-main);
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .stats-summary {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .stat-pill {
      font-size: 0.8rem;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: var(--radius-sm);
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #e2e8f0;
    }

    .stat-pill strong {
      color: var(--text-main);
    }

    .refresh-btn {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      padding: 6px 14px;
      border-radius: var(--radius-sm);
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: #334155;
      text-decoration: none;
      transition: all 0.2s;
    }

    .refresh-btn:hover {
      background: #f8fafc;
      border-color: #94a3b8;
    }

    .tables-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 12px;
    }

    .table-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: var(--radius-sm);
      padding: 14px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      transition: all 0.2s ease;
    }

    .table-card:hover {
      border-color: #cbd5e1;
      box-shadow: var(--shadow-sm);
    }

    .table-name-wrap {
      display: flex;
      flex-direction: column;
    }

    .table-title {
      font-size: 0.88rem;
      font-weight: 600;
      color: #1e293b;
    }

    .table-sysname {
      font-size: 0.72rem;
      font-family: var(--font-mono);
      color: #94a3b8;
    }

    .table-badge {
      font-family: var(--font-mono);
      font-size: 0.82rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 9999px;
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      color: #475569;
    }

    .table-badge.has-data {
      background: #eff6ff;
      border-color: #bfdbfe;
      color: #1d4ed8;
    }

    /* Terminal Console */
    .console-section {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 24px;
      box-shadow: var(--shadow-md);
    }

    .console-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .console-title {
      font-size: 0.98rem;
      font-weight: 700;
      color: var(--text-main);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .console-box {
      background: #0f172a;
      border-radius: var(--radius-md);
      padding: 18px 20px;
      color: #f1f5f9;
      font-family: var(--font-mono);
      font-size: 0.82rem;
      line-height: 1.6;
      max-height: 380px;
      overflow-y: auto;
      border: 1px solid #1e293b;
    }

    .console-box::-webkit-scrollbar {
      width: 8px;
    }
    .console-box::-webkit-scrollbar-thumb {
      background: #334155;
      border-radius: 4px;
    }

    .log-line {
      margin-bottom: 4px;
      word-break: break-word;
      white-space: pre-wrap;
    }

    .log-badge {
      display: inline-block;
    }

    .log-line.text-emerald-700 {
      color: #4ade80;
    }

    .log-line.text-amber-700 {
      color: #fde047;
    }

    .log-line.text-rose-700 {
      color: #fb7185;
    }

    .log-line.text-slate-600 {
      color: #94a3b8;
    }

    .log-empty {
      color: #64748b;
      font-style: italic;
    }

    /* Confirmation Modal */
    .modal-backdrop {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(15, 23, 42, 0.45);
      backdrop-filter: blur(4px);
      z-index: 100;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }

    .modal-backdrop.active {
      display: flex;
    }

    .modal-card {
      background: #ffffff;
      border-radius: var(--radius-lg);
      padding: 28px;
      max-width: 440px;
      width: 100%;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      border: 1px solid #fecdd3;
      animation: modalPop 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes modalPop {
      0% { opacity: 0; transform: scale(0.95); }
      100% { opacity: 1; transform: scale(1); }
    }

    .modal-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: #fee2e2;
      color: #b91c1c;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }

    .modal-title {
      font-size: 1.2rem;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 8px;
    }

    .modal-desc {
      font-size: 0.9rem;
      color: #64748b;
      margin-bottom: 24px;
      line-height: 1.5;
    }

    .modal-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .modal-actions .btn {
      width: auto;
      padding: 10px 18px;
      font-size: 0.88rem;
    }

    /* Loading overlay */
    #loadingOverlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(4px);
      z-index: 200;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
    }

    #loadingOverlay.active {
      display: flex;
    }

    .spinner {
      width: 44px;
      height: 44px;
      border: 4px solid #e2e8f0;
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .loading-text {
      font-size: 1rem;
      font-weight: 700;
      color: #1e293b;
    }

    .loading-sub {
      font-size: 0.85rem;
      color: #64748b;
    }

    footer {
      max-width: 1140px;
      margin: 40px auto 0;
      padding: 0 24px;
      text-align: center;
      font-size: 0.8rem;
      color: #94a3b8;
    }
  </style>
</head>
<body>

  <!-- Loading Overlay -->
  <div id="loadingOverlay">
    <div class="spinner"></div>
    <div class="loading-text" id="loadingText">Sedang Memproses...</div>
    <div class="loading-sub">Mohon tunggu, query database sedang dijalankan.</div>
  </div>

  <!-- Header Nav -->
  <header>
    <div class="nav-inner">
      <div class="brand">
        <div class="brand-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
          </svg>
        </div>
        <div>
          <div class="brand-title">ERAD Data Generator Service</div>
          <div class="brand-subtitle">Standar Seed & Truncate Microservice</div>
        </div>
      </div>

      <div class="header-status">
        <div class="db-badge ${isConnected ? "connected" : "disconnected"}">
          <span class="status-dot"></span>
          <span>${isConnected ? "PostgreSQL Terhubung" : "PostgreSQL Terputus"}</span>
        </div>
      </div>
    </div>
  </header>

  <main class="container">
    <!-- Action Banner (Alert) -->
    ${bannerHtml}

    <!-- Hero Section -->
    <div class="hero-card">
      <div class="hero-header">
        <div class="hero-text">
          <h1>Database Management Control</h1>
          <p>Layanan Server-Side Rendering (SSR) untuk mengisi data mock pengujian (Seed) atau membersihkan seluruh record (Truncate) secara aman dan instan.</p>
        </div>
        <div class="target-db-pill">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
            <path d="M2 12h20"></path>
          </svg>
          <span>${escapeHtml(maskedUrl)}</span>
        </div>
      </div>

      <!-- Action Buttons Grid -->
      <div class="actions-grid">
        <!-- 1. SEED ACTION -->
        <div class="action-panel panel-seed">
          <div>
            <div class="panel-header">
              <div class="panel-icon-seed">🌱</div>
              <div>
                <div class="panel-title">Seed Database</div>
                <div style="font-size: 0.78rem; color: #059669; font-weight: 600;">Truncate Bersih Lalu Isi Data</div>
              </div>
            </div>
            <p class="panel-desc">Otomatis mengosongkan seluruh tabel database terlebih dahulu (<strong>Truncate CASCADE</strong>), kemudian mengisinya kembali dengan data lengkap: user admin, viewer, 5 akun Telegram, master data, serta 10 tiket pengujian.</p>
            <ul class="panel-features">
              <li>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                Auto-Truncate: Database dipastikan bersih 0 row sebelum diisi
              </li>
              <li>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                4 User Web (1 Admin, 2 Coordinator, 1 Viewer) & 5 Telegram Whitelist
              </li>
              <li>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                10 Skenario Tiket Kerusakan Multi-Versi (Open, Escalated, Solved)
              </li>
            </ul>
          </div>
          <form method="POST" action="/seed" id="seedForm" onsubmit="handleFormSubmit(this, 'Mengosongkan tabel lalu mengisi data seed...')">
            <button type="submit" class="btn btn-seed" id="btnSeed">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
              <span>🌱 Jalankan Truncate & Seed Database</span>
            </button>
          </form>
        </div>

        <!-- 2. TRUNCATE ACTION -->
        <div class="action-panel panel-truncate">
          <div>
            <div class="panel-header">
              <div class="panel-icon-truncate">🗑️</div>
              <div>
                <div class="panel-title">Truncate Database</div>
                <div style="font-size: 0.78rem; color: #dc2626; font-weight: 600;">Bersihkan Seluruh Tabel</div>
              </div>
            </div>
            <p class="panel-desc">Menjalankan mekanisme <code>truncate.js</code>: mengosongkan seluruh 16 tabel database menggunakan <code>TRUNCATE ... CASCADE</code>. Sangat aman dan mengembalikan database ke kondisi bersih total.</p>
            <ul class="panel-features">
              <li>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                Menghapus semua tiket, riwayat, dan assignees
              </li>
              <li>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                Menghapus data master (clients, locations, assets, dll)
              </li>
              <li>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                Menghapus akun pengguna (users & telegram_users)
              </li>
            </ul>
          </div>
          <!-- Trigger Confirmation Modal -->
          <button type="button" class="btn btn-truncate" onclick="openTruncateModal()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            <span>🗑️ Kosongkan Seluruh Tabel (Truncate)</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Credentials Card (if available) -->
    ${credentialsHtml}

    <!-- Table Statistics Grid -->
    <div class="tables-section">
      <div class="section-header">
        <div class="section-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="3" y1="9" x2="21" y2="9"></line>
            <line x1="9" y1="21" x2="9" y2="9"></line>
          </svg>
          <span>Status Jumlah Row Tabel Database</span>
        </div>
        <div class="stats-summary">
          <div class="stat-pill">Total Tabel: <strong>${tables.length}</strong></div>
          <div class="stat-pill">Total Baris: <strong>${totalRows.toLocaleString()}</strong></div>
          <a href="/" class="refresh-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
            </svg>
            <span>Segarkan</span>
          </a>
        </div>
      </div>

      <div class="tables-grid">
        ${tables
          .map(
            (t) => `
          <div class="table-card">
            <div class="table-name-wrap">
              <span class="table-title">${escapeHtml(t.label)}</span>
              <span class="table-sysname">${escapeHtml(t.name)}</span>
            </div>
            <span class="table-badge ${t.count > 0 ? "has-data" : ""}">${t.count} row</span>
          </div>
        `
          )
          .join("")}
      </div>
    </div>

    <!-- Console Log Terminal -->
    <div class="console-section">
      <div class="console-header">
        <div class="console-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="4 17 10 11 4 5"></polyline>
            <line x1="12" y1="19" x2="20" y2="19"></line>
          </svg>
          <span>Log Output Eksekusi Terakhir</span>
        </div>
        <button class="refresh-btn" onclick="copyConsoleLogs()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          <span id="copyBtnText">Salin Log</span>
        </button>
      </div>

      <div class="console-box" id="consoleBox">
        ${logHtml}
      </div>
    </div>
  </main>

  <footer>
    ERAD (Error Report Automation Dashboard) &copy; 2026 &bull; Containerized Data Generator Microservice
  </footer>

  <!-- Modal Confirmation Truncate -->
  <div class="modal-backdrop" id="truncateModal" onclick="handleModalBackdropClick(event)">
    <div class="modal-card">
      <div class="modal-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      </div>
      <div class="modal-title">Konfirmasi Truncate Database?</div>
      <div class="modal-desc">
        Tindakan ini akan <strong>menghapus seluruh record</strong> di 16 tabel database secara permanen. Pastikan Anda benar-benar ingin membersihkan database.
      </div>
      <form method="POST" action="/truncate" id="truncateForm" onsubmit="handleFormSubmit(this, 'Menjalankan Truncate Database...')">
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" onclick="closeTruncateModal()">Batal</button>
          <button type="submit" class="btn btn-truncate" id="btnConfirmTruncate">Ya, Kosongkan Sekarang</button>
        </div>
      </form>
    </div>
  </div>

  <script>
    function openTruncateModal() {
      document.getElementById('truncateModal').classList.add('active');
    }

    function closeTruncateModal() {
      document.getElementById('truncateModal').classList.remove('active');
    }

    function handleModalBackdropClick(e) {
      if (e.target.id === 'truncateModal') {
        closeTruncateModal();
      }
    }

    function handleFormSubmit(form, loadingMessage) {
      const overlay = document.getElementById('loadingOverlay');
      const text = document.getElementById('loadingText');
      if (text) text.innerText = loadingMessage || 'Sedang Memproses...';
      if (overlay) overlay.classList.add('active');

      // Disable buttons to avoid double trigger
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.7';
      }
      return true;
    }

    function copyConsoleLogs() {
      const consoleBox = document.getElementById('consoleBox');
      const text = consoleBox.innerText;
      navigator.clipboard.writeText(text).then(() => {
        const btnText = document.getElementById('copyBtnText');
        const prev = btnText.innerText;
        btnText.innerText = 'Tersalin!';
        setTimeout(() => {
          btnText.innerText = prev;
        }, 2000);
      });
    }

    // Auto-scroll terminal to bottom if there are logs
    window.addEventListener('DOMContentLoaded', () => {
      const consoleBox = document.getElementById('consoleBox');
      if (consoleBox) {
        consoleBox.scrollTop = consoleBox.scrollHeight;
      }
    });
  </script>
</body>
</html>`;
}

function escapeHtml(str) {
  if (typeof str !== "string") return String(str ?? "");
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

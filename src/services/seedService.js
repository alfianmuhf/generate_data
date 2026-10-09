import bcrypt from "bcryptjs";
import db from "../config/db.js";
import { env } from "../config/env.js";

export async function executeSeed() {
  const startTime = Date.now();
  const logs = [];

  function addLog(msg, type = "info") {
    const timestamp = new Date().toLocaleTimeString("id-ID", { hour12: false });
    const entry = `[${timestamp}] ${msg}`;
    logs.push({ text: entry, type });
    console.log(entry);
  }

  const saltRounds = 10;
  const adminPassword = env.ADMIN_PASSWORD || "admin123";

  addLog("==================================================", "info");
  addLog("🌱 MEMULAI SEEDING DATABASE ERAD...", "info");
  addLog("==================================================", "info");

  try {
    // =========================================================================
    // 0. AUTO TRUNCATE SEMUA TABEL SEBELUM SEEDING
    // =========================================================================
    addLog("🧹 [1/5] Mengosongkan seluruh tabel (Truncate CASCADE) terlebih dahulu...", "warning");
    const tablesToTruncate = [
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
    const truncateQuery = `TRUNCATE TABLE ${tablesToTruncate.map((t) => `"${t}"`).join(", ")} CASCADE;`;
    await db.query(truncateQuery);
    addLog("   ✓ Seluruh tabel berhasil dikosongkan (Database bersih total)", "success");

    // =========================================================================
    // 1. SEED USERS (1 Admin [active] + 3 Coordinator/Viewer [invited])
    // =========================================================================
    addLog("\n👤 [2/5] Seeding Users...", "info");

    const usersToSeed = [
      {
        email: env.ADMIN_EMAIL || "admin@widya.com",
        name: env.ADMIN_NAME || "Super Admin",
        role: "admin",
        division: "none",
        status: "active",
        must_change_password: false,
        rawPassword: adminPassword,
      },
      {
        email: "bruno@erad.id",
        name: "Bruno Aftersales",
        role: "coordinator",
        division: "after_sales",
        status: "invited",
        must_change_password: true,
        rawPassword: "bruno12345",
      },
      {
        email: "siti@erad.id",
        name: "Siti Software Leader",
        role: "coordinator",
        division: "software",
        status: "invited",
        must_change_password: true,
        rawPassword: "siti12345",
      },
      {
        email: "dimas@erad.id",
        name: "Dimas Software Viewer",
        role: "viewer",
        division: "software",
        status: "invited",
        must_change_password: true,
        rawPassword: "dimas12345",
      },
    ];

    const seededUsers = [];
    for (const u of usersToSeed) {
      const passwordHash = await bcrypt.hash(u.rawPassword, saltRounds);

      const userRes = await db.query(
        `INSERT INTO "users" (
          email, name, role, division, status, password_hash, must_change_password, failed_login_attempts
        ) VALUES (
          $1, $2, $3::user_role, $4::division, $5::user_status, $6, $7, 0
        )
        ON CONFLICT (email) DO UPDATE SET
          name = EXCLUDED.name,
          role = EXCLUDED.role,
          division = EXCLUDED.division,
          status = EXCLUDED.status,
          password_hash = EXCLUDED.password_hash,
          must_change_password = EXCLUDED.must_change_password,
          failed_login_attempts = 0,
          locked_until = NULL
        RETURNING *;`,
        [u.email, u.name, u.role, u.division, u.status, passwordHash, u.must_change_password]
      );

      const userRecord = userRes.rows[0];
      seededUsers.push({ ...userRecord, rawPassword: u.rawPassword });
      addLog(
        `   ✓ [${userRecord.role.toUpperCase()}] ${userRecord.name} (${userRecord.email}) - status: ${userRecord.status}`,
        "success"
      );
    }

    // =========================================================================
    // 2. SEED TELEGRAM USERS (5 Akun [status active])
    // =========================================================================
    addLog("\n📱 [3/5] Seeding Telegram Whitelist Users (5 akun active)...", "info");

    const telegramUsersToSeed = [
      {
        telegram_id: "682910291",
        username: "agus_santoso",
        full_name: "Agus Santoso",
        division: "after_sales",
        is_active: true,
      },
      {
        telegram_id: "719283741",
        username: "budi_pratama",
        full_name: "Budi Pratama",
        division: "after_sales",
        is_active: true,
      },
      {
        telegram_id: "829104829",
        username: "citra_dewi",
        full_name: "Citra Dewi",
        division: "software",
        is_active: true,
      },
      {
        telegram_id: "918273645",
        username: "doni_kurniawan",
        full_name: "Doni Kurniawan",
        division: "software",
        is_active: true,
      },
      {
        telegram_id: "564738291",
        username: "eko_prasetyo",
        full_name: "Eko Prasetyo",
        division: "none",
        is_active: true,
      },
    ];

    for (const tg of telegramUsersToSeed) {
      const tgRes = await db.query(
        `INSERT INTO "telegram_users" (
          telegram_id, username, full_name, division, is_active
        ) VALUES (
          $1, $2, $3, $4::division, $5
        )
        ON CONFLICT (telegram_id) DO UPDATE SET
          username = EXCLUDED.username,
          full_name = EXCLUDED.full_name,
          division = EXCLUDED.division,
          is_active = EXCLUDED.is_active
        RETURNING *;`,
        [tg.telegram_id, tg.username, tg.full_name, tg.division, tg.is_active]
      );
      const tgRecord = tgRes.rows[0];
      addLog(
        `   ✓ [@${tgRecord.username}] ${tgRecord.full_name} (ID: ${tgRecord.telegram_id}) - status: active`,
        "success"
      );
    }

    // =========================================================================
    // 3. SEED MASTER DATA (Masing-masing menu isi 5 data)
    // =========================================================================
    addLog("\n📦 [4/5] Seeding Master Data (5 data per menu)...", "info");

    // A. Master Client (5 data)
    addLog("   --- Menu 1: Clients (5 data) ---", "info");
    const clientsData = [
      { name: "PT Vale Indonesia", is_active: true },
      { name: "PT Freeport Indonesia", is_active: true },
      { name: "PT Bukit Asam Tbk", is_active: true },
      { name: "PT Adaro Energy Tbk", is_active: true },
      { name: "PT Berau Coal", is_active: true },
    ];

    const clientMap = new Map();
    for (const c of clientsData) {
      const res = await db.query(
        `INSERT INTO "clients" (name, is_active)
         VALUES ($1, $2)
         ON CONFLICT (name) DO UPDATE SET is_active = EXCLUDED.is_active
         RETURNING *;`,
        [c.name, c.is_active]
      );
      const record = res.rows[0];
      clientMap.set(c.name, record);
      addLog(`      ✓ Client: ${record.name}`, "success");
    }

    // B. Master Lokasi (5 data)
    addLog("   --- Menu 2: Lokasi (5 data) ---", "info");
    const locationsData = [
      { name: "Sorowako Site (Sulawesi Selatan)", is_active: true },
      { name: "Grasberg Mine (Papua Tengah)", is_active: true },
      { name: "Tanjung Enim Mine (Sumatera Selatan)", is_active: true },
      { name: "Tabang Coal Mine (Kalimantan Timur)", is_active: true },
      { name: "Lati Mine Operation (Kalimantan Timur)", is_active: true },
    ];

    const locationMap = new Map();
    for (const loc of locationsData) {
      const res = await db.query(
        `INSERT INTO "locations" (name, is_active)
         VALUES ($1, $2)
         ON CONFLICT (name) DO UPDATE SET is_active = EXCLUDED.is_active
         RETURNING *;`,
        [loc.name, loc.is_active]
      );
      const record = res.rows[0];
      locationMap.set(loc.name, record);
      addLog(`      ✓ Lokasi: ${record.name}`, "success");
    }

    // C. Master Komponen (5 data)
    addLog("   --- Menu 3: Komponen (5 data) ---", "info");
    const componentsData = [
      { prefix: "LDR", name: "LiDAR Sensor Module", sort_order: 1, is_active: true },
      { prefix: "CAM", name: "Optical High-Res Camera", sort_order: 2, is_active: true },
      { prefix: "PWR", name: "Power Management & Battery", sort_order: 3, is_active: true },
      { prefix: "CMP", name: "Industrial PC & Computing Unit", sort_order: 4, is_active: true },
      { prefix: "NET", name: "Telemetry & 4G/5G Gateway", sort_order: 5, is_active: true },
    ];

    const componentMap = new Map();
    for (const comp of componentsData) {
      const res = await db.query(
        `INSERT INTO "components" (prefix, name, sort_order, is_active)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (prefix) DO UPDATE SET
           name = EXCLUDED.name,
           sort_order = EXCLUDED.sort_order,
           is_active = EXCLUDED.is_active
         RETURNING *;`,
        [comp.prefix, comp.name, comp.sort_order, comp.is_active]
      );
      const record = res.rows[0];
      componentMap.set(comp.prefix, record);
      addLog(`      ✓ Komponen: [${record.prefix}] ${record.name}`, "success");
    }

    // D. Master Failure Code (5 data)
    addLog("   --- Menu 4: Failure Code (5 data) ---", "info");
    const failureCodesData = [
      {
        componentPrefix: "LDR",
        code: "LDR-01",
        name: "Point Cloud Dropout",
        description: "Kehilangan pantulan laser atau densitas point cloud di bawah ambang batas toleransi",
        is_active: true,
      },
      {
        componentPrefix: "CAM",
        code: "CAM-01",
        name: "Sensor Exposure Glitch",
        description: "Gambar visual overexposed atau mengalami noise artefak saat proses pemindaian",
        is_active: true,
      },
      {
        componentPrefix: "PWR",
        code: "PWR-01",
        name: "Battery Voltage Sag",
        description: "Penurunan tegangan mendadak di bawah 22V saat prosesor computing aktif penuh",
        is_active: true,
      },
      {
        componentPrefix: "CMP",
        code: "CMP-01",
        name: "CPU Thermal Throttle",
        description: "Temperatur prosesor IPC melebihi 85°C sehingga pemrosesan frame tertunda",
        is_active: true,
      },
      {
        componentPrefix: "NET",
        code: "NET-01",
        name: "Cellular Packet Loss",
        description: "Koneksi gateway telemetri tidak stabil dan tingkat packet loss > 15%",
        is_active: true,
      },
    ];

    for (const fc of failureCodesData) {
      const parentComp = componentMap.get(fc.componentPrefix);
      if (!parentComp) continue;

      const res = await db.query(
        `INSERT INTO "failure_codes" (component_id, code, name, description, is_active)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (component_id, code) DO UPDATE SET
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           is_active = EXCLUDED.is_active
         RETURNING *;`,
        [parentComp.id, fc.code, fc.name, fc.description, fc.is_active]
      );
      const record = res.rows[0];
      addLog(`      ✓ Failure Code: [${record.code}] ${record.name} (${fc.componentPrefix})`, "success");
    }

    // E. Master Asset (Unit Load Scanner - 5 data)
    addLog("   --- Menu 5: Unit Load Scanner / Asset (5 data) ---", "info");
    const assetsData = [
      {
        unit_code: "WLS-001",
        asset_type: "portable",
        clientName: "PT Vale Indonesia",
        locationName: "Sorowako Site (Sulawesi Selatan)",
        status: "active",
        commissioning_date: "2024-01-15",
        is_active: true,
      },
      {
        unit_code: "WLS-002",
        asset_type: "static",
        clientName: "PT Freeport Indonesia",
        locationName: "Grasberg Mine (Papua Tengah)",
        status: "active",
        commissioning_date: "2024-03-20",
        is_active: true,
      },
      {
        unit_code: "WLS-003",
        asset_type: "portable",
        clientName: "PT Bukit Asam Tbk",
        locationName: "Tanjung Enim Mine (Sumatera Selatan)",
        status: "maintenance",
        commissioning_date: "2024-05-10",
        is_active: true,
      },
      {
        unit_code: "WLS-004",
        asset_type: "static",
        clientName: "PT Adaro Energy Tbk",
        locationName: "Tabang Coal Mine (Kalimantan Timur)",
        status: "active",
        commissioning_date: "2024-07-01",
        is_active: true,
      },
      {
        unit_code: "WLS-005",
        asset_type: "portable",
        clientName: "PT Berau Coal",
        locationName: "Lati Mine Operation (Kalimantan Timur)",
        status: "retired",
        commissioning_date: "2023-11-12",
        is_active: true,
      },
    ];

    for (const ast of assetsData) {
      const client = clientMap.get(ast.clientName);
      const location = locationMap.get(ast.locationName);
      if (!client || !location) continue;

      const res = await db.query(
        `INSERT INTO "assets" (
          unit_code, asset_type, client_id, location_id, status, commissioning_date, is_active
        ) VALUES (
          $1, $2::asset_type, $3, $4, $5::asset_status, $6, $7
        )
        ON CONFLICT (unit_code) DO UPDATE SET
          asset_type = EXCLUDED.asset_type,
          client_id = EXCLUDED.client_id,
          location_id = EXCLUDED.location_id,
          status = EXCLUDED.status,
          commissioning_date = EXCLUDED.commissioning_date,
          is_active = EXCLUDED.is_active
        RETURNING *;`,
        [ast.unit_code, ast.asset_type, client.id, location.id, ast.status, ast.commissioning_date, ast.is_active]
      );
      const record = res.rows[0];
      addLog(
        `      ✓ Asset: ${record.unit_code} (${record.asset_type}) - ${ast.clientName} - status: ${record.status}`,
        "success"
      );
    }

    // Map asset & failure code
    const assetMap = new Map();
    const allAssetsRes = await db.query(`SELECT * FROM "assets"`);
    for (const a of allAssetsRes.rows) assetMap.set(a.unit_code, a);

    const failureCodeMap = new Map();
    const allFailuresRes = await db.query(`SELECT * FROM "failure_codes"`);
    for (const f of allFailuresRes.rows) failureCodeMap.set(f.code, f);

    // Map akun Web (Users)
    const userByEmail = new Map();
    const allUsersRes = await db.query(`SELECT * FROM "users"`);
    for (const u of allUsersRes.rows) userByEmail.set(u.email, u);

    const brunoUser = userByEmail.get("bruno@erad.id");
    const sitiUser = userByEmail.get("siti@erad.id");
    const dimasUser = userByEmail.get("dimas@erad.id");

    // Map akun Telegram
    const telegramByUsername = new Map();
    const allTeleUsersRes = await db.query(`SELECT * FROM "telegram_users"`);
    for (const tu of allTeleUsersRes.rows) telegramByUsername.set(tu.username, tu);

    const agusTele = telegramByUsername.get("agus_santoso");
    const budiTele = telegramByUsername.get("budi_pratama");
    const citraTele = telegramByUsername.get("citra_dewi");

    // =========================================================================
    // 4. SEED TICKETS (10 Tiket Beragam: Open dari Tele, History Campur Web & Tele)
    // =========================================================================
    addLog("\n🎫 [5/5] Seeding 10 Tickets (Open via Telegram, History Campur Web & Tele)...", "info");

    const ticketsDefinition = [
      {
        id: "ERR-20261009-0001",
        unitCode: "WLS-001",
        failureCode: "LDR-01",
        severity: "sedang",
        history: [
          {
            version: 0,
            status: "open",
            severity: "sedang",
            telegramUser: agusTele,
            action: "Tiket dilaporkan via Telegram Bot",
            notes: "Laporan otomatis dari bot Telegram teknisi lapangan",
            damageDescription: "Sensor LiDAR mengalami dropout titik point cloud saat dump truck melintas dengan kecepatan 15 km/jam.",
            actionTaken: "Pengecekan fisik konektor kabel M12 dan pembersihan lensa.",
            rootCause: null,
            changedAt: new Date(Date.now() - 3600000 * 24),
          },
        ],
      },
      {
        id: "ERR-20261009-0002",
        unitCode: "WLS-002",
        failureCode: "PWR-01",
        severity: "tinggi",
        history: [
          {
            version: 0,
            status: "open",
            severity: "tinggi",
            telegramUser: budiTele,
            action: "Tiket dilaporkan via Telegram Bot",
            notes: "Laporan anomali daya baterai dari bot Telegram",
            damageDescription: "Tegangan suplai baterai turun drastis ke 20.8V saat IPC dan LiDAR bekerja bersamaan.",
            actionTaken: "Pengukuran resistansi internal cell baterai cadangan.",
            rootCause: null,
            changedAt: new Date(Date.now() - 3600000 * 20),
          },
          {
            version: 1,
            status: "solved",
            severity: "tinggi",
            user: brunoUser,
            action: "Diselesaikan via Web Dashboard oleh Tim Aftersales: Penggantian modul regulator DC-DC step-down.",
            notes: "Diselesaikan via Web Dashboard oleh Tim Aftersales: Penggantian modul regulator DC-DC step-down.",
            damageDescription: "Tegangan suplai baterai drop.",
            actionTaken: "Penggantian modul regulator DC-DC step-down dan kalibrasi tegangan output stabil 24.0V.",
            rootCause: "Kapasitor filtering pada modul regulator DC-DC mengalami degradasi panas",
            changedAt: new Date(Date.now() - 3600000 * 2),
          },
        ],
      },
      {
        id: "ERR-20261009-0003",
        unitCode: "WLS-003",
        failureCode: "CAM-01",
        severity: "rendah",
        history: [
          {
            version: 0,
            status: "open",
            severity: "rendah",
            telegramUser: agusTele,
            action: "Tiket dilaporkan via Telegram Bot",
            notes: "Hasil capture kamera kanan overexposure pada siang hari terik.",
            damageDescription: "Kamera kanan overexposure saat terkena pantulan sinar matahari langsung.",
            actionTaken: null,
            rootCause: null,
            changedAt: new Date(Date.now() - 3600000 * 18),
          },
          {
            version: 1,
            status: "open",
            severity: "rendah",
            telegramUser: budiTele,
            action: "Update catatan lapangan via Telegram Bot",
            notes: "Pembersihan filter polarisasi lensa dan penyesuaian sudut hood kamera di lokasi.",
            damageDescription: "Kamera kanan overexposure saat siang terik.",
            actionTaken: "Filter polarisasi dipasang ulang dan penyesuaian sudut hood.",
            rootCause: "Pantulan cahaya matahari tanpa filter penahan",
            changedAt: new Date(Date.now() - 3600000 * 10),
          },
        ],
      },
      {
        id: "ERR-20261009-0004",
        unitCode: "WLS-004",
        failureCode: "CMP-01",
        severity: "sedang",
        history: [
          {
            version: 0,
            status: "open",
            severity: "sedang",
            telegramUser: budiTele,
            action: "Tiket dilaporkan via Telegram Bot",
            notes: "Suhu prosesor IPC mencapai 88°C dan frekuensi clock tertahan.",
            damageDescription: "Suhu prosesor IPC melebihi 85°C dan menyebabkan delay pemrosesan.",
            actionTaken: null,
            rootCause: null,
            changedAt: new Date(Date.now() - 3600000 * 16),
          },
          {
            version: 1,
            status: "open",
            severity: "sedang",
            user: brunoUser,
            action: "Instruksi pembersihan dan penggantian pasta thermal diinput via Web Dashboard.",
            notes: "Pembersihan sirip heatsink dan penggantian pasta thermal prosesor.",
            damageDescription: "Suhu prosesor IPC panas saat siang hari.",
            actionTaken: "Pembersihan debu blower dan re-paste thermal paste Arctic MX-4.",
            rootCause: "Sirkulasi udara terhambat debu halus tambang",
            changedAt: new Date(Date.now() - 3600000 * 8),
          },
        ],
      },
      {
        id: "ERR-20261009-0005",
        unitCode: "WLS-001",
        failureCode: "NET-01",
        severity: "tinggi",
        assignees: [
          { user: sitiUser, isLeader: true },
          { user: dimasUser, isLeader: false },
        ],
        history: [
          {
            version: 0,
            status: "open",
            severity: "tinggi",
            telegramUser: agusTele,
            action: "Tiket dilaporkan via Telegram Bot",
            notes: "Koneksi gateway telemetri 4G sering putus saat upload point cloud besar.",
            damageDescription: "Koneksi gateway telemetri 4G sering putus dan packet loss mencapai 22%.",
            actionTaken: "Pengecekan kabel antena eksternal normal.",
            rootCause: null,
            changedAt: new Date(Date.now() - 3600000 * 28),
          },
          {
            version: 1,
            status: "escalated",
            severity: "tinggi",
            user: brunoUser,
            action: "Dieskalasi ke tim Software via Web Dashboard karena indikasi queue socket crash.",
            notes: "Dieskalasi ke tim Software via Web Dashboard karena indikasi queue socket crash.",
            damageDescription: "Koneksi gateway telemetri sering putus.",
            actionTaken: "Eskalasi ke tim software.",
            rootCause: null,
            changedAt: new Date(Date.now() - 3600000 * 22),
          },
          {
            version: 2,
            status: "escalated",
            severity: "tinggi",
            user: sitiUser,
            action: "Tiket diklaim oleh Siti Software Leader di Web Dashboard. Memulai analisis crash dump.",
            notes: "Tiket diklaim oleh Siti Software Leader di Web Dashboard. Memulai analisis crash dump.",
            damageDescription: "Koneksi gateway telemetri sering putus.",
            actionTaken: "Ekstraksi log syslog dan profiling queue buffer.",
            rootCause: "Memory leak pada thread uploader telemetri",
            changedAt: new Date(Date.now() - 3600000 * 5),
          },
        ],
      },
      {
        id: "ERR-20261009-0006",
        unitCode: "WLS-002",
        failureCode: "LDR-01",
        severity: "tinggi",
        assignees: [
          { user: sitiUser, isLeader: true },
        ],
        history: [
          {
            version: 0,
            status: "open",
            severity: "tinggi",
            telegramUser: budiTele,
            action: "Tiket dilaporkan via Telegram Bot",
            notes: "Stream point cloud berhenti tiba-tiba setelah 2 jam operasi.",
            damageDescription: "Stream point cloud berhenti tiba-tiba setelah 2 jam operasi.",
            actionTaken: "Reboot unit, kendala berulang.",
            rootCause: null,
            changedAt: new Date(Date.now() - 3600000 * 15),
          },
          {
            version: 1,
            status: "escalated",
            severity: "tinggi",
            telegramUser: agusTele,
            action: "Eskalasi dikirim via Telegram Bot: driver LiDAR segfault di Linux kernel log.",
            notes: "Eskalasi dikirim via Telegram Bot: driver LiDAR segfault di Linux kernel log.",
            damageDescription: "Driver LiDAR segfault.",
            actionTaken: "Eskalasi ke software via bot Telegram.",
            rootCause: null,
            changedAt: new Date(Date.now() - 3600000 * 10),
          },
          {
            version: 2,
            status: "escalated",
            severity: "tinggi",
            user: sitiUser,
            action: "Tiket diklaim oleh Siti Software Leader di Web Dashboard. Menyiapkan modul kernel v2.1.",
            notes: "Tiket diklaim oleh Siti Software Leader di Web Dashboard. Menyiapkan modul kernel v2.1.",
            damageDescription: "Driver LiDAR segfault.",
            actionTaken: "Penyusunan patch kernel driver.",
            rootCause: "Inkompatibilitas buffer size driver dengan firmware versi 3.8",
            changedAt: new Date(Date.now() - 3600000 * 3),
          },
        ],
      },
      {
        id: "ERR-20261009-0007",
        unitCode: "WLS-005",
        failureCode: "CAM-01",
        severity: "sedang",
        assignees: [],
        history: [
          {
            version: 0,
            status: "open",
            severity: "sedang",
            telegramUser: agusTele,
            action: "Tiket dilaporkan via Telegram Bot",
            notes: "Frame rate kamera turun drastis saat kondisi mendung berawan.",
            damageDescription: "Frame rate kamera turun drastis saat kondisi mendung berawan.",
            actionTaken: "Kabel gigabit dan port switch diperiksa dalam kondisi baik.",
            rootCause: null,
            changedAt: new Date(Date.now() - 3600000 * 12),
          },
          {
            version: 1,
            status: "escalated",
            severity: "sedang",
            telegramUser: budiTele,
            action: "Dieskalasi via Telegram Bot untuk kalibrasi algoritma auto-exposure ISP.",
            notes: "Dieskalasi via Telegram Bot untuk kalibrasi algoritma auto-exposure ISP.",
            damageDescription: "Frame rate kamera drop saat cuaca mendung.",
            actionTaken: "Eskalasi ke tim Software (menunggu klaim).",
            rootCause: null,
            changedAt: new Date(Date.now() - 3600000 * 6),
          },
        ],
      },
      {
        id: "ERR-20261009-0008",
        unitCode: "WLS-003",
        failureCode: "PWR-01",
        severity: "rendah",
        history: [
          {
            version: 0,
            status: "open",
            severity: "rendah",
            telegramUser: budiTele,
            action: "Tiket dilaporkan via Telegram Bot",
            notes: "Konektor power supply 24V longgar akibat getaran lintasan truk.",
            damageDescription: "Konektor power supply 24V longgar akibat getaran lintasan truk.",
            actionTaken: "Pemeriksaan konektor fisik terminal.",
            rootCause: null,
            changedAt: new Date(Date.now() - 3600000 * 48),
          },
          {
            version: 1,
            status: "solved",
            severity: "rendah",
            telegramUser: budiTele,
            action: "Penyelesaian dikonfirmasi via Telegram Bot: konektor diganti screw-lock dan tegangan normal 24.1V.",
            notes: "Penyelesaian dikonfirmasi via Telegram Bot: konektor diganti screw-lock dan tegangan normal 24.1V.",
            damageDescription: "Konektor kendor.",
            actionTaken: "Penggantian konektor screw-lock dan pengencangan baut braket.",
            rootCause: "Konektor tipe clip plastik longgar karena vibrasi tinggi",
            changedAt: new Date(Date.now() - 3600000 * 36),
          },
        ],
      },
      {
        id: "ERR-20261009-0009",
        unitCode: "WLS-004",
        failureCode: "CMP-01",
        severity: "tinggi",
        assignees: [
          { user: sitiUser, isLeader: true },
          { user: dimasUser, isLeader: false },
        ],
        history: [
          {
            version: 0,
            status: "open",
            severity: "tinggi",
            telegramUser: agusTele,
            action: "Tiket dilaporkan via Telegram Bot",
            notes: "Layanan kalkulasi volume muatan crash saat memindai truk bertonase panjang.",
            damageDescription: "Layanan kalkulasi volume muatan crash saat memindai truk tronton ekstra panjang.",
            actionTaken: "Restart service manual di site.",
            rootCause: null,
            changedAt: new Date(Date.now() - 3600000 * 72),
          },
          {
            version: 1,
            status: "escalated",
            severity: "tinggi",
            user: brunoUser,
            action: "Dieskalasi ke tim Software via Web Dashboard karena exception index out of bounds.",
            notes: "Dieskalasi ke tim Software via Web Dashboard karena exception index out of bounds.",
            damageDescription: "Crash algoritma volume.",
            actionTaken: "Eskalasi ke tim software.",
            rootCause: null,
            changedAt: new Date(Date.now() - 3600000 * 60),
          },
          {
            version: 2,
            status: "escalated",
            severity: "tinggi",
            user: sitiUser,
            action: "Siti Software Leader klaim & unggah hotfix-volume-bounds via Web Dashboard.",
            notes: "Siti Software Leader klaim & unggah hotfix-volume-bounds via Web Dashboard.",
            damageDescription: "Crash algoritma volume.",
            actionTaken: "Debugging dan fix array boundary check.",
            rootCause: "Array boundary check melebihi alokasi memori buffer 3D",
            changedAt: new Date(Date.now() - 3600000 * 40),
          },
          {
            version: 3,
            status: "solved",
            severity: "tinggi",
            user: sitiUser,
            action: "Patch v1.4.2 di-deploy via Web. Pengujian 50 pemindaian truk sukses tanpa crash.",
            notes: "Patch v1.4.2 di-deploy via Web. Pengujian 50 pemindaian truk sukses tanpa crash.",
            damageDescription: "Crash algoritma volume.",
            actionTaken: "Deploy binary patch dan validasi real test.",
            rootCause: "Index out of bounds pada array voxel grid",
            changedAt: new Date(Date.now() - 3600000 * 12),
          },
        ],
      },
      {
        id: "ERR-20261009-0010",
        unitCode: "WLS-001",
        failureCode: "NET-01",
        severity: "sedang",
        assignees: [
          { telegramUser: citraTele, isLeader: true },
        ],
        history: [
          {
            version: 0,
            status: "open",
            severity: "sedang",
            telegramUser: budiTele,
            action: "Tiket dilaporkan via Telegram Bot",
            notes: "Koneksi VPN tunnel putus secara periodik setiap 15 menit.",
            damageDescription: "Koneksi VPN tunnel putus secara periodik setiap 15 menit.",
            actionTaken: "Restart router gateway 4G.",
            rootCause: null,
            changedAt: new Date(Date.now() - 3600000 * 50),
          },
          {
            version: 1,
            status: "escalated",
            severity: "sedang",
            user: brunoUser,
            action: "Dieskalasi ke tim Software via Web Dashboard untuk tuning VPN keepalive.",
            notes: "Dieskalasi ke tim Software via Web Dashboard untuk tuning VPN keepalive.",
            damageDescription: "Koneksi VPN putus periodik.",
            actionTaken: "Eskalasi ke software.",
            rootCause: null,
            changedAt: new Date(Date.now() - 3600000 * 30),
          },
          {
            version: 2,
            status: "solved",
            severity: "sedang",
            telegramUser: citraTele,
            action: "Penyelesaian diselesaikan via Telegram Bot: Citra Dewi kirim remote config keepalive 25s dan MTU 1420.",
            notes: "Penyelesaian diselesaikan via Telegram Bot: Citra Dewi kirim remote config keepalive 25s dan MTU 1420.",
            damageDescription: "Koneksi VPN putus periodik.",
            actionTaken: "Update konfigurasi keepalive interval dan persistensi route remote via bot.",
            rootCause: "NAT timeout pada provider seluler menutup koneksi sebelum keepalive",
            changedAt: new Date(Date.now() - 3600000 * 4),
          },
        ],
      },
    ];

    for (const td of ticketsDefinition) {
      const asset = assetMap.get(td.unitCode);
      const failureCode = failureCodeMap.get(td.failureCode);
      if (!asset || !failureCode) continue;

      const latestHistory = td.history[td.history.length - 1];
      const initialHistory = td.history[0];

      // Upsert ticket
      const ticketRes = await db.query(
        `INSERT INTO "tickets" (
          id, asset_id, failure_code_id, current_version, created_at
        ) VALUES (
          $1, $2, $3, $4, $5
        )
        ON CONFLICT (id) DO UPDATE SET
          asset_id = EXCLUDED.asset_id,
          failure_code_id = EXCLUDED.failure_code_id,
          current_version = EXCLUDED.current_version,
          created_at = EXCLUDED.created_at
        RETURNING *;`,
        [td.id, asset.id, failureCode.id, latestHistory.version, initialHistory.changedAt]
      );
      const ticketRecord = ticketRes.rows[0];

      // Delete existing history
      await db.query(`DELETE FROM "ticket_history" WHERE ticket_id = $1`, [td.id]);

      // Insert history versions
      for (const h of td.history) {
        await db.query(
          `INSERT INTO "ticket_history" (
            ticket_id, version, status, damage_description, action_taken, root_cause, severity, notes,
            changed_by_user_id, changed_by_telegram_user_id, changed_at
          ) VALUES (
            $1, $2, $3::ticket_status, $4, $5, $6, $7::severity, $8, $9, $10, $11
          );`,
          [
            td.id,
            h.version,
            h.status,
            h.damageDescription,
            h.actionTaken,
            h.rootCause,
            h.severity,
            h.notes,
            h.user ? h.user.id : null,
            h.telegramUser ? h.telegramUser.id : null,
            h.changedAt,
          ]
        );
      }

      // Delete existing assignees
      await db.query(`DELETE FROM "ticket_assignees" WHERE ticket_id = $1`, [td.id]);

      let leaderAssigneeId = null;
      if (td.assignees && td.assignees.length > 0) {
        for (const a of td.assignees) {
          const assigneeRes = await db.query(
            `INSERT INTO "ticket_assignees" (
              ticket_id, user_id, telegram_user_id
            ) VALUES (
              $1, $2, $3
            )
            RETURNING id;`,
            [
              td.id,
              a.user ? a.user.id : null,
              a.telegramUser ? a.telegramUser.id : null,
            ]
          );
          if (a.isLeader) {
            leaderAssigneeId = assigneeRes.rows[0].id;
          }
        }

        if (leaderAssigneeId) {
          await db.query(
            `UPDATE "tickets" SET leader_assignee_id = $1 WHERE id = $2`,
            [leaderAssigneeId, td.id]
          );
        }
      }

      addLog(
        `      ✓ Tiket ${ticketRecord.id} [${latestHistory.status.toUpperCase()}] v${latestHistory.version} (${td.unitCode} - ${td.failureCode})`,
        "success"
      );
    }

    // =========================================================================
    // 5. RINGKASAN KREDENSIAL LOGIN
    // =========================================================================
    addLog("\n==================================================", "info");
    addLog("🎉 SEEDING SELESAI DENGAN SUKSES!", "success");
    addLog("==================================================", "info");
    addLog("🔑 KREDENSIAL PENGGUNA UNTUK LOGIN & PENGUJIAN:", "info");
    addLog("--------------------------------------------------", "info");
    addLog(`1. Admin (Active)        : ${seededUsers[0].email} / ${seededUsers[0].rawPassword}`, "info");
    addLog(`2. Coordinator (Invited) : ${seededUsers[1].email} / ${seededUsers[1].rawPassword}`, "info");
    addLog(`3. Coordinator (Invited) : ${seededUsers[2].email} / ${seededUsers[2].rawPassword}`, "info");
    addLog(`4. Viewer (Invited)      : ${seededUsers[3].email} / ${seededUsers[3].rawPassword}`, "info");
    addLog("--------------------------------------------------", "info");
    addLog("ℹ️  User berstatus 'invited' otomatis memicu form paksa ganti password saat login.", "info");
    addLog("==================================================\n", "info");

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    addLog(`✨ Proses seed selesai dalam ${duration} detik.`, "success");

    const credentials = [
      { role: "Admin (Active)", email: seededUsers[0].email, password: seededUsers[0].rawPassword },
      { role: "Coordinator (Invited)", email: seededUsers[1].email, password: seededUsers[1].rawPassword },
      { role: "Coordinator (Invited)", email: seededUsers[2].email, password: seededUsers[2].rawPassword },
      { role: "Viewer (Invited)", email: seededUsers[3].email, password: seededUsers[3].rawPassword },
    ];

    return {
      success: true,
      logs,
      credentials,
      durationSeconds: duration,
      executedAt: new Date().toISOString(),
    };
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    addLog(`❌ Gagal menjalankan seeding database: ${error.message}`, "error");
    return {
      success: false,
      error: error.message,
      logs,
      durationSeconds: duration,
      executedAt: new Date().toISOString(),
    };
  }
}

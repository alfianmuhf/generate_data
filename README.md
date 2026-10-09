# ERAD Data Generator Service

Layanan microservice standalone dengan antarmuka web Server-Side Rendering (SSR) untuk mengisi data mock pengujian (**Seed**) atau mengosongkan seluruh record (**Truncate**) database ERAD secara aman dan instan.

Service ini mereplikasi fungsionalitas dari script `error-service/prisma/seed.js` dan `error-service/prisma/truncate.js` ke dalam 1 server terpusat **tanpa memerlukan proses `prisma generate`**. Service menggunakan native PostgreSQL client (`pg`) sehingga sangat ringan, cepat saat build container, dan langsung siap pakai.

---

## 🚀 Fitur Utama

1. **Antarmuka Web SSR Modern (Tampilan Putih / Clean White Theme)**:
   - Desain putih modern, bersih, dan elegan (*light theme*).
   - Indikator status koneksi PostgreSQL real-time (*Connected / Disconnected*).
   - Panel ringkasan jumlah baris (*row count*) langsung untuk 16 tabel database ERAD.
   - Terminal log eksekusi dengan pewarnaan status dan tombol salin log.
   - Dialog konfirmasi aman untuk operasi destruktif (Truncate).
   - Kartu ringkasan kredensial pengguna setelah seeding selesai.
2. **2 Tombol Aksi Utama**:
   - **🌱 Jalankan Truncate & Seed Database**: Otomatis melakukan truncate seluruh tabel terlebih dahulu agar bersih total, lalu menyuntikkan 4 User Web (1 Admin, 2 Coordinator, 1 Viewer), 5 akun Telegram whitelist, data Master (Client, Lokasi, Komponen, Failure Code, Asset), serta 10 tiket pengujian multi-versi lengkap.
   - **🗑️ Kosongkan Seluruh Tabel (Truncate)**: Mengosongkan ke-16 tabel menggunakan `TRUNCATE TABLE ... CASCADE` dan memverifikasi hasilnya hingga 0 row.
3. **Murni Native PostgreSQL (Tanpa Prisma Generate)**:
   - Tidak perlu menjalankan `prisma generate`.
   - Menggunakan query SQL terstruktur via connection pool `pg`.
   - Ukuran container sangat kecil dan cepat di-build (`node:22-alpine`).

---

## ⚙️ Variabel Lingkungan (.env)

| Variabel | Default | Deskripsi |
| :--- | :--- | :--- |
| `PORT` | `3099` | Port web server service |
| `NODE_ENV` | `development` | Mode node environment (`development` / `production`) |
| `DATABASE_URL` | `postgresql://postgres:123@localhost:5432/monitor_err` | URL koneksi ke PostgreSQL |
| `ADMIN_EMAIL` | `admin@widya.com` | Email user Super Admin untuk seed |
| `ADMIN_PASSWORD` | `admin123` | Password default Super Admin |

---

## 💻 Menjalankan di Mesin Lokal

1. **Masuk ke folder:**
   ```bash
   cd generate_data
   ```

2. **Install dependensi:**
   ```bash
   npm install
   ```

3. **Jalankan server:**
   ```bash
   # Mode pengembangan (dengan auto-reload)
   npm run dev

   # Mode produksi
   npm start
   ```

4. **Akses Web UI:**
   Buka browser di [http://localhost:3099](http://localhost:3099).

---

## 🐳 Menjalankan di Docker Container

### 1. Build Image Docker
```bash
cd generate_data
docker build -t erad-generate-data .
```

### 2. Jalankan Container

#### Opsi A: Database Berada di Mesin Host (Lokal Anda)
```bash
docker run -d \
  --name erad-generate-data \
  -p 3099:3099 \
  -e DATABASE_URL="postgresql://postgres:123@host.docker.internal:5432/monitor_err" \
  erad-generate-data
```

#### Opsi B: Database Berada di Jaringan Docker yang Sama
```bash
docker run -d \
  --name erad-generate-data \
  --network my-docker-network \
  -p 3099:3099 \
  -e DATABASE_URL="postgresql://postgres:123@postgres-container:5432/monitor_err" \
  erad-generate-data
```

---

## 📡 Endpoint API

- `GET /` — Render halaman web SSR.
- `POST /seed` — Trigger mekanisme seed (Mendukung form submission & JSON response via header `Accept: application/json`).
- `POST /truncate` — Trigger mekanisme truncate (Mendukung form submission & JSON response via header `Accept: application/json`).
- `GET /health` — Endpoint healthcheck untuk docker / kubernetes / monitoring probe.

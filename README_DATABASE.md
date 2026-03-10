# 📚 PANDUAN INSTALASI DATABASE SISTEM TABUNGAN

## 🔧 Persyaratan
- XAMPP / WAMP / LAMP / MAMP (dengan Apache & MySQL)
- PHP 7.4 atau lebih baru
- MySQL 5.7 atau lebih baru
- Browser modern (Chrome, Firefox, Edge)

---

## 📦 LANGKAH INSTALASI

### 1. Install XAMPP
Download dan install XAMPP dari: https://www.apachefriends.org/

### 2. Jalankan Apache & MySQL
- Buka XAMPP Control Panel
- Start Apache
- Start MySQL

### 3. Buat Database
Ada 2 cara:

#### Cara A: Menggunakan phpMyAdmin
1. Buka browser, akses: `http://localhost/phpmyadmin`
2. Klik tab **SQL**
3. Copy semua isi file `database.sql`
4. Paste ke textarea SQL
5. Klik **Go**

#### Cara B: Menggunakan Command Line
```bash
mysql -u root -p < database.sql
```

### 4. Copy File ke Folder htdocs
Copy semua file ke folder `htdocs` di XAMPP:
- Windows: `C:\xampp\htdocs\tabungan\`
- Mac: `/Applications/XAMPP/htdocs/tabungan/`
- Linux: `/opt/lampp/htdocs/tabungan/`

Struktur folder:
```
htdocs/
└── tabungan/
    ├── index.html
    ├── dashboard-admin.html
    ├── dashboard-petugas.html
    ├── dashboard-nasabah.html
    ├── admin.js
    ├── petugas.js
    ├── nasabah.js
    ├── config.php
    ├── api_login.php
    ├── api_nasabah.php
    ├── api_transaksi.php
    ├── api_transfer.php
    ├── api_pengguna.php
    ├── api_log.php
    └── database.sql
```

### 5. Konfigurasi Database (Opsional)
Jika username/password MySQL berbeda dari default, edit file `config.php`:

```php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');         // Ganti jika berbeda
define('DB_PASS', '');             // Ganti jika ada password
define('DB_NAME', 'db_tabungan');
```

### 6. Akses Aplikasi
Buka browser dan akses: `http://localhost/tabungan/`

---

## 🔐 AKUN DEFAULT

### Admin
- Username: `admin`
- Password: `admin123`

### Petugas
- Username: `petugas`
- Password: `petugas123`

### Nasabah
- Username: `nasabah`
- Password: `nasabah123`

---

## 📊 STRUKTUR DATABASE

### Tabel `users`
Menyimpan data login semua pengguna (admin, petugas, nasabah)

| Field | Type | Keterangan |
|-------|------|------------|
| id | INT | Primary Key |
| username | VARCHAR(50) | Username (unique) |
| password | VARCHAR(255) | Password |
| nama | VARCHAR(100) | Nama lengkap |
| role | ENUM | admin/petugas/nasabah |
| norek | VARCHAR(20) | Nomor rekening (untuk nasabah) |

### Tabel `nasabah`
Menyimpan data lengkap nasabah

| Field | Type | Keterangan |
|-------|------|------------|
| id | INT | Primary Key |
| norek | VARCHAR(20) | Nomor rekening (unique) |
| nama | VARCHAR(100) | Nama lengkap |
| alamat | TEXT | Alamat |
| telp | VARCHAR(20) | Telepon |
| saldo | DECIMAL(15,2) | Saldo rekening |
| username | VARCHAR(50) | Foreign key ke users |

### Tabel `transaksi`
Menyimpan semua transaksi setor dan tarik

| Field | Type | Keterangan |
|-------|------|------------|
| id | INT | Primary Key |
| tanggal | DATETIME | Tanggal transaksi |
| norek | VARCHAR(20) | Nomor rekening |
| jenis | ENUM | Setor/Tarik |
| jumlah | DECIMAL(15,2) | Jumlah transaksi |
| keterangan | TEXT | Catatan |

### Tabel `transfer`
Menyimpan semua transfer antar rekening

| Field | Type | Keterangan |
|-------|------|------------|
| id | INT | Primary Key |
| tanggal | DATETIME | Tanggal transfer |
| dari_rek | VARCHAR(20) | Rekening pengirim |
| ke_rek | VARCHAR(20) | Rekening penerima |
| jumlah | DECIMAL(15,2) | Jumlah transfer |
| keterangan | TEXT | Catatan |
| status | VARCHAR(20) | Status transfer |

### Tabel `log_aktivitas`
Menyimpan semua log aktivitas sistem

| Field | Type | Keterangan |
|-------|------|------------|
| id | INT | Primary Key |
| timestamp | DATETIME | Waktu aktivitas |
| user | VARCHAR(100) | Nama user |
| role | VARCHAR(20) | Role user |
| aktivitas | TEXT | Deskripsi aktivitas |

---

## 🔄 MIGRASI DARI LOCALSTORAGE KE DATABASE

Jika Anda sudah punya data di localStorage (versi lama), data akan hilang saat pindah ke database.

**Solusi:** Export data dulu sebelum pindah ke database.

---

## 🐛 TROUBLESHOOTING

### Error: "Connection refused"
**Solusi:** Pastikan MySQL sudah running di XAMPP

### Error: "Access denied for user 'root'"
**Solusi:** Cek username/password di `config.php`

### Error: "Database not found"
**Solusi:** Import ulang file `database.sql`

### Halaman blank/error 500
**Solusi:** 
1. Cek Apache error log di XAMPP
2. Pastikan semua file PHP ada di folder yang benar
3. Cek permission folder (chmod 755)

---

## 📝 CATATAN PENTING

1. **Keamanan**: Password di database masih plaintext. Untuk production, gunakan password_hash()
2. **Backup**: Selalu backup database secara berkala
3. **Testing**: Test di localhost dulu sebelum deploy ke server
4. **CORS**: Jika akses dari domain berbeda, perlu konfigurasi CORS di PHP

---

## 🚀 UPGRADE KE HTTPS (OPSIONAL)

Untuk keamanan lebih baik:
1. Install SSL certificate
2. Edit `config.php` ganti protocol jadi HTTPS
3. Force HTTPS di `.htaccess`

---

## 💡 TIPS

- Gunakan phpMyAdmin untuk management database yang mudah
- Aktifkan error reporting saat development
- Matikan error reporting saat production
- Gunakan prepared statements untuk keamanan lebih baik

---

## 📞 SUPPORT

Jika ada masalah, cek:
1. Apache & MySQL running
2. File config.php sudah benar
3. Database sudah diimport
4. File PHP tidak ada error syntax

---

**Selamat menggunakan Sistem Tabungan! 🎉**

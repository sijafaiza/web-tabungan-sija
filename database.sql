-- Buat Database
CREATE DATABASE IF NOT EXISTS db_tabungan;
USE db_tabungan;

-- Tabel Users (untuk login admin, petugas, nasabah)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nama VARCHAR(100) NOT NULL,
    role ENUM('admin', 'petugas', 'nasabah') NOT NULL,
    norek VARCHAR(20) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabel Nasabah
CREATE TABLE IF NOT EXISTS nasabah (
    id INT AUTO_INCREMENT PRIMARY KEY,
    norek VARCHAR(20) UNIQUE NOT NULL,
    nama VARCHAR(100) NOT NULL,
    alamat TEXT NOT NULL,
    telp VARCHAR(20) NOT NULL,
    saldo DECIMAL(15,2) DEFAULT 0.00,
    username VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabel Transaksi
CREATE TABLE IF NOT EXISTS transaksi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tanggal DATETIME NOT NULL,
    norek VARCHAR(20) NOT NULL,
    jenis ENUM('Setor', 'Tarik') NOT NULL,
    jumlah DECIMAL(15,2) NOT NULL,
    keterangan TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (norek) REFERENCES nasabah(norek) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabel Transfer
CREATE TABLE IF NOT EXISTS transfer (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tanggal DATETIME NOT NULL,
    dari_rek VARCHAR(20) NOT NULL,
    ke_rek VARCHAR(20) NOT NULL,
    jumlah DECIMAL(15,2) NOT NULL,
    keterangan TEXT,
    status VARCHAR(20) DEFAULT 'Berhasil',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dari_rek) REFERENCES nasabah(norek) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (ke_rek) REFERENCES nasabah(norek) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabel Log Aktivitas
CREATE TABLE IF NOT EXISTS log_aktivitas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    timestamp DATETIME NOT NULL,
    user VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL,
    aktivitas TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert Data Default
-- Admin
INSERT INTO users (username, password, nama, role) VALUES
('admin', 'admin123', 'Administrator', 'admin');

-- Petugas
INSERT INTO users (username, password, nama, role) VALUES
('petugas', 'petugas123', 'Petugas Bank', 'petugas');

-- Nasabah Demo
INSERT INTO users (username, password, nama, role, norek) VALUES
('nasabah', 'nasabah123', 'Nasabah Demo', 'nasabah', '1234567890');

INSERT INTO nasabah (norek, nama, alamat, telp, saldo, username) VALUES
('1234567890', 'Nasabah Demo', 'Jakarta', '081234567890', 5000000.00, 'nasabah');

-- Index untuk performa
CREATE INDEX idx_transaksi_norek ON transaksi(norek);
CREATE INDEX idx_transaksi_tanggal ON transaksi(tanggal);
CREATE INDEX idx_transfer_dari ON transfer(dari_rek);
CREATE INDEX idx_transfer_ke ON transfer(ke_rek);
CREATE INDEX idx_transfer_tanggal ON transfer(tanggal);
CREATE INDEX idx_log_timestamp ON log_aktivitas(timestamp);

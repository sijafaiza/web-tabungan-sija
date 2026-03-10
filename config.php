<?php
// Konfigurasi Database
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'db_tabungan');

// Koneksi Database
$conn = mysqli_connect(DB_HOST, DB_USER, DB_PASS, DB_NAME);

// Cek koneksi
if (!$conn) {
    die("Koneksi database gagal: " . mysqli_connect_error());
}

// Set charset UTF-8
mysqli_set_charset($conn, "utf8");

// Fungsi untuk mencegah SQL Injection
function escape($data) {
    global $conn;
    return mysqli_real_escape_string($conn, $data);
}

// Fungsi untuk query
function query($sql) {
    global $conn;
    $result = mysqli_query($conn, $sql);
    
    if (!$result) {
        die("Query error: " . mysqli_error($conn));
    }
    
    return $result;
}

// Fungsi untuk fetch semua data
function fetchAll($result) {
    $data = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $data[] = $row;
    }
    return $data;
}

// Fungsi untuk fetch satu data
function fetchOne($result) {
    return mysqli_fetch_assoc($result);
}
?>

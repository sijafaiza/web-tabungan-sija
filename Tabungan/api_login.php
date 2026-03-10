<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$username = escape($data['username']);
$password = escape($data['password']);

// Cari user
$sql = "SELECT * FROM users WHERE username = '$username' AND password = '$password'";
$result = query($sql);
$user = fetchOne($result);

if ($user) {
    // Jika nasabah, ambil data lengkap
    if ($user['role'] === 'nasabah') {
        $norek = $user['norek'];
        $sqlNasabah = "SELECT * FROM nasabah WHERE username = '$username'";
        $resultNasabah = query($sqlNasabah);
        $nasabah = fetchOne($resultNasabah);
        
        if ($nasabah) {
            $user['saldo'] = $nasabah['saldo'];
            $user['alamat'] = $nasabah['alamat'];
            $user['telp'] = $nasabah['telp'];
        }
    }
    
    // Log aktivitas
    $timestamp = date('Y-m-d H:i:s');
    $nama = $user['nama'];
    $role = $user['role'];
    $aktivitas = 'Login ke sistem';
    
    $sqlLog = "INSERT INTO log_aktivitas (timestamp, user, role, aktivitas) 
               VALUES ('$timestamp', '$nama', '$role', '$aktivitas')";
    query($sqlLog);
    
    echo json_encode([
        'success' => true,
        'user' => $user
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Username atau password salah'
    ]);
}
?>

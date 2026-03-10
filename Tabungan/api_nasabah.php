<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents('php://input'), true);

switch ($method) {
    case 'GET':
        // Get semua nasabah
        $sql = "SELECT * FROM nasabah ORDER BY id DESC";
        $result = query($sql);
        $nasabah = fetchAll($result);
        
        echo json_encode([
            'success' => true,
            'data' => $nasabah
        ]);
        break;
        
    case 'POST':
        // Tambah nasabah baru
        $norek = escape($data['norek']);
        $nama = escape($data['nama']);
        $alamat = escape($data['alamat']);
        $telp = escape($data['telp']);
        $saldo = floatval($data['saldo']);
        $username = escape($data['username']);
        $password = escape($data['password']);
        
        // Cek duplikasi norek
        $checkNorek = "SELECT * FROM nasabah WHERE norek = '$norek'";
        if (mysqli_num_rows(query($checkNorek)) > 0) {
            echo json_encode(['success' => false, 'message' => 'Nomor rekening sudah digunakan']);
            exit;
        }
        
        // Cek duplikasi username
        $checkUsername = "SELECT * FROM users WHERE username = '$username'";
        if (mysqli_num_rows(query($checkUsername)) > 0) {
            echo json_encode(['success' => false, 'message' => 'Username sudah digunakan']);
            exit;
        }
        
        // Insert user
        $sqlUser = "INSERT INTO users (username, password, nama, role, norek) 
                    VALUES ('$username', '$password', '$nama', 'nasabah', '$norek')";
        query($sqlUser);
        
        // Insert nasabah
        $sqlNasabah = "INSERT INTO nasabah (norek, nama, alamat, telp, saldo, username) 
                       VALUES ('$norek', '$nama', '$alamat', '$telp', $saldo, '$username')";
        query($sqlNasabah);
        
        // Log aktivitas
        $timestamp = date('Y-m-d H:i:s');
        $userLog = escape($data['currentUser']);
        $roleLog = escape($data['currentRole']);
        $sqlLog = "INSERT INTO log_aktivitas (timestamp, user, role, aktivitas) 
                   VALUES ('$timestamp', '$userLog', '$roleLog', 'Menambah nasabah baru: $nama')";
        query($sqlLog);
        
        echo json_encode(['success' => true, 'message' => 'Nasabah berhasil ditambahkan']);
        break;
        
    case 'PUT':
        // Update nasabah
        $id = intval($data['id']);
        $norek = escape($data['norek']);
        $nama = escape($data['nama']);
        $alamat = escape($data['alamat']);
        $telp = escape($data['telp']);
        $saldo = floatval($data['saldo']);
        $username = escape($data['username']);
        $oldUsername = escape($data['oldUsername']);
        
        // Update nasabah
        $sqlNasabah = "UPDATE nasabah SET 
                       nama = '$nama', 
                       alamat = '$alamat', 
                       telp = '$telp', 
                       saldo = $saldo, 
                       username = '$username' 
                       WHERE id = $id";
        query($sqlNasabah);
        
        // Update user
        $sqlUser = "UPDATE users SET 
                    nama = '$nama', 
                    username = '$username', 
                    norek = '$norek'";
        
        if (!empty($data['password'])) {
            $password = escape($data['password']);
            $sqlUser .= ", password = '$password'";
        }
        
        $sqlUser .= " WHERE username = '$oldUsername'";
        query($sqlUser);
        
        // Log aktivitas
        $timestamp = date('Y-m-d H:i:s');
        $userLog = escape($data['currentUser']);
        $roleLog = escape($data['currentRole']);
        $sqlLog = "INSERT INTO log_aktivitas (timestamp, user, role, aktivitas) 
                   VALUES ('$timestamp', '$userLog', '$roleLog', 'Mengupdate data nasabah: $nama')";
        query($sqlLog);
        
        echo json_encode(['success' => true, 'message' => 'Nasabah berhasil diupdate']);
        break;
        
    case 'DELETE':
        // Hapus nasabah
        $id = intval($data['id']);
        $username = escape($data['username']);
        $nama = escape($data['nama']);
        
        // Hapus nasabah (akan cascade delete user juga)
        $sql = "DELETE FROM nasabah WHERE id = $id";
        query($sql);
        
        // Log aktivitas
        $timestamp = date('Y-m-d H:i:s');
        $userLog = escape($data['currentUser']);
        $roleLog = escape($data['currentRole']);
        $sqlLog = "INSERT INTO log_aktivitas (timestamp, user, role, aktivitas) 
                   VALUES ('$timestamp', '$userLog', '$roleLog', 'Menghapus nasabah: $nama')";
        query($sqlLog);
        
        echo json_encode(['success' => true, 'message' => 'Nasabah berhasil dihapus']);
        break;
}
?>

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
        // Get admin & petugas
        $sql = "SELECT * FROM users WHERE role IN ('admin', 'petugas') ORDER BY id DESC";
        $result = query($sql);
        $users = fetchAll($result);
        
        echo json_encode([
            'success' => true,
            'data' => $users
        ]);
        break;
        
    case 'POST':
        // Tambah pengguna baru
        $username = escape($data['username']);
        $password = escape($data['password']);
        $nama = escape($data['nama']);
        $role = escape($data['role']);
        
        // Cek duplikasi username
        $checkUsername = "SELECT * FROM users WHERE username = '$username'";
        if (mysqli_num_rows(query($checkUsername)) > 0) {
            echo json_encode(['success' => false, 'message' => 'Username sudah digunakan']);
            exit;
        }
        
        // Insert user
        $sql = "INSERT INTO users (username, password, nama, role) 
                VALUES ('$username', '$password', '$nama', '$role')";
        query($sql);
        
        // Log aktivitas
        $timestamp = date('Y-m-d H:i:s');
        $userLog = escape($data['currentUser']);
        $roleLog = escape($data['currentRole']);
        $sqlLog = "INSERT INTO log_aktivitas (timestamp, user, role, aktivitas) 
                   VALUES ('$timestamp', '$userLog', '$roleLog', 'Menambah pengguna baru: $nama ($role)')";
        query($sqlLog);
        
        echo json_encode(['success' => true, 'message' => 'Pengguna berhasil ditambahkan']);
        break;
        
    case 'PUT':
        // Update pengguna
        $oldUsername = escape($data['oldUsername']);
        $username = escape($data['username']);
        $nama = escape($data['nama']);
        $role = escape($data['role']);
        
        // Update user
        $sql = "UPDATE users SET 
                username = '$username', 
                nama = '$nama', 
                role = '$role'";
        
        if (!empty($data['password'])) {
            $password = escape($data['password']);
            $sql .= ", password = '$password'";
        }
        
        $sql .= " WHERE username = '$oldUsername'";
        query($sql);
        
        // Log aktivitas
        $timestamp = date('Y-m-d H:i:s');
        $userLog = escape($data['currentUser']);
        $roleLog = escape($data['currentRole']);
        $sqlLog = "INSERT INTO log_aktivitas (timestamp, user, role, aktivitas) 
                   VALUES ('$timestamp', '$userLog', '$roleLog', 'Mengupdate pengguna: $nama')";
        query($sqlLog);
        
        echo json_encode(['success' => true, 'message' => 'Pengguna berhasil diupdate']);
        break;
        
    case 'DELETE':
        // Hapus pengguna
        $username = escape($data['username']);
        $nama = escape($data['nama']);
        
        // Hapus user
        $sql = "DELETE FROM users WHERE username = '$username'";
        query($sql);
        
        // Log aktivitas
        $timestamp = date('Y-m-d H:i:s');
        $userLog = escape($data['currentUser']);
        $roleLog = escape($data['currentRole']);
        $sqlLog = "INSERT INTO log_aktivitas (timestamp, user, role, aktivitas) 
                   VALUES ('$timestamp', '$userLog', '$roleLog', 'Menghapus pengguna: $nama')";
        query($sqlLog);
        
        echo json_encode(['success' => true, 'message' => 'Pengguna berhasil dihapus']);
        break;
}
?>

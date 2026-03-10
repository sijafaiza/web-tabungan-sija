<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents('php://input'), true);

switch ($method) {
    case 'GET':
        // Get semua log
        $sql = "SELECT * FROM log_aktivitas ORDER BY timestamp DESC";
        $result = query($sql);
        $logs = fetchAll($result);
        
        echo json_encode([
            'success' => true,
            'data' => $logs
        ]);
        break;
        
    case 'DELETE':
        // Hapus semua log
        $sql = "TRUNCATE TABLE log_aktivitas";
        query($sql);
        
        // Log aktivitas hapus log
        $timestamp = date('Y-m-d H:i:s');
        $userLog = escape($data['currentUser']);
        $roleLog = escape($data['currentRole']);
        $sqlLog = "INSERT INTO log_aktivitas (timestamp, user, role, aktivitas) 
                   VALUES ('$timestamp', '$userLog', '$roleLog', 'Menghapus semua log aktivitas')";
        query($sqlLog);
        
        echo json_encode(['success' => true, 'message' => 'Semua log berhasil dihapus']);
        break;
}
?>

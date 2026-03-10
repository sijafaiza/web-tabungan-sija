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
        // Get semua transfer
        $sql = "SELECT * FROM transfer ORDER BY tanggal DESC";
        $result = query($sql);
        $transfer = fetchAll($result);
        
        echo json_encode([
            'success' => true,
            'data' => $transfer
        ]);
        break;
        
    case 'POST':
        // Tambah transfer baru
        $tanggal = escape($data['tanggal']);
        $dariRek = escape($data['dariRek']);
        $keRek = escape($data['keRek']);
        $jumlah = floatval($data['jumlah']);
        $keterangan = escape($data['keterangan']);
        
        // Validasi rekening berbeda
        if ($dariRek === $keRek) {
            echo json_encode(['success' => false, 'message' => 'Tidak bisa transfer ke rekening yang sama']);
            exit;
        }
        
        // Cek saldo pengirim
        $sqlCek = "SELECT saldo FROM nasabah WHERE norek = '$dariRek'";
        $resultCek = query($sqlCek);
        $pengirim = fetchOne($resultCek);
        
        if ($pengirim['saldo'] < $jumlah) {
            echo json_encode(['success' => false, 'message' => 'Saldo tidak mencukupi']);
            exit;
        }
        
        // Insert transfer
        $sqlTransfer = "INSERT INTO transfer (tanggal, dari_rek, ke_rek, jumlah, keterangan, status) 
                        VALUES ('$tanggal', '$dariRek', '$keRek', $jumlah, '$keterangan', 'Berhasil')";
        query($sqlTransfer);
        
        // Update saldo pengirim (kurang)
        $sqlDari = "UPDATE nasabah SET saldo = saldo - $jumlah WHERE norek = '$dariRek'";
        query($sqlDari);
        
        // Update saldo penerima (tambah)
        $sqlKe = "UPDATE nasabah SET saldo = saldo + $jumlah WHERE norek = '$keRek'";
        query($sqlKe);
        
        // Log aktivitas
        $timestamp = date('Y-m-d H:i:s');
        $userLog = escape($data['currentUser']);
        $roleLog = escape($data['currentRole']);
        $sqlLog = "INSERT INTO log_aktivitas (timestamp, user, role, aktivitas) 
                   VALUES ('$timestamp', '$userLog', '$roleLog', 'Menambah transfer: Rp " . number_format($jumlah, 0, ',', '.') . "')";
        query($sqlLog);
        
        echo json_encode(['success' => true, 'message' => 'Transfer berhasil']);
        break;
        
    case 'PUT':
        // Update transfer
        $id = intval($data['id']);
        $dariRek = escape($data['dariRek']);
        $keRek = escape($data['keRek']);
        $jumlah = floatval($data['jumlah']);
        $keterangan = escape($data['keterangan']);
        
        // Validasi rekening berbeda
        if ($dariRek === $keRek) {
            echo json_encode(['success' => false, 'message' => 'Tidak bisa transfer ke rekening yang sama']);
            exit;
        }
        
        // Get transfer lama
        $sqlOld = "SELECT * FROM transfer WHERE id = $id";
        $resultOld = query($sqlOld);
        $oldTransfer = fetchOne($resultOld);
        
        // Kembalikan saldo lama
        $sqlRevertDari = "UPDATE nasabah SET saldo = saldo + {$oldTransfer['jumlah']} WHERE norek = '{$oldTransfer['dari_rek']}'";
        query($sqlRevertDari);
        
        $sqlRevertKe = "UPDATE nasabah SET saldo = saldo - {$oldTransfer['jumlah']} WHERE norek = '{$oldTransfer['ke_rek']}'";
        query($sqlRevertKe);
        
        // Update transfer
        $sqlUpdate = "UPDATE transfer SET 
                      dari_rek = '$dariRek', 
                      ke_rek = '$keRek', 
                      jumlah = $jumlah, 
                      keterangan = '$keterangan' 
                      WHERE id = $id";
        query($sqlUpdate);
        
        // Update saldo baru
        $sqlDari = "UPDATE nasabah SET saldo = saldo - $jumlah WHERE norek = '$dariRek'";
        query($sqlDari);
        
        $sqlKe = "UPDATE nasabah SET saldo = saldo + $jumlah WHERE norek = '$keRek'";
        query($sqlKe);
        
        // Log aktivitas
        $timestamp = date('Y-m-d H:i:s');
        $userLog = escape($data['currentUser']);
        $roleLog = escape($data['currentRole']);
        $sqlLog = "INSERT INTO log_aktivitas (timestamp, user, role, aktivitas) 
                   VALUES ('$timestamp', '$userLog', '$roleLog', 'Mengupdate transfer: Rp " . number_format($jumlah, 0, ',', '.') . "')";
        query($sqlLog);
        
        echo json_encode(['success' => true, 'message' => 'Transfer berhasil diupdate']);
        break;
        
    case 'DELETE':
        // Hapus transfer
        $id = intval($data['id']);
        
        // Get transfer
        $sql = "SELECT * FROM transfer WHERE id = $id";
        $result = query($sql);
        $transfer = fetchOne($result);
        
        // Kembalikan saldo
        $sqlDari = "UPDATE nasabah SET saldo = saldo + {$transfer['jumlah']} WHERE norek = '{$transfer['dari_rek']}'";
        query($sqlDari);
        
        $sqlKe = "UPDATE nasabah SET saldo = saldo - {$transfer['jumlah']} WHERE norek = '{$transfer['ke_rek']}'";
        query($sqlKe);
        
        // Hapus transfer
        $sqlDelete = "DELETE FROM transfer WHERE id = $id";
        query($sqlDelete);
        
        // Log aktivitas
        $timestamp = date('Y-m-d H:i:s');
        $userLog = escape($data['currentUser']);
        $roleLog = escape($data['currentRole']);
        $sqlLog = "INSERT INTO log_aktivitas (timestamp, user, role, aktivitas) 
                   VALUES ('$timestamp', '$userLog', '$roleLog', 'Menghapus transfer: Rp " . number_format($transfer['jumlah'], 0, ',', '.') . "')";
        query($sqlLog);
        
        echo json_encode(['success' => true, 'message' => 'Transfer berhasil dihapus']);
        break;
}
?>

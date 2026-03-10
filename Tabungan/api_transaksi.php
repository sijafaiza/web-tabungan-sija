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
        // Get semua transaksi
        $sql = "SELECT * FROM transaksi ORDER BY tanggal DESC";
        $result = query($sql);
        $transaksi = fetchAll($result);
        
        echo json_encode([
            'success' => true,
            'data' => $transaksi
        ]);
        break;
        
    case 'POST':
        // Tambah transaksi baru
        $tanggal = escape($data['tanggal']);
        $norek = escape($data['norek']);
        $jenis = escape($data['jenis']);
        $jumlah = floatval($data['jumlah']);
        $keterangan = escape($data['keterangan']);
        
        // Cek saldo untuk tarik
        if ($jenis === 'Tarik') {
            $sqlCek = "SELECT saldo FROM nasabah WHERE norek = '$norek'";
            $resultCek = query($sqlCek);
            $nasabah = fetchOne($resultCek);
            
            if ($nasabah['saldo'] < $jumlah) {
                echo json_encode(['success' => false, 'message' => 'Saldo tidak mencukupi']);
                exit;
            }
        }
        
        // Insert transaksi
        $sqlTransaksi = "INSERT INTO transaksi (tanggal, norek, jenis, jumlah, keterangan) 
                         VALUES ('$tanggal', '$norek', '$jenis', $jumlah, '$keterangan')";
        query($sqlTransaksi);
        
        // Update saldo
        if ($jenis === 'Setor') {
            $sqlSaldo = "UPDATE nasabah SET saldo = saldo + $jumlah WHERE norek = '$norek'";
        } else {
            $sqlSaldo = "UPDATE nasabah SET saldo = saldo - $jumlah WHERE norek = '$norek'";
        }
        query($sqlSaldo);
        
        // Log aktivitas
        $timestamp = date('Y-m-d H:i:s');
        $userLog = escape($data['currentUser']);
        $roleLog = escape($data['currentRole']);
        $sqlLog = "INSERT INTO log_aktivitas (timestamp, user, role, aktivitas) 
                   VALUES ('$timestamp', '$userLog', '$roleLog', 'Menambah transaksi $jenis: Rp " . number_format($jumlah, 0, ',', '.') . "')";
        query($sqlLog);
        
        // Get saldo terbaru
        $sqlGetSaldo = "SELECT saldo FROM nasabah WHERE norek = '$norek'";
        $resultSaldo = query($sqlGetSaldo);
        $saldoBaru = fetchOne($resultSaldo);
        
        echo json_encode([
            'success' => true, 
            'message' => 'Transaksi berhasil',
            'saldo' => $saldoBaru['saldo']
        ]);
        break;
        
    case 'PUT':
        // Update transaksi
        $id = intval($data['id']);
        $norek = escape($data['norek']);
        $jenis = escape($data['jenis']);
        $jumlah = floatval($data['jumlah']);
        $keterangan = escape($data['keterangan']);
        
        // Get transaksi lama
        $sqlOld = "SELECT * FROM transaksi WHERE id = $id";
        $resultOld = query($sqlOld);
        $oldTransaksi = fetchOne($resultOld);
        
        // Kembalikan saldo lama
        if ($oldTransaksi['jenis'] === 'Setor') {
            $sqlRevert = "UPDATE nasabah SET saldo = saldo - {$oldTransaksi['jumlah']} WHERE norek = '{$oldTransaksi['norek']}'";
        } else {
            $sqlRevert = "UPDATE nasabah SET saldo = saldo + {$oldTransaksi['jumlah']} WHERE norek = '{$oldTransaksi['norek']}'";
        }
        query($sqlRevert);
        
        // Update transaksi
        $sqlUpdate = "UPDATE transaksi SET 
                      norek = '$norek', 
                      jenis = '$jenis', 
                      jumlah = $jumlah, 
                      keterangan = '$keterangan' 
                      WHERE id = $id";
        query($sqlUpdate);
        
        // Update saldo baru
        if ($jenis === 'Setor') {
            $sqlSaldo = "UPDATE nasabah SET saldo = saldo + $jumlah WHERE norek = '$norek'";
        } else {
            $sqlSaldo = "UPDATE nasabah SET saldo = saldo - $jumlah WHERE norek = '$norek'";
        }
        query($sqlSaldo);
        
        // Log aktivitas
        $timestamp = date('Y-m-d H:i:s');
        $userLog = escape($data['currentUser']);
        $roleLog = escape($data['currentRole']);
        $sqlLog = "INSERT INTO log_aktivitas (timestamp, user, role, aktivitas) 
                   VALUES ('$timestamp', '$userLog', '$roleLog', 'Mengupdate transaksi $jenis: Rp " . number_format($jumlah, 0, ',', '.') . "')";
        query($sqlLog);
        
        echo json_encode(['success' => true, 'message' => 'Transaksi berhasil diupdate']);
        break;
        
    case 'DELETE':
        // Hapus transaksi
        $id = intval($data['id']);
        
        // Get transaksi
        $sql = "SELECT * FROM transaksi WHERE id = $id";
        $result = query($sql);
        $transaksi = fetchOne($result);
        
        // Kembalikan saldo
        if ($transaksi['jenis'] === 'Setor') {
            $sqlSaldo = "UPDATE nasabah SET saldo = saldo - {$transaksi['jumlah']} WHERE norek = '{$transaksi['norek']}'";
        } else {
            $sqlSaldo = "UPDATE nasabah SET saldo = saldo + {$transaksi['jumlah']} WHERE norek = '{$transaksi['norek']}'";
        }
        query($sqlSaldo);
        
        // Hapus transaksi
        $sqlDelete = "DELETE FROM transaksi WHERE id = $id";
        query($sqlDelete);
        
        // Log aktivitas
        $timestamp = date('Y-m-d H:i:s');
        $userLog = escape($data['currentUser']);
        $roleLog = escape($data['currentRole']);
        $sqlLog = "INSERT INTO log_aktivitas (timestamp, user, role, aktivitas) 
                   VALUES ('$timestamp', '$userLog', '$roleLog', 'Menghapus transaksi {$transaksi['jenis']}: Rp " . number_format($transaksi['jumlah'], 0, ',', '.') . "')";
        query($sqlLog);
        
        echo json_encode(['success' => true, 'message' => 'Transaksi berhasil dihapus']);
        break;
}
?>

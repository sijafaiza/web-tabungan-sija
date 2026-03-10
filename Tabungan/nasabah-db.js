// Cek autentikasi
const currentUser = checkAuth('nasabah');
if (!currentUser) {
    window.location.href = 'index.html';
}

document.getElementById('userName').textContent = currentUser.nama;

// Load data
let nasabahData = [];
let transaksiData = [];
let transferData = [];

// Data nasabah yang login
let myData = null;

// Switch tab
function switchTab(tabName) {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => tab.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tabName + '-tab').classList.add('active');
}

// Update info saldo
async function updateSaldoInfo() {
    const result = await NasabahAPI.getAll();
    if (result.success) {
        myData = result.data.find(n => n.norek === currentUser.norek);
        if (myData) {
            document.getElementById('saldoValue').textContent = formatRupiah(parseFloat(myData.saldo));
            document.getElementById('noRekening').textContent = myData.norek;
            document.getElementById('namaNasabah').textContent = myData.nama;
        }
    }
}

// Get all transaksi untuk nasabah ini
function getMyTransactions() {
    // Transaksi biasa
    const myTransaksi = transaksiData
        .filter(t => t.norek === currentUser.norek)
        .map(t => ({
            tanggal: t.tanggal,
            jenis: t.jenis,
            jumlah: t.jenis === 'Setor' ? parseFloat(t.jumlah) : -parseFloat(t.jumlah),
            keterangan: t.keterangan || t.jenis
        }));
    
    // Transfer keluar
    const transferKeluar = transferData
        .filter(t => t.dari_rek === currentUser.norek)
        .map(t => ({
            tanggal: t.tanggal,
            jenis: 'Transfer Keluar',
            jumlah: -parseFloat(t.jumlah),
            keterangan: `Transfer ke ${t.ke_rek}${t.keterangan ? ' - ' + t.keterangan : ''}`
        }));
    
    // Transfer masuk
    const transferMasuk = transferData
        .filter(t => t.ke_rek === currentUser.norek)
        .map(t => ({
            tanggal: t.tanggal,
            jenis: 'Transfer Masuk',
            jumlah: parseFloat(t.jumlah),
            keterangan: `Transfer dari ${t.dari_rek}${t.keterangan ? ' - ' + t.keterangan : ''}`
        }));
    
    // Gabungkan semua
    const allTransactions = [...myTransaksi, ...transferKeluar, ...transferMasuk];
    
    // Urutkan berdasarkan tanggal
    allTransactions.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));
    
    return allTransactions;
}

// Load histori
function loadHistori(filtered = null) {
    const tbody = document.getElementById('tbodyHistori');
    tbody.innerHTML = '';
    
    const transactions = filtered || getMyTransactions();
    
    if (transactions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">
                    <div>Tidak ada transaksi</div>
                </td>
            </tr>
        `;
        return;
    }
    
    // Hitung saldo berjalan
    let saldoBerjalan = 0;
    
    transactions.slice().reverse().forEach(transaksi => {
        // Hitung saldo pada saat transaksi
        const indexInOriginal = transactions.indexOf(transaksi);
        saldoBerjalan = 0;
        for (let i = 0; i <= indexInOriginal; i++) {
            saldoBerjalan += transactions[i].jumlah;
        }
        
        const tr = document.createElement('tr');
        const isPositive = transaksi.jumlah > 0;
        
        tr.innerHTML = `
            <td>${formatTanggal(transaksi.tanggal)}</td>
            <td><span class="badge ${isPositive ? 'badge-success' : 'badge-danger'}">${transaksi.jenis}</span></td>
            <td>${transaksi.keterangan}</td>
            <td style="color: ${isPositive ? '#1dd1a1' : '#ee5a6f'}; font-weight: 600;">
                ${isPositive ? '+' : ''}${formatRupiah(transaksi.jumlah)}
            </td>
            <td style="font-weight: 600;">${formatRupiah(saldoBerjalan)}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Apply filter histori
function applyFilterHistori() {
    const dariTanggal = document.getElementById('filterDariTanggal').value;
    const sampaiTanggal = document.getElementById('filterSampaiTanggal').value;
    const jenis = document.getElementById('filterJenis').value;
    
    let transactions = getMyTransactions();
    
    // Filter tanggal
    if (dariTanggal) {
        transactions = transactions.filter(t => new Date(t.tanggal) >= new Date(dariTanggal));
    }
    if (sampaiTanggal) {
        transactions = transactions.filter(t => new Date(t.tanggal) <= new Date(sampaiTanggal + 'T23:59:59'));
    }
    
    // Filter jenis
    if (jenis) {
        transactions = transactions.filter(t => t.jenis === jenis);
    }
    
    loadHistori(transactions);
}

// Generate rekap
async function generateRekap() {
    const dariTanggal = document.getElementById('rekapDariTanggal').value;
    const sampaiTanggal = document.getElementById('rekapSampaiTanggal').value;
    
    if (!dariTanggal || !sampaiTanggal) {
        alert('Pilih periode tanggal terlebih dahulu!');
        return;
    }
    
    let transactions = getMyTransactions();
    
    // Filter berdasarkan periode
    transactions = transactions.filter(t => {
        const date = new Date(t.tanggal);
        return date >= new Date(dariTanggal) && date <= new Date(sampaiTanggal + 'T23:59:59');
    });
    
    // Hitung statistik
    const totalSetor = transactions
        .filter(t => t.jenis === 'Setor')
        .reduce((sum, t) => sum + t.jumlah, 0);
    
    const totalTarik = transactions
        .filter(t => t.jenis === 'Tarik')
        .reduce((sum, t) => sum + Math.abs(t.jumlah), 0);
    
    const totalTransferMasuk = transactions
        .filter(t => t.jenis === 'Transfer Masuk')
        .reduce((sum, t) => sum + t.jumlah, 0);
    
    const totalTransferKeluar = transactions
        .filter(t => t.jenis === 'Transfer Keluar')
        .reduce((sum, t) => sum + Math.abs(t.jumlah), 0);
    
    const jumlahTransaksi = transactions.length;
    
    const mutasiMasuk = totalSetor + totalTransferMasuk;
    const mutasiKeluar = totalTarik + totalTransferKeluar;
    const mutasiBersih = mutasiMasuk - mutasiKeluar;
    
    // Generate HTML
    const rekapContent = document.getElementById('rekapContent');
    
    let html = `
        <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
            <h3 style="margin-bottom: 10px;">Periode Rekap</h3>
            <p><strong>${formatTanggalSaja(dariTanggal)}</strong> sampai <strong>${formatTanggalSaja(sampaiTanggal)}</strong></p>
        </div>
        
        <div class="stats-grid">
            <div class="stat-item">
                <div class="stat-item-label">Total Transaksi</div>
                <div class="stat-item-value">${jumlahTransaksi}</div>
            </div>
            <div class="stat-item">
                <div class="stat-item-label">Total Setor</div>
                <div class="stat-item-value" style="color: #1dd1a1;">${formatRupiah(totalSetor)}</div>
            </div>
            <div class="stat-item">
                <div class="stat-item-label">Total Tarik</div>
                <div class="stat-item-value" style="color: #ee5a6f;">${formatRupiah(totalTarik)}</div>
            </div>
            <div class="stat-item">
                <div class="stat-item-label">Transfer Masuk</div>
                <div class="stat-item-value" style="color: #1dd1a1;">${formatRupiah(totalTransferMasuk)}</div>
            </div>
            <div class="stat-item">
                <div class="stat-item-label">Transfer Keluar</div>
                <div class="stat-item-value" style="color: #ee5a6f;">${formatRupiah(totalTransferKeluar)}</div>
            </div>
            <div class="stat-item" style="background: linear-gradient(135deg, #0093dd 0%, #f6c306 100%); color: white;">
                <div class="stat-item-label" style="color: white; opacity: 0.9;">Mutasi Bersih</div>
                <div class="stat-item-value" style="color: white;">${formatRupiah(mutasiBersih)}</div>
            </div>
        </div>
        
        <div class="card" style="margin-top: 20px;">
            <h3 style="margin-bottom: 15px;">Detail Transaksi</h3>
            <table>
                <thead>
                    <tr>
                        <th>Tanggal</th>
                        <th>Jenis</th>
                        <th>Keterangan</th>
                        <th>Jumlah</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    if (transactions.length === 0) {
        html += `
                    <tr>
                        <td colspan="4" class="empty-state">Tidak ada transaksi dalam periode ini</td>
                    </tr>
                </tbody>
            </table>
        </div>
        `;
    } else {
        transactions.slice().reverse().forEach(t => {
            const isPositive = t.jumlah > 0;
            html += `
                    <tr>
                        <td>${formatTanggal(t.tanggal)}</td>
                        <td><span class="badge ${isPositive ? 'badge-success' : 'badge-danger'}">${t.jenis}</span></td>
                        <td>${t.keterangan}</td>
                        <td style="color: ${isPositive ? '#1dd1a1' : '#ee5a6f'}; font-weight: 600;">
                            ${isPositive ? '+' : ''}${formatRupiah(t.jumlah)}
                        </td>
                    </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
        </div>
        `;
    }
    
    rekapContent.innerHTML = html;
}

// ===== TRANSAKSI BARU =====
document.getElementById('formTransaksiNasabah').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const jenis = document.getElementById('jenisTransaksi').value;
    const jumlah = parseFloat(document.getElementById('jumlahTransaksi').value);
    const keterangan = document.getElementById('keteranganTransaksi').value;
    
    // Validasi saldo untuk tarik
    if (jenis === 'Tarik' && parseFloat(myData.saldo) < jumlah) {
        alert('Saldo tidak mencukupi!');
        return;
    }
    
    if (confirm(`Konfirmasi ${jenis} sebesar ${formatRupiah(jumlah)}?`)) {
        const result = await TransaksiAPI.create({
            tanggal: new Date().toISOString().slice(0, 19).replace('T', ' '),
            norek: currentUser.norek,
            jenis,
            jumlah,
            keterangan,
            currentUser: currentUser.nama,
            currentRole: currentUser.role
        });
        
        if (result.success) {
            alert(`${jenis} berhasil! Saldo Anda sekarang: ${formatRupiah(result.saldo)}`);
            document.getElementById('formTransaksiNasabah').reset();
            loadData();
        } else {
            alert('Error: ' + result.message);
        }
    }
});

// ===== TRANSFER =====
// Cek rekening tujuan
document.getElementById('rekeningTujuan').addEventListener('input', async function() {
    const norek = this.value;
    const namaPenerimaField = document.getElementById('namaPenerima');
    
    if (norek === currentUser.norek) {
        namaPenerimaField.value = 'Tidak bisa transfer ke rekening sendiri';
        namaPenerimaField.style.color = 'red';
        return;
    }
    
    const penerima = nasabahData.find(n => n.norek === norek);
    if (penerima) {
        namaPenerimaField.value = penerima.nama;
        namaPenerimaField.style.color = 'green';
    } else {
        namaPenerimaField.value = 'Rekening tidak ditemukan';
        namaPenerimaField.style.color = 'red';
    }
});

document.getElementById('formTransferNasabah').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const keRek = document.getElementById('rekeningTujuan').value;
    const jumlah = parseFloat(document.getElementById('jumlahTransfer').value);
    const keterangan = document.getElementById('keteranganTransfer').value;
    
    if (keRek === currentUser.norek) {
        alert('Tidak bisa transfer ke rekening sendiri!');
        return;
    }
    
    const penerima = nasabahData.find(n => n.norek === keRek);
    if (!penerima) {
        alert('Rekening tujuan tidak ditemukan!');
        return;
    }
    
    // Validasi saldo
    if (parseFloat(myData.saldo) < jumlah) {
        alert('Saldo tidak mencukupi!');
        return;
    }
    
    if (confirm(`Transfer ${formatRupiah(jumlah)} ke ${penerima.nama} (${keRek})?`)) {
        const result = await TransferAPI.create({
            tanggal: new Date().toISOString().slice(0, 19).replace('T', ' '),
            dariRek: currentUser.norek,
            keRek,
            jumlah,
            keterangan,
            currentUser: currentUser.nama,
            currentRole: currentUser.role
        });
        
        if (result.success) {
            alert(`Transfer berhasil!`);
            document.getElementById('formTransferNasabah').reset();
            loadData();
        } else {
            alert('Error: ' + result.message);
        }
    }
});

// ===== CETAK MUTASI =====
function cetakMutasi() {
    const dariTanggal = document.getElementById('mutasiDariTanggal').value;
    const sampaiTanggal = document.getElementById('mutasiSampaiTanggal').value;
    
    // Filter transaksi
    let mutasi = transaksiData.filter(t => t.norek === currentUser.norek);
    
    // Filter transfer (sebagai pengirim atau penerima)
    const transferKeluar = transferData.filter(t => t.dari_rek === currentUser.norek).map(t => ({
        tanggal: t.tanggal,
        jenis: 'Transfer Keluar',
        jumlah: -parseFloat(t.jumlah),
        keterangan: `Transfer ke ${t.ke_rek}${t.keterangan ? ' - ' + t.keterangan : ''}`
    }));
    
    const transferMasuk = transferData.filter(t => t.ke_rek === currentUser.norek).map(t => ({
        tanggal: t.tanggal,
        jenis: 'Transfer Masuk',
        jumlah: parseFloat(t.jumlah),
        keterangan: `Transfer dari ${t.dari_rek}${t.keterangan ? ' - ' + t.keterangan : ''}`
    }));
    
    mutasi = [...mutasi, ...transferKeluar, ...transferMasuk];
    
    // Filter berdasarkan tanggal
    if (dariTanggal) {
        mutasi = mutasi.filter(m => new Date(m.tanggal) >= new Date(dariTanggal));
    }
    if (sampaiTanggal) {
        mutasi = mutasi.filter(m => new Date(m.tanggal) <= new Date(sampaiTanggal + 'T23:59:59'));
    }
    
    // Urutkan berdasarkan tanggal
    mutasi.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));
    
    // Hitung saldo berjalan
    let saldoBerjalan = 0;
    
    // Cari saldo awal (dari transaksi terakhir sebelum periode)
    const transaksiSebelum = transaksiData.filter(t => {
        return t.norek === currentUser.norek && 
               (!dariTanggal || new Date(t.tanggal) < new Date(dariTanggal));
    });
    
    transaksiSebelum.forEach(t => {
        if (t.jenis === 'Setor') {
            saldoBerjalan += parseFloat(t.jumlah);
        } else {
            saldoBerjalan -= parseFloat(t.jumlah);
        }
    });
    
    const transferSebelumKeluar = transferData.filter(t => {
        return t.dari_rek === currentUser.norek && 
               (!dariTanggal || new Date(t.tanggal) < new Date(dariTanggal));
    });
    
    const transferSebelumMasuk = transferData.filter(t => {
        return t.ke_rek === currentUser.norek && 
               (!dariTanggal || new Date(t.tanggal) < new Date(dariTanggal));
    });
    
    transferSebelumKeluar.forEach(t => saldoBerjalan -= parseFloat(t.jumlah));
    transferSebelumMasuk.forEach(t => saldoBerjalan += parseFloat(t.jumlah));
    
    const saldoAwal = saldoBerjalan;
    
    // Generate HTML untuk print
    let html = `
        <div class="print-header">
            <h1>MUTASI REKENING</h1>
            <p>Sistem Tabungan</p>
        </div>
        
        <div class="print-info">
            <table>
                <tr>
                    <td><strong>No. Rekening</strong></td>
                    <td>: ${myData.norek}</td>
                </tr>
                <tr>
                    <td><strong>Nama</strong></td>
                    <td>: ${myData.nama}</td>
                </tr>
                <tr>
                    <td><strong>Alamat</strong></td>
                    <td>: ${myData.alamat}</td>
                </tr>
                <tr>
                    <td><strong>Periode</strong></td>
                    <td>: ${dariTanggal ? formatTanggalSaja(dariTanggal) : 'Awal'} s/d ${sampaiTanggal ? formatTanggalSaja(sampaiTanggal) : 'Sekarang'}</td>
                </tr>
                <tr>
                    <td><strong>Saldo Awal</strong></td>
                    <td>: ${formatRupiah(saldoAwal)}</td>
                </tr>
            </table>
        </div>
        
        <table style="margin-top: 20px;">
            <thead>
                <tr>
                    <th>Tanggal</th>
                    <th>Keterangan</th>
                    <th style="text-align: right;">Debit</th>
                    <th style="text-align: right;">Kredit</th>
                    <th style="text-align: right;">Saldo</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    mutasi.forEach(m => {
        let debit = '';
        let kredit = '';
        
        // DEBIT = uang KELUAR (Tarik, Transfer Keluar) - MENGURANGI saldo
        // KREDIT = uang MASUK (Setor, Transfer Masuk) - MENAMBAH saldo
        if (m.jenis === 'Tarik' || m.jenis === 'Transfer Keluar') {
            debit = formatRupiah(Math.abs(m.jumlah));
            saldoBerjalan -= Math.abs(m.jumlah);
        } else {
            kredit = formatRupiah(Math.abs(m.jumlah));
            saldoBerjalan += Math.abs(m.jumlah);
        }
        
        html += `
            <tr>
                <td>${formatTanggal(m.tanggal)}</td>
                <td>${m.keterangan || m.jenis}</td>
                <td style="text-align: right;">${debit}</td>
                <td style="text-align: right;">${kredit}</td>
                <td style="text-align: right;">${formatRupiah(saldoBerjalan)}</td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
            <tfoot>
                <tr style="font-weight: bold; background: #f0f0f0;">
                    <td colspan="4" style="text-align: right; padding: 15px;">Saldo Rekening:</td>
                    <td style="text-align: right; padding: 15px;">${formatRupiah(parseFloat(myData.saldo))}</td>
                </tr>
            </tfoot>
        </table>
        
        <div style="margin-top: 50px; text-align: right;">
            <p>Dicetak pada: ${formatTanggal(new Date().toISOString())}</p>
        </div>
    `;
    
    // Preview
    document.getElementById('previewMutasi').innerHTML = `
        <div class="card" style="margin-top: 20px;">
            <div class="card-header">
                <h3 class="card-title">Preview Mutasi</h3>
                <button class="btn btn-primary no-print" onclick="window.print()">🖨️ Print</button>
            </div>
            ${html}
        </div>
    `;
    
    // Set print area
    document.getElementById('printArea').innerHTML = html;
}

// Initial load
async function loadData() {
    const resultNasabah = await NasabahAPI.getAll();
    if (resultNasabah.success) {
        nasabahData = resultNasabah.data;
    }
    
    const resultTransaksi = await TransaksiAPI.getAll();
    if (resultTransaksi.success) {
        transaksiData = resultTransaksi.data;
    }
    
    const resultTransfer = await TransferAPI.getAll();
    if (resultTransfer.success) {
        transferData = resultTransfer.data;
    }
    
    await updateSaldoInfo();
    loadHistori();
    
    // Set default date untuk mutasi (bulan ini)
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    
    document.getElementById('mutasiDariTanggal').value = firstDay.toISOString().split('T')[0];
    document.getElementById('mutasiSampaiTanggal').value = today.toISOString().split('T')[0];
    
    // Set default date untuk rekap (bulan ini)
    document.getElementById('rekapDariTanggal').value = firstDay.toISOString().split('T')[0];
    document.getElementById('rekapSampaiTanggal').value = today.toISOString().split('T')[0];
}

loadData();

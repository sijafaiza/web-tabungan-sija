// Cek autentikasi
const currentUser = checkAuth('petugas');
if (!currentUser) {
    window.location.href = 'index.html';
}

document.getElementById('userName').textContent = currentUser.nama;

// Load data
let nasabahData = [];
let transaksiData = [];
let transferData = [];
let filteredTransaksi = [];

// Switch tab
function switchTab(tabName) {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => tab.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tabName + '-tab').classList.add('active');
    
    if (tabName === 'mutasi') {
        loadNasabahDropdown();
    }
}

// Update statistik
function updateStats() {
    const today = new Date().toDateString();
    const transaksiHariIni = transaksiData.filter(t => {
        return new Date(t.tanggal).toDateString() === today;
    });
    
    document.getElementById('totalTransaksiHariIni').textContent = transaksiHariIni.length;
    
    const totalSetor = transaksiHariIni
        .filter(t => t.jenis === 'Setor')
        .reduce((sum, t) => sum + parseFloat(t.jumlah), 0);
    
    const totalTarik = transaksiHariIni
        .filter(t => t.jenis === 'Tarik')
        .reduce((sum, t) => sum + parseFloat(t.jumlah), 0);
    
    document.getElementById('totalSetor').textContent = formatRupiah(totalSetor);
    document.getElementById('totalTarik').textContent = formatRupiah(totalTarik);
}

// Load histori transaksi
function loadHistori() {
    const tbody = document.getElementById('tbodyHistori');
    tbody.innerHTML = '';
    
    filteredTransaksi.slice().reverse().forEach(transaksi => {
        const nasabah = nasabahData.find(n => n.norek === transaksi.norek);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formatTanggal(transaksi.tanggal)}</td>
            <td>${transaksi.norek}</td>
            <td>${nasabah ? nasabah.nama : '-'}</td>
            <td><span class="badge ${transaksi.jenis === 'Setor' ? 'badge-success' : 'badge-danger'}">${transaksi.jenis}</span></td>
            <td>${formatRupiah(parseFloat(transaksi.jumlah))}</td>
            <td>${transaksi.keterangan || '-'}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Apply filter
function applyFilter() {
    const filterTanggal = document.getElementById('filterTanggal').value;
    const filterJenis = document.getElementById('filterJenis').value;
    const cariNasabah = document.getElementById('cariNasabah').value.toLowerCase();
    
    filteredTransaksi = transaksiData.filter(transaksi => {
        let match = true;
        
        // Filter tanggal
        if (filterTanggal) {
            const transaksiDate = new Date(transaksi.tanggal).toDateString();
            const filterDate = new Date(filterTanggal).toDateString();
            match = match && (transaksiDate === filterDate);
        }
        
        // Filter jenis
        if (filterJenis) {
            match = match && (transaksi.jenis === filterJenis);
        }
        
        // Cari nasabah
        if (cariNasabah) {
            const nasabah = nasabahData.find(n => n.norek === transaksi.norek);
            if (nasabah) {
                match = match && (
                    nasabah.nama.toLowerCase().includes(cariNasabah) ||
                    nasabah.norek.includes(cariNasabah)
                );
            } else {
                match = false;
            }
        }
        
        return match;
    });
    
    loadHistori();
}

// Load nasabah dropdown
function loadNasabahDropdown() {
    const select = document.getElementById('nasabahMutasi');
    select.innerHTML = '<option value="">Pilih Nasabah</option>';
    
    nasabahData.forEach(nasabah => {
        select.innerHTML += `<option value="${nasabah.norek}">${nasabah.norek} - ${nasabah.nama}</option>`;
    });
}

// Cetak mutasi
function cetakMutasi() {
    const norek = document.getElementById('nasabahMutasi').value;
    const dariTanggal = document.getElementById('dariTanggal').value;
    const sampaiTanggal = document.getElementById('sampaiTanggal').value;
    
    if (!norek) {
        alert('Pilih nasabah terlebih dahulu!');
        return;
    }
    
    const nasabah = nasabahData.find(n => n.norek === norek);
    
    // Filter transaksi
    let mutasi = transaksiData.filter(t => t.norek === norek);
    
    // Filter transfer (sebagai pengirim atau penerima)
    const transferKeluar = transferData.filter(t => t.dari_rek === norek).map(t => ({
        tanggal: t.tanggal,
        jenis: 'Transfer Keluar',
        jumlah: -parseFloat(t.jumlah),
        keterangan: `Transfer ke ${t.ke_rek}${t.keterangan ? ' - ' + t.keterangan : ''}`
    }));
    
    const transferMasuk = transferData.filter(t => t.ke_rek === norek).map(t => ({
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
        return t.norek === norek && 
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
        return t.dari_rek === norek && 
               (!dariTanggal || new Date(t.tanggal) < new Date(dariTanggal));
    });
    
    const transferSebelumMasuk = transferData.filter(t => {
        return t.ke_rek === norek && 
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
                    <td>: ${nasabah.norek}</td>
                </tr>
                <tr>
                    <td><strong>Nama</strong></td>
                    <td>: ${nasabah.nama}</td>
                </tr>
                <tr>
                    <td><strong>Alamat</strong></td>
                    <td>: ${nasabah.alamat}</td>
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
                    <td style="text-align: right; padding: 15px;">${formatRupiah(parseFloat(nasabah.saldo))}</td>
                </tr>
            </tfoot>
        </table>
        
        <div style="margin-top: 50px; text-align: right;">
            <p>Dicetak pada: ${formatTanggal(new Date().toISOString())}</p>
            <p>Petugas: ${currentUser.nama}</p>
        </div>
    `;
    
    // Preview
    document.getElementById('previewMutasi').innerHTML = `
        <div class="card" style="margin-top: 20px;">
            <div class="card-header">
                <h3 class="card-title">Preview Mutasi</h3>
                <button class="btn btn-success no-print" onclick="window.print()">🖨️ Print</button>
            </div>
            ${html}
        </div>
    `;
    
    // Set print area
    document.getElementById('printArea').innerHTML = html;
}

// Load log aktivitas
async function loadLog() {
    const tbody = document.getElementById('tbodyLog');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Loading...</td></tr>';
    
    const result = await LogAPI.getAll();
    if (result.success) {
        const logs = result.data;
        tbody.innerHTML = '';
        
        logs.forEach(log => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${formatTanggal(log.timestamp)}</td>
                <td>${log.user}</td>
                <td><span class="badge badge-info">${log.role}</span></td>
                <td>${log.aktivitas}</td>
            `;
            tbody.appendChild(tr);
        });
    } else {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:red;">Error loading data</td></tr>';
    }
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
        filteredTransaksi = [...transaksiData];
    }
    
    const resultTransfer = await TransferAPI.getAll();
    if (resultTransfer.success) {
        transferData = resultTransfer.data;
    }
    
    updateStats();
    loadHistori();
    loadLog();
    
    // Set tanggal default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('sampaiTanggal').value = today;
}

loadData();

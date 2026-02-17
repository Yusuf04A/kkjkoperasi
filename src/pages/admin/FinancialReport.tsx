import React, { useEffect, useState } from 'react';
import API from '../../api/api'; // Menggunakan Axios
import { ArrowLeft, TrendingUp, AlertCircle, RefreshCw, Wallet, DollarSign, FileText, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatRupiah } from '../../lib/utils';
import { format } from 'date-fns';
import { id as indonesia } from 'date-fns/locale';
import toast from 'react-hot-toast';

export const AdminFinancialReport = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState({
        totalSimpanan: 0,
        totalPinjaman: 0,
        totalDenda: 0,
        totalAset: 0
    });

    const [mutations, setMutations] = useState<any[]>([]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. AMBIL RINGKASAN DATA (Simpanan, Pinjaman, Denda)
            // Endpoint Laravel: GET /admin/financial/summary
            const summaryRes = await API.get('/admin/financial/summary');
            setSummary(summaryRes.data);

            // 2. AMBIL DATA MUTASI GABUNGAN
            // Endpoint Laravel: GET /admin/financial/mutations
            // Backend bertugas menggabungkan data 'transactions' & 'loans' (Union/Merge)
            const mutationRes = await API.get('/admin/financial/mutations');
            setMutations(mutationRes.data || []);

        } catch (error: any) {
            console.error("Gagal memuat laporan:", error);
            toast.error("Gagal mengambil data keuangan");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // TRIGGER DENDA OTOMATIS
    const handleRunLateFees = async () => {
        const confirm = window.confirm("Jalankan denda otomatis Rp 5.000 untuk yang telat?");
        if (!confirm) return;
        const toastId = toast.loading('Memproses denda...');
        try {
            // Endpoint Laravel: POST /admin/financial/apply-late-fees
            const response = await API.post('/admin/financial/apply-late-fees');
            toast.success(response.data.message || "Denda berhasil diterapkan", { id: toastId });
            fetchData(); // Refresh data
        } catch (err: any) {
            toast.error('Gagal: ' + (err.response?.data?.message || err.message), { id: toastId });
        }
    };

    // EXPORT CSV
    const handleExportMergedCSV = () => {
        if (mutations.length === 0) return toast.error("Tidak ada data");
        
        const date = new Date().toLocaleDateString('id-ID');
        let csvContent = "data:text/csv;charset=utf-8,"
            + "TANGGAL,JAM,NAMA MEMBER,TIPE TRANSAKSI,ARUS KAS,NOMINAL\n";

        mutations.forEach(m => {
            const dateObj = new Date(m.date);
            const dateStr = format(dateObj, 'dd/MM/yyyy');
            const timeStr = format(dateObj, 'HH:mm');
            const arus = m.is_income ? "MASUK (+)" : "KELUAR (-)";
            const nominal = m.is_income ? m.amount : -m.amount;

            csvContent += `${dateStr},${timeStr},"${m.user}","${m.type.toUpperCase()}",${arus},${nominal}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Laporan_Keuangan_KKJ_${date.replace(/\//g, '-')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Laporan berhasil diunduh");
    };

    return (
        <div className="p-6 max-w-6xl mx-auto min-h-screen bg-gray-50 pb-20">
            <div className="flex justify-between items-center mb-6">
                <button onClick={() => navigate('/admin/dashboard')} className="flex items-center gap-2 text-gray-500 hover:text-[#003366] font-bold transition-colors">
                    <ArrowLeft size={20} /> Kembali
                </button>
                <button onClick={fetchData} className="p-2 bg-white rounded-lg border hover:bg-gray-50 text-gray-500 shadow-sm">
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Laporan Keuangan</h1>
                    <p className="text-sm text-gray-500">Ringkasan Aset & Arus Kas Real-time Koperasi.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleExportMergedCSV} className="bg-[#003366] text-white px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-[#002244] shadow-md transition-all active:scale-95">
                        <FileText size={18} /> Download Laporan
                    </button>
                    <button onClick={handleRunLateFees} className="bg-rose-600 text-white px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-rose-700 shadow-lg transition-all active:scale-95">
                        <AlertCircle size={18} /> Cek Denda
                    </button>
                </div>
            </div>

            {/* 1. RINGKASAN KARTU */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Wallet size={80} className="text-blue-600" /></div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Total Simpanan</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-2">{formatRupiah(summary.totalSimpanan)}</h3>
                    <p className="text-[10px] text-blue-600 mt-3 bg-blue-50 px-2 py-1 rounded w-fit font-black uppercase border border-blue-100">Kewajiban Anggota</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><TrendingUp size={80} className="text-orange-600" /></div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Pinjaman Beredar</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-2">{formatRupiah(summary.totalPinjaman)}</h3>
                    <p className="text-[10px] text-orange-600 mt-3 bg-orange-50 px-2 py-1 rounded w-fit font-black uppercase border border-orange-100">Piutang Lancar</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><DollarSign size={80} className="text-green-600" /></div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Total Denda</p>
                    <h3 className="text-3xl font-bold text-green-600 mt-2">{formatRupiah(summary.totalDenda)}</h3>
                    <p className="text-[10px] text-green-600 mt-3 bg-green-50 px-2 py-1 rounded w-fit font-black uppercase border border-green-100">Profit Operasional</p>
                </div>
            </div>

            {/* 2. TABEL MUTASI */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 text-lg">Jurnal Arus Kas (Mutasi)</h3>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Data Real-time</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 uppercase text-[10px] tracking-widest">
                            <tr>
                                <th className="p-4 font-black">Waktu</th>
                                <th className="p-4 font-black">Member</th>
                                <th className="p-4 font-black">Keterangan</th>
                                <th className="p-4 font-black text-right">Nominal</th>
                                <th className="p-4 font-black text-center">Arus</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {loading ? (
                                <tr><td colSpan={5} className="p-12 text-center text-gray-400 font-medium italic"><Loader2 className="animate-spin inline mr-2" /> Menyiapkan laporan...</td></tr>
                            ) : mutations.length === 0 ? (
                                <tr><td colSpan={5} className="p-12 text-center text-gray-400 italic">Belum ada aktivitas kas periode ini.</td></tr>
                            ) : mutations.map((m, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 text-gray-500">
                                        <div className="font-bold text-gray-700">{format(new Date(m.date), 'dd MMM yyyy', { locale: indonesia })}</div>
                                        <div className="text-[10px] uppercase font-medium">{format(new Date(m.date), 'HH:mm')} WIB</div>
                                    </td>
                                    <td className="p-4 font-bold text-gray-900">{m.user}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter border ${
                                            m.category === 'LOAN_DISBURSEMENT' 
                                            ? 'bg-purple-50 text-purple-700 border-purple-100' 
                                            : 'bg-gray-50 text-gray-600 border-gray-200'
                                        }`}>
                                            {m.type.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className={`p-4 text-right font-mono font-bold text-base ${m.is_income ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {m.is_income ? '+' : '-'} {formatRupiah(m.amount)}
                                    </td>
                                    <td className="p-4 text-center">
                                        {m.is_income ? (
                                            <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black tracking-widest border border-emerald-100">
                                                <ArrowDownLeft size={12} /> MASUK
                                            </div>
                                        ) : (
                                            <div className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 px-3 py-1 rounded-full text-[10px] font-black tracking-widest border border-rose-100">
                                                <ArrowUpRight size={12} /> KELUAR
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
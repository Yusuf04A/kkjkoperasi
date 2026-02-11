import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, TrendingUp, AlertCircle, RefreshCw, Wallet, DollarSign, Download, FileText, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatRupiah } from '../../lib/utils';
import { format } from 'date-fns';
import { id as indonesia } from 'date-fns/locale';
import toast from 'react-hot-toast';

export const AdminFinancialReport = () => {
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState({
        totalSimpanan: 0,
        totalPinjaman: 0,
        totalDenda: 0,
        totalAset: 0
    });

    // STATE UNTUK TABEL MUTASI GABUNGAN
    const [mutations, setMutations] = useState<any[]>([]);

    const fetchData = async () => {
        setLoading(true);

        // --- 1. RINGKASAN ATAS (Sama seperti sebelumnya) ---
        const { data: profiles } = await supabase.from('profiles').select('tapro_balance');
        const sumSimpanan = profiles?.reduce((acc, curr) => acc + (curr.tapro_balance || 0), 0) || 0;

        const { data: installments } = await supabase.from('installments').select('amount').eq('status', 'unpaid');
        const sumPinjaman = installments?.reduce((acc, curr) => acc + curr.amount, 0) || 0;

        const { data: fines } = await supabase.from('installments').select('penalty').gt('penalty', 0);
        const sumDenda = fines?.reduce((acc, curr) => acc + curr.penalty, 0) || 0;

        setSummary({
            totalSimpanan: sumSimpanan,
            totalPinjaman: sumPinjaman,
            totalDenda: sumDenda,
            totalAset: sumSimpanan + sumPinjaman
        });

        // --- 2. AMBIL DATA MUTASI (GABUNGAN TRANSAKSI & PINJAMAN) ---

        // A. Ambil Transaksi (Topup, Withdraw, Payment, Transfer)
        const { data: txData } = await supabase
            .from('transactions')
            .select(`*, profiles(full_name, member_id)`)
            .order('created_at', { ascending: false })
            .limit(50); // Ambil 50 terakhir biar ga berat

        // B. Ambil Pencairan Pinjaman (Uang Keluar Modal) - Status Active/Paid
        const { data: loanData } = await supabase
            .from('loans')
            .select(`*, profiles(full_name, member_id)`)
            .neq('status', 'pending')
            .neq('status', 'rejected')
            .order('created_at', { ascending: false })
            .limit(50);

        // C. Standarisasi Data & Gabungkan
        const formattedTx = txData?.map(t => ({
            id: t.id,
            date: t.created_at,
            user: t.profiles?.full_name || 'System',
            type: t.type, // topup, withdraw, payment
            amount: t.amount,
            category: 'TRANSACTION',
            is_income: ['topup', 'transfer_in', 'payment'].includes(t.type) // Logic Uang Masuk
        })) || [];

        const formattedLoans = loanData?.map(l => ({
            id: l.id,
            date: l.created_at, // Tanggal approve/cair
            user: l.profiles?.full_name || 'System',
            type: `Pencairan ${l.type}`, // Label khusus
            amount: l.amount,
            category: 'LOAN_DISBURSEMENT',
            is_income: false // Pinjaman cair = Uang Koperasi Keluar
        })) || [];

        // Gabung dan Sortir berdasarkan Tanggal Terbaru
        const combined = [...formattedTx, ...formattedLoans].sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        setMutations(combined);
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    // TRIGGER DENDA
    const handleRunLateFees = async () => {
        const confirm = window.confirm("Jalankan denda otomatis Rp 5.000 untuk yang telat?");
        if (!confirm) return;
        const toastId = toast.loading('Memproses...');
        try {
            const { data, error } = await supabase.rpc('apply_late_fees');
            if (error) throw error;
            toast.success(data, { id: toastId });
            fetchData();
        } catch (err: any) {
            toast.error('Gagal: ' + err.message, { id: toastId });
        }
    };

    // EXPORT CSV MUTASI (YANG SUDAH DIGABUNG)
    const handleExportMergedCSV = () => {
        const date = new Date().toLocaleDateString('id-ID');
        let csvContent = "data:text/csv;charset=utf-8,"
            + "TANGGAL,JAM,NAMA MEMBER,TIPE TRANSAKSI,ARUS KAS,NOMINAL\n";

        mutations.forEach(m => {
            const dateStr = new Date(m.date).toLocaleDateString('id-ID');
            const timeStr = new Date(m.date).toLocaleTimeString('id-ID');
            const arus = m.is_income ? "MASUK (+)" : "KELUAR (-)";
            // Nominal negatif jika keluar
            const nominal = m.is_income ? m.amount : -m.amount;

            csvContent += `${dateStr},${timeStr},"${m.user}","${m.type.toUpperCase()}",${arus},${nominal}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Arus_Kas_Gabungan_${date.replace(/\//g, '-')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Laporan lengkap berhasil diunduh");
    };

    return (
        <div className="p-6 max-w-6xl mx-auto min-h-screen bg-gray-50 pb-20">
            <div className="flex justify-between items-center mb-6">
                <Link to="/admin/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-kkj-blue font-bold">
                    <ArrowLeft size={20} /> Kembali
                </Link>
                <button onClick={fetchData} className="p-2 bg-white rounded-lg border hover:bg-gray-50 text-gray-500"><RefreshCw size={20} /></button>
            </div>

            <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Laporan Keuangan</h1>
                    <p className="text-sm text-gray-500">Ringkasan Aset & Arus Kas Koperasi.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleExportMergedCSV} className="bg-kkj-blue text-white px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-blue-800 shadow-md">
                        <FileText size={18} /> Download Laporan Lengkap
                    </button>
                    <button onClick={handleRunLateFees} className="bg-red-600 text-white px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-red-700 shadow-lg">
                        <AlertCircle size={18} /> Cek Denda
                    </button>
                </div>
            </div>

            {/* 1. KARTU RINGKASAN */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Wallet size={80} className="text-blue-600" /></div>
                    <p className="text-sm font-bold text-gray-400 uppercase">Total Simpanan</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-2">{formatRupiah(summary.totalSimpanan)}</h3>
                    <p className="text-xs text-blue-600 mt-2 bg-blue-50 px-2 py-1 rounded w-fit font-bold">KEWAJIBAN</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingUp size={80} className="text-orange-600" /></div>
                    <p className="text-sm font-bold text-gray-400 uppercase">Pinjaman Beredar</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-2">{formatRupiah(summary.totalPinjaman)}</h3>
                    <p className="text-xs text-orange-600 mt-2 bg-orange-50 px-2 py-1 rounded w-fit font-bold">PIUTANG</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><DollarSign size={80} className="text-green-600" /></div>
                    <p className="text-sm font-bold text-gray-400 uppercase">Total Denda</p>
                    <h3 className="text-3xl font-bold text-green-600 mt-2">{formatRupiah(summary.totalDenda)}</h3>
                    <p className="text-xs text-green-600 mt-2 bg-green-50 px-2 py-1 rounded w-fit font-bold">PROFIT</p>
                </div>
            </div>

            {/* 2. TABEL ARUS KAS (MUTASI) */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 text-lg">Jurnal Arus Kas (Mutasi)</h3>
                    <span className="text-xs text-gray-500">Menampilkan 50 data terakhir</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-xs">
                            <tr>
                                <th className="p-4 font-bold">Waktu</th>
                                <th className="p-4 font-bold">Member</th>
                                <th className="p-4 font-bold">Keterangan</th>
                                <th className="p-4 font-bold text-right">Nominal</th>
                                <th className="p-4 font-bold text-center">Arus</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {mutations.map((m, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 text-gray-500">
                                        <div className="font-bold text-gray-700">{format(new Date(m.date), 'dd MMM yyyy', { locale: indonesia })}</div>
                                        <div className="text-xs">{format(new Date(m.date), 'HH:mm')}</div>
                                    </td>
                                    <td className="p-4 font-medium text-gray-900">{m.user}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${m.category === 'LOAN_DISBURSEMENT' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {m.type.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right font-mono font-bold text-base">
                                        {formatRupiah(m.amount)}
                                    </td>
                                    <td className="p-4 text-center">
                                        {m.is_income ? (
                                            <div className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                                                <ArrowDownLeft size={14} /> MASUK
                                            </div>
                                        ) : (
                                            <div className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">
                                                <ArrowUpRight size={14} /> KELUAR
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {mutations.length === 0 && (
                        <div className="p-10 text-center text-gray-400">Belum ada data mutasi.</div>
                    )}
                </div>
            </div>
        </div>
    );
};
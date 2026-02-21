import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
    Check, X, Loader2, RefreshCw, ArrowLeft, Eye, Clock, 
    CheckCircle, XCircle, ArrowDownLeft, ArrowUpRight, 
    Wallet, Banknote, Download, AlertTriangle 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { formatRupiah } from '../../lib/utils';
import { id as indonesia } from 'date-fns/locale';
import * as XLSX from 'xlsx';

export const AdminTransactions = () => {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

    // STATE UNTUK CUSTOM MODAL CONFIRMATION
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        type: 'approve' | 'reject';
        tx: any;
    }>({
        isOpen: false,
        type: 'approve',
        tx: null
    });

    const [rejectReason, setRejectReason] = useState('');

    const fetchTransactions = async () => {
        setLoading(true);
        let query = supabase
            .from('transactions')
            .select(`
                *,
                profiles ( full_name, member_id )
            `)
            .order('created_at', { ascending: false });

        if (activeTab === 'pending') {
            query = query.eq('status', 'pending');
        } else {
            query = query.neq('status', 'pending');
        }

        const { data, error } = await query;
        if (error) {
            toast.error("Gagal ambil data");
        } else {
            setTransactions(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchTransactions();
    }, [activeTab]);

    const exportToExcel = () => {
        if (transactions.length === 0) {
            toast.error("Tidak ada data untuk di-export");
            return;
        }
        const excelData = transactions.map((tx) => ({
            'Tanggal': format(new Date(tx.created_at), 'dd/MM/yyyy HH:mm'),
            'ID Anggota': tx.profiles?.member_id || '-',
            'Nama Anggota': tx.profiles?.full_name || 'System',
            'Tipe': getTypeConfig(tx.type).label,
            'Nominal': tx.amount,
            'Status': tx.status.toUpperCase(),
            'Keterangan': tx.description || '-'
        }));
        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Transaksi");
        XLSX.writeFile(wb, `Laporan_Transaksi_${activeTab}.xlsx`);
        toast.success("Excel berhasil diunduh");
    };

    // 🔥 LOGIKA KONFIRMASI (DIJALANKAN DARI MODAL)
    const handleConfirmAction = async () => {
        const { tx, type } = confirmModal;
        if (!tx) return;

        const toastId = toast.loading(type === 'approve' ? 'Menyetujui...' : 'Menolak...');
        try {
            if (type === 'approve') {
                let rpcName = tx.type === 'withdraw' ? 'approve_withdraw' : 'approve_topup';
                const { error } = await supabase.rpc(rpcName, { transaction_id: tx.id });
                if (error) throw error;
                toast.success('Transaksi Berhasil Disetujui!', { id: toastId });
            } else {
                if (!rejectReason.trim()) throw new Error("Alasan penolakan wajib diisi");
                
                // 🔥 PERBAIKAN: Menggunakan status 'failed' agar sesuai database constraint
                const { error } = await supabase
                    .from('transactions')
                    .update({ 
                        status: 'failed', 
                        description: rejectReason 
                    })
                    .eq('id', tx.id);
                
                if (error) throw error;
                toast.success('Transaksi Telah Ditolak.', { id: toastId });
            }
            
            fetchTransactions();
            setConfirmModal({ isOpen: false, type: 'approve', tx: null });
            setRejectReason('');
        } catch (err: any) {
            toast.error(`Gagal: ${err.message}`, { id: toastId });
        }
    };

    const getTypeConfig = (type: string) => {
        switch (type) {
            case 'topup': return { label: 'Isi Saldo', color: 'bg-green-100 text-green-700', icon: <ArrowDownLeft size={16} /> };
            case 'withdraw': return { label: 'Tarik Tunai', color: 'bg-red-100 text-red-700', icon: <ArrowUpRight size={16} /> };
            case 'payment': return { label: 'Bayar Cicilan', color: 'bg-indigo-100 text-indigo-700', icon: <Banknote size={16} /> };
            default: return { label: type, color: 'bg-gray-100 text-gray-700', icon: <Clock size={16} /> };
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50 font-sans text-slate-900">
            {/* Header */}
            <div className="mb-6">
                <Link to="/admin/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-[#136f42] mb-4 w-fit transition-colors text-sm font-medium">
                    <ArrowLeft size={18} /> Kembali
                </Link>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Data Transaksi Admin</h1>
                        <p className="text-sm text-gray-500">Monitoring Top Up, Penarikan, dan Pembayaran.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={exportToExcel} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm transition-all text-sm font-bold">
                            <Download size={18} /> Export Excel
                        </button>
                        <button onClick={fetchTransactions} className="p-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">
                            <RefreshCw size={20} className={loading ? "animate-spin text-[#136f42]" : ""} />
                        </button>
                    </div>
                </div>
            </div>

            {/* TAB MENU */}
            <div className="flex gap-4 mb-6 border-b border-gray-200">
                {(['pending', 'history'] as const).map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-3 px-4 font-bold text-sm transition-colors relative ${activeTab === tab ? 'text-[#136f42]' : 'text-gray-400'}`}>
                        {tab === 'pending' ? 'Menunggu Approval' : 'Riwayat Transaksi'}
                        {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#136f42] rounded-t-full"></div>}
                    </button>
                ))}
            </div>

            {/* Tabel */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Anggota</th>
                                <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tipe</th>
                                <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nominal</th>
                                <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Bukti</th>
                                <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {loading ? (
                                <tr><td colSpan={6} className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-[#136f42]" /></td></tr>
                            ) : transactions.length === 0 ? (
                                <tr><td colSpan={6} className="p-12 text-center text-gray-400 italic py-20">Tidak ada data transaksi.</td></tr>
                            ) : (
                                transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4">
                                            <p className="font-bold text-gray-900">{tx.profiles?.full_name}</p>
                                            <p className="text-[10px] text-gray-400 font-mono uppercase">{tx.profiles?.member_id}</p>
                                        </td>
                                        <td className="p-4">
                                            <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full w-fit text-[10px] font-black uppercase tracking-tighter ${getTypeConfig(tx.type).color}`}>
                                                {getTypeConfig(tx.type).icon} {getTypeConfig(tx.type).label}
                                            </div>
                                        </td>
                                        <td className="p-4 font-mono font-bold">{formatRupiah(tx.amount)}</td>
                                        <td className="p-4">
                                            {tx.proof_url ? (
                                                <button onClick={() => setSelectedImage(tx.proof_url)} className="text-[#136f42] hover:underline text-[10px] font-bold flex items-center gap-1">
                                                    <Eye size={12} /> LIHAT BUKTI
                                                </button>
                                            ) : <span className="text-[10px] text-gray-300 font-bold uppercase">N/A</span>}
                                        </td>
                                        <td className="p-4">
                                            {tx.status === 'pending' && <span className="flex items-center gap-1.5 text-[10px] font-bold text-orange-500 uppercase tracking-wider"><Clock size={12} /> Pending</span>}
                                            {tx.status === 'success' && <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-600 uppercase tracking-wider"><CheckCircle size={12} /> Sukses</span>}
                                            {tx.status === 'failed' && <span className="flex items-center gap-1.5 text-[10px] font-bold text-red-500 uppercase tracking-wider"><XCircle size={12} /> Ditolak</span>}
                                        </td>
                                        <td className="p-4 text-right">
                                            {activeTab === 'pending' ? (
                                                <div className="flex gap-2 justify-end">
                                                    <button onClick={() => setConfirmModal({ isOpen: true, type: 'reject', tx })} className="p-2 text-red-400 hover:text-red-600">
                                                        <X size={18} />
                                                    </button>
                                                    <button onClick={() => setConfirmModal({ isOpen: true, type: 'approve', tx })} className="px-4 py-2 bg-green-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">
                                                        <Check size={14} className="inline mr-1" /> Setujui
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-gray-400 font-bold font-mono">
                                                    {format(new Date(tx.created_at), 'dd/MM/yy, HH:mm')}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 🔥 POPUP CUSTOM MODAL CONFIRMATION 🔥 */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl relative animate-in zoom-in-95 duration-200 border border-white/20 text-center">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${confirmModal.type === 'approve' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                            {confirmModal.type === 'approve' ? <CheckCircle size={32} /> : <AlertTriangle size={32} />}
                        </div>
                        
                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-2">
                            {confirmModal.type === 'approve' ? 'Konfirmasi Persetujuan' : 'Konfirmasi Penolakan'}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">
                            Apakah anda yakin ingin {confirmModal.type === 'approve' ? 'menyetujui' : 'menolak'} {getTypeConfig(confirmModal.tx.type).label} sebesar <b>{formatRupiah(confirmModal.tx.amount)}</b> untuk <b>{confirmModal.tx.profiles?.full_name}</b>?
                        </p>

                        {confirmModal.type === 'reject' && (
                            <textarea
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs mb-6 outline-none focus:border-red-500 transition-all h-20 resize-none font-medium"
                                placeholder="Tuliskan alasan penolakan..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                autoFocus
                            />
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => {
                                setConfirmModal({ isOpen: false, type: 'approve', tx: null });
                                setRejectReason('');
                            }} className="py-3 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs uppercase tracking-widest active:scale-95 transition-transform">
                                Batal
                            </button>
                            <button onClick={handleConfirmAction} className={`py-3 text-white font-bold rounded-xl text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-transform ${confirmModal.type === 'approve' ? 'bg-green-600 shadow-green-900/20' : 'bg-red-600 shadow-red-900/20'}`}>
                                Ya, {confirmModal.type === 'approve' ? 'Setujui' : 'Tolak'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL FOTO BUKTI */}
            {selectedImage && (
                <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
                    <div className="bg-white p-2 rounded-2xl max-w-lg w-full relative shadow-2xl" onClick={e => e.stopPropagation()}>
                        <img src={selectedImage} alt="Bukti" className="w-full h-auto rounded-xl" />
                        <button onClick={() => setSelectedImage(null)} className="absolute -top-3 -right-3 bg-white text-gray-900 p-2 rounded-full shadow-xl hover:bg-gray-100 transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
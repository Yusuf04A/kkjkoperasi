import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Check, X, Loader2, RefreshCw, ArrowLeft, Eye, Clock, CheckCircle, XCircle, ArrowDownLeft, ArrowUpRight, Wallet, Banknote } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { formatRupiah } from '../../lib/utils';
import { id as indonesia } from 'date-fns/locale';

export const AdminTransactions = () => {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

    const fetchTransactions = async () => {
        setLoading(true);

        let query = supabase
            .from('transactions')
            .select(`
                *,
                profiles ( full_name, member_id )
            `)
            .order('created_at', { ascending: false });

        // Filter Tab
        if (activeTab === 'pending') {
            query = query.eq('status', 'pending');
        } else {
            query = query.neq('status', 'pending'); // History (Success/Failed)
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

    const handleApprove = async (tx: any) => {
        const isTopup = tx.type === 'topup';
        const actionText = isTopup ? 'Top Up' : 'Penarikan';

        const confirm = window.confirm(`Setujui ${actionText} Rp ${formatRupiah(tx.amount)} untuk ${tx.profiles?.full_name}?`);
        if (!confirm) return;

        const toastId = toast.loading('Memproses...');
        try {
            let rpcName = 'approve_topup';
            if (tx.type === 'withdraw') {
                rpcName = 'approve_withdraw';
            }

            // Panggil RPC
            const { error } = await supabase.rpc(rpcName, { transaction_id: tx.id });

            if (error) throw error;
            toast.success('Berhasil disetujui!', { id: toastId });
            fetchTransactions();
        } catch (err: any) {
            toast.error(`Gagal: ${err.message}`, { id: toastId });
        }
    };

    const handleReject = async (id: string) => {
        const reason = window.prompt("Alasan penolakan:");
        if (!reason) return;

        const toastId = toast.loading('Menolak...');
        try {
            const { error } = await supabase
                .from('transactions')
                .update({ status: 'rejected', description: reason }) // Simpan alasan di description
                .eq('id', id);

            if (error) throw error;
            toast.success('Transaksi ditolak.', { id: toastId });
            fetchTransactions();
        } catch (err: any) {
            toast.error(`Gagal: ${err.message}`, { id: toastId });
        }
    };

    // Helper untuk Icon & Warna Tipe Transaksi
    const getTypeConfig = (type: string) => {
        switch (type) {
            case 'topup':
                return { label: 'Isi Saldo', color: 'bg-green-100 text-green-700', icon: <ArrowDownLeft size={16} /> };
            case 'withdraw':
                return { label: 'Tarik Tunai', color: 'bg-red-100 text-red-700', icon: <ArrowUpRight size={16} /> };
            case 'transfer_in':
                return { label: 'Terima Uang', color: 'bg-blue-100 text-blue-700', icon: <Wallet size={16} /> };
            case 'transfer_out':
                return { label: 'Kirim Uang', color: 'bg-orange-100 text-orange-700', icon: <Wallet size={16} /> };
            case 'payment':
                return { label: 'Bayar Cicilan', color: 'bg-indigo-100 text-indigo-700', icon: <Banknote size={16} /> };
            default:
                return { label: type, color: 'bg-gray-100 text-gray-700', icon: <Clock size={16} /> };
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50">

            {/* Header */}
            <div className="mb-6">
                <Link to="/admin/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-kkj-blue mb-4 w-fit">
                    <ArrowLeft size={18} /> Kembali
                </Link>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Data Transaksi</h1>
                        <p className="text-sm text-gray-500">Monitoring Top Up, Penarikan, dan Pembayaran.</p>
                    </div>
                    <button onClick={fetchTransactions} className="p-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 shadow-sm transition-transform active:scale-95">
                        <RefreshCw size={20} />
                    </button>
                </div>
            </div>

            {/* TAB MENU */}
            <div className="flex gap-4 mb-6 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`pb-3 px-4 font-bold text-sm transition-colors relative ${activeTab === 'pending' ? 'text-kkj-blue' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    Menunggu Approval
                    {activeTab === 'pending' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-kkj-blue rounded-t-full"></div>}
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`pb-3 px-4 font-bold text-sm transition-colors relative ${activeTab === 'history' ? 'text-kkj-blue' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    Riwayat Transaksi
                    {activeTab === 'history' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-kkj-blue rounded-t-full"></div>}
                </button>
            </div>

            {/* Tabel */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Anggota</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Tipe</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Nominal</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Bukti</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={6} className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-kkj-blue" /></td></tr>
                            ) : transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center flex flex-col items-center text-gray-500 py-20">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                            {activeTab === 'pending' ? <Check size={32} className="text-green-500" /> : <Clock size={32} className="text-gray-400" />}
                                        </div>
                                        <p className="font-medium">Tidak ada data {activeTab === 'pending' ? 'pending' : 'riwayat'}.</p>
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((tx) => {
                                    const typeConfig = getTypeConfig(tx.type);

                                    return (
                                        <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-4">
                                                <p className="font-bold text-gray-900 text-sm">{tx.profiles?.full_name || 'System / Unknown'}</p>
                                                <p className="text-xs text-gray-400">{tx.profiles?.member_id}</p>
                                            </td>
                                            <td className="p-4">
                                                <div className={`flex items-center gap-2 px-2 py-1 rounded-md w-fit text-xs font-bold ${typeConfig.color}`}>
                                                    {typeConfig.icon} {typeConfig.label}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <p className="font-mono font-bold text-gray-800 text-sm">{formatRupiah(tx.amount)}</p>
                                            </td>
                                            <td className="p-4">
                                                {tx.proof_url ? (
                                                    <button onClick={() => setSelectedImage(tx.proof_url)} className="text-kkj-blue hover:underline text-xs flex items-center gap-1 font-medium bg-blue-50 px-2 py-1 rounded">
                                                        <Eye size={14} /> Lihat
                                                    </button>
                                                ) : <span className="text-xs text-gray-300">-</span>}
                                            </td>
                                            <td className="p-4">
                                                {tx.status === 'pending' && <span className="flex items-center gap-1 text-xs font-bold text-orange-500"><Clock size={14} /> Pending</span>}
                                                {tx.status === 'success' && <span className="flex items-center gap-1 text-xs font-bold text-green-500"><CheckCircle size={14} /> Sukses</span>}
                                                {(tx.status === 'failed' || tx.status === 'rejected') && <span className="flex items-center gap-1 text-xs font-bold text-red-500"><XCircle size={14} /> Ditolak</span>}
                                            </td>
                                            <td className="p-4 text-right">
                                                {activeTab === 'pending' ? (
                                                    <div className="flex gap-2 justify-end">
                                                        <button onClick={() => handleReject(tx.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg border border-red-100 transition-colors" title="Tolak">
                                                            <X size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleApprove(tx)}
                                                            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-bold flex items-center gap-2 transition-colors shadow-sm"
                                                        >
                                                            <Check size={14} /> Setujui
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400 font-medium">
                                                        {format(new Date(tx.created_at), 'dd MMM yyyy, HH:mm', { locale: indonesia })}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL FOTO BUKTI */}
            {selectedImage && (
                <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
                    <div className="bg-white p-2 rounded-xl max-w-lg max-h-[90vh] overflow-auto relative shadow-2xl animate-in fade-in zoom-in duration-200">
                        <img src={selectedImage} alt="Bukti" className="w-full h-auto rounded-lg" />
                        <button className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
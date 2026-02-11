import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";
import { formatRupiah } from "../../lib/utils";
import { 
    ArrowLeft, Check, X, RefreshCw, Clock, Coins, 
    FileText, Calendar, Loader2, Archive, CheckCircle 
} from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { id as indonesia } from "date-fns/locale";
import { Link } from "react-router-dom";

export const AdminTamasa = () => {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Tab State: Menggunakan pending dan history (approved/rejected)
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

    const fetchTransactions = async () => {
        setLoading(true);
        let query = supabase
            .from("tamasa_transactions")
            .select(`*, profiles!fk_final_tamasa_trx (full_name, member_id, phone)`)
            .order("created_at", { ascending: false });

        if (activeTab === 'pending') {
            query = query.eq('status', 'pending');
        } else {
            query = query.neq('status', 'pending');
        }

        const { data, error } = await query;
        if (error) {
            toast.error(`Gagal: ${error.message}`);
        } else {
            setTransactions(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchTransactions();
    }, [activeTab]);

    const handleApprove = async (tx: any) => {
        const confirm = window.confirm(`Setujui pembelian emas ${tx.estimasi_gram.toFixed(4)} gram?`);
        if (!confirm) return;
        const toastId = toast.loading("Memproses...");

        try {
            const { data: balance } = await supabase.from("tamasa_balances").select("*").eq("user_id", tx.user_id).maybeSingle();
            if (balance) {
                await supabase.from("tamasa_balances").update({ total_gram: balance.total_gram + tx.estimasi_gram }).eq("user_id", tx.user_id);
            } else {
                await supabase.from("tamasa_balances").insert({ user_id: tx.user_id, total_gram: tx.estimasi_gram });
            }

            await supabase.from("tamasa_transactions").update({ status: "approved", approved_at: new Date().toISOString() }).eq("id", tx.id);
            await supabase.from("notifications").insert({ 
                user_id: tx.user_id, 
                title: "TAMASA Disetujui", 
                message: `Pembelian emas ${tx.estimasi_gram.toFixed(4)} gr sukses.`, 
                type: "success" 
            });

            toast.success("Disetujui!", { id: toastId });
            fetchTransactions();
        } catch (err: any) {
            toast.error("Gagal: " + err.message, { id: toastId });
        }
    };

    const handleReject = async (tx: any) => {
        if (!window.confirm("Tolak dan kembalikan saldo user?")) return;
        const toastId = toast.loading("Menolak...");
        try {
            await supabase.from("tamasa_transactions").update({ status: "rejected", approved_at: new Date().toISOString() }).eq("id", tx.id);
            const { data: userProfile } = await supabase.from('profiles').select('tapro_balance').eq('id', tx.user_id).single();
            
            if (userProfile) {
                await supabase.from('profiles').update({ tapro_balance: userProfile.tapro_balance + tx.setoran }).eq('id', tx.user_id);
                await supabase.from('transactions').insert({
                    user_id: tx.user_id,
                    type: 'topup',
                    amount: tx.setoran,
                    status: 'success',
                    description: 'Refund TAMASA Ditolak Admin'
                });
            }
            toast.success("Ditolak & Dana Dikembalikan", { id: toastId });
            fetchTransactions();
        } catch (err) {
            toast.error("Gagal menolak", { id: toastId });
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50">
            {/* Header */}
            <div className="mb-6">
                <Link to="/admin/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-kkj-blue mb-4 w-fit transition-colors">
                    <ArrowLeft size={18} /> Kembali
                </Link>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Manajemen TAMASA</h1>
                        <p className="text-sm text-gray-500">Verifikasi Setoran Tabungan Emas Anggota</p>
                    </div>
                    <button onClick={fetchTransactions} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-all active:scale-95">
                        <RefreshCw size={20} />
                    </button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto no-scrollbar">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`pb-3 px-4 font-bold text-sm transition-colors whitespace-nowrap relative flex items-center gap-2 ${activeTab === 'pending' ? 'text-kkj-blue' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <Clock size={16} /> Menunggu Konfirmasi
                    {activeTab === 'pending' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-kkj-blue rounded-t-full"></div>}
                </button>

                <button
                    onClick={() => setActiveTab('history')}
                    className={`pb-3 px-4 font-bold text-sm transition-colors whitespace-nowrap relative flex items-center gap-2 ${activeTab === 'history' ? 'text-kkj-blue' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <Archive size={16} /> Riwayat (Selesai)
                    {activeTab === 'history' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-kkj-blue rounded-t-full"></div>}
                </button>
            </div>

            {/* Content Section */}
            <div className="space-y-4">
                {loading ? (
                    <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-kkj-blue" /></div>
                ) : transactions.length === 0 ? (
                    <div className="bg-white p-12 rounded-xl border border-dashed border-gray-300 text-center text-gray-500 flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3 text-gray-300">
                            {activeTab === 'pending' ? <Clock size={32} /> : <CheckCircle size={32} />}
                        </div>
                        <p>Tidak ada data transaksi di tab {activeTab === 'pending' ? 'pending' : 'riwayat'}.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {transactions.map((tx) => (
                            <div key={tx.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-6 hover:shadow-md transition-all duration-300">
                                
                                {/* Info Utama Anggota */}
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-blue-50 text-kkj-blue rounded-full flex items-center justify-center">
                                                <Coins size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">{tx.profiles?.full_name || 'Tanpa Nama'}</h3>
                                                <p className="text-xs text-gray-500 font-mono tracking-wider uppercase">{tx.profiles?.member_id}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                tx.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                tx.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                'bg-orange-100 text-orange-700'
                                            }`}>
                                                {tx.status === 'approved' ? 'Selesai' : tx.status === 'rejected' ? 'Ditolak' : 'Pending'}
                                            </span>
                                            <p className="text-[10px] text-gray-400 mt-1 flex items-center justify-end gap-1">
                                                <Calendar size={10} /> {format(new Date(tx.created_at), 'dd MMM yyyy, HH:mm', { locale: indonesia })}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Grid Detail Transaksi */}
                                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Setoran Tunai</p>
                                            <p className="text-xl font-bold text-kkj-blue">{formatRupiah(tx.setoran)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Perolehan Emas</p>
                                            <p className="text-xl font-bold text-yellow-600">
                                                {tx.estimasi_gram.toFixed(4)} <span className="text-xs font-normal text-gray-400">gr</span>
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {/* Info Tambahan di Riwayat */}
                                    {tx.approved_at && (
                                        <div className="flex items-center gap-2 text-xs text-green-600 font-medium">
                                            <CheckCircle size={14} /> Diproses pada {format(new Date(tx.approved_at), 'dd MMM yyyy', { locale: indonesia })}
                                        </div>
                                    )}
                                </div>

                                {/* Kolom Aksi */}
                                <div className="flex flex-col justify-center gap-3 md:border-l md:pl-6 border-gray-100 min-w-[200px]">
                                    {tx.status === 'pending' ? (
                                        <>
                                            <button 
                                                onClick={() => handleApprove(tx)} 
                                                className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
                                            >
                                                <Check size={18} /> Setujui
                                            </button>
                                            <button 
                                                onClick={() => handleReject(tx)} 
                                                className="w-full py-3 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                                            >
                                                <X size={18} /> Tolak
                                            </button>
                                        </>
                                    ) : (
                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex flex-col items-center justify-center text-center">
                                            <FileText size={24} className="text-gray-300 mb-2" />
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">Transaksi<br/>Telah Diarsipkan</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
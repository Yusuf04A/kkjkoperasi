import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";
import { formatRupiah, cn } from "../../lib/utils";
import { 
    ArrowLeft, Check, X, RefreshCw, Clock, Coins, 
    FileText, Calendar, Loader2, Archive, CheckCircle, Save, TrendingUp
} from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { id as indonesia } from "date-fns/locale";
import { Link } from "react-router-dom";

export const AdminTamasa = () => {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

    // --- STATE HARGA EMAS ---
    const [currentGoldPrice, setCurrentGoldPrice] = useState(0);
    const [newPriceInput, setNewPriceInput] = useState('');
    const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Ambil Harga Emas Terbaru
            const { data: goldData } = await supabase
                .from('gold_prices')
                .select('buy_price')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
            
            if (goldData) setCurrentGoldPrice(goldData.buy_price);

            // 2. Ambil Transaksi
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
            if (error) throw error;
            setTransactions(data || []);
        } catch (err: any) {
            toast.error(`Gagal: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const handlePriceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/\D/g, '');
        setNewPriceInput(rawValue ? parseInt(rawValue).toLocaleString('id-ID') : '');
    };

    const handleUpdateGoldPrice = async (e: React.FormEvent) => {
        e.preventDefault();
        const priceNum = parseInt(newPriceInput.replace(/\./g, ''));
        
        if (!priceNum || priceNum < 100000) return toast.error("Harga tidak valid!");

        setIsUpdatingPrice(true);
        const toastId = toast.loading("Mengupdate harga...");

        try {
            const { error } = await supabase.from('gold_prices').insert({ buy_price: priceNum });
            if (error) throw error;

            toast.success("Harga Emas Berhasil Diperbarui!", { id: toastId });
            setCurrentGoldPrice(priceNum);
            setNewPriceInput('');
        } catch (err: any) {
            toast.error("Gagal update: " + err.message, { id: toastId });
        } finally {
            setIsUpdatingPrice(false);
        }
    };

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
            fetchData();
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
            fetchData();
        } catch (err) {
            toast.error("Gagal menolak", { id: toastId });
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50 font-sans">
            
            {/* HEADER KONSISTEN (SESUAI GAMBAR) */}
            <div className="mb-6">
                <Link to="/admin/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-[#003366] mb-4 w-fit transition-colors text-sm font-medium">
                    <ArrowLeft size={18} /> Kembali
                </Link>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Manajemen TAMASA</h1>
                        <p className="text-sm text-gray-500">Kontrol harga emas & verifikasi setoran anggota</p>
                    </div>
                    <button onClick={fetchData} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-all active:scale-95">
                        <RefreshCw size={20} className={cn(loading && "animate-spin text-[#003366]")} />
                    </button>
                </div>
            </div>

            {/* --- PANEL KONTROL HARGA --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div className="bg-[#003366] rounded-[2rem] p-8 text-white shadow-xl shadow-blue-900/20 flex items-center justify-between relative overflow-hidden group">
                    <div className="absolute right-0 top-0 opacity-10 translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform duration-500">
                        <Coins size={200} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-blue-200 text-xs font-black uppercase tracking-[0.3em] mb-2">Harga Emas Hari Ini</p>
                        <h2 className="text-4xl font-black tracking-tighter">{formatRupiah(currentGoldPrice)}<span className="text-sm font-bold text-blue-300 ml-2">/gram</span></h2>
                        <div className="mt-4 flex items-center gap-2 bg-white/10 w-fit px-3 py-1 rounded-full border border-white/10">
                            <Clock size={12} className="text-blue-300" />
                            <span className="text-[10px] font-bold text-blue-100 uppercase tracking-widest">Update: {format(new Date(), 'dd MMM yyyy')}</span>
                        </div>
                    </div>
                    <div className="hidden lg:block relative z-10">
                        <TrendingUp size={48} className="text-emerald-400" />
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm flex flex-col justify-center">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Perbarui Harga Pasar</h3>
                    <form onSubmit={handleUpdateGoldPrice} className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">Rp</span>
                            <input 
                                type="text"
                                placeholder="Input harga baru..."
                                value={newPriceInput}
                                onChange={handlePriceInputChange}
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-lg font-black text-slate-800 focus:ring-4 focus:ring-blue-50 focus:border-[#003366] outline-none transition-all placeholder:text-slate-300"
                            />
                        </div>
                        <button 
                            disabled={isUpdatingPrice || !newPriceInput}
                            className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-slate-200 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
                        >
                            <Save size={18} /> Update
                        </button>
                    </form>
                </div>
            </div>

            {/* TAB MENU */}
            <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto no-scrollbar">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={cn(
                        "pb-3 px-4 font-bold text-sm transition-colors whitespace-nowrap relative flex items-center gap-2",
                        activeTab === 'pending' ? "text-[#003366]" : "text-gray-400 hover:text-gray-600"
                    )}
                >
                    <Clock size={16} /> Menunggu Konfirmasi
                    {activeTab === 'pending' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#003366] rounded-t-full"></div>}
                </button>

                <button
                    onClick={() => setActiveTab('history')}
                    className={cn(
                        "pb-3 px-4 font-bold text-sm transition-colors whitespace-nowrap relative flex items-center gap-2",
                        activeTab === 'history' ? "text-[#003366]" : "text-gray-400 hover:text-gray-600"
                    )}
                >
                    <Archive size={16} /> Riwayat Transaksi
                    {activeTab === 'history' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#003366] rounded-t-full"></div>}
                </button>
            </div>

            {/* CONTENT */}
            <div className="space-y-4">
                {loading ? (
                    <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-[#003366]" /></div>
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
                            <div key={tx.id} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-8 hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
                                <div className="flex-1 space-y-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-slate-50 text-[#003366] rounded-2xl flex items-center justify-center border border-slate-100 group-hover:scale-110 transition-transform">
                                                <Coins size={28} />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">{tx.profiles?.full_name}</h3>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{tx.profiles?.member_id}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={cn(
                                                "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest mb-1",
                                                tx.status === 'approved' ? 'bg-emerald-50 text-emerald-600' :
                                                tx.status === 'rejected' ? 'bg-rose-50 text-rose-600' :
                                                'bg-amber-50 text-amber-600'
                                            )}>
                                                {tx.status}
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center justify-end gap-1">
                                                <Calendar size={10} /> {format(new Date(tx.created_at), 'dd MMM yyyy, HH:mm', { locale: indonesia })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-50 p-5 rounded-[1.5rem] border border-slate-100">
                                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Setoran Tunai</p>
                                            <p className="text-2xl font-black text-[#003366] tracking-tighter">{formatRupiah(tx.setoran)}</p>
                                        </div>
                                        <div className="bg-slate-50 p-5 rounded-[1.5rem] border border-slate-100">
                                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Perolehan Emas</p>
                                            <p className="text-2xl font-black text-yellow-600 tracking-tighter">
                                                {tx.estimasi_gram.toFixed(4)} <span className="text-xs font-bold text-slate-300">gr</span>
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {tx.approved_at && (
                                        <div className="flex items-center gap-2 text-[10px] text-emerald-600 font-black uppercase tracking-widest bg-emerald-50 w-fit px-3 py-1 rounded-full border border-emerald-100">
                                            <CheckCircle size={12} /> Selesai pada {format(new Date(tx.approved_at), 'dd MMM yyyy', { locale: indonesia })}
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col justify-center gap-3 md:border-l md:pl-8 border-slate-100 min-w-[220px]">
                                    {tx.status === 'pending' ? (
                                        <>
                                            <button 
                                                onClick={() => handleApprove(tx)} 
                                                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                <Check size={18} /> Setujui
                                            </button>
                                            <button 
                                                onClick={() => handleReject(tx)} 
                                                className="w-full py-4 bg-white text-rose-600 border border-rose-100 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-rose-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                <X size={18} /> Tolak
                                            </button>
                                        </>
                                    ) : (
                                        <div className="bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100 flex flex-col items-center justify-center text-center opacity-60">
                                            <FileText size={32} className="text-slate-300 mb-2" />
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Data Transaksi<br/>Telah Diarsipkan</p>
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
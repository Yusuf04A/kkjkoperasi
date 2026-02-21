import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Plus, ArrowRight, FileText, Calendar, Wallet, Info, CheckCircle, Clock, AlertCircle, History, RefreshCw, ChevronRight } from 'lucide-react';
import { formatRupiah, cn } from '../../lib/utils';
import { SuccessModal } from '../../components/SuccessModal'; 

export const FinancingMenu = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation(); 
    
    const [loans, setLoans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'verifikasi' | 'berjalan' | 'riwayat'>('berjalan');

    const [showSuccessModal, setShowSuccessModal] = useState(false);

    useEffect(() => {
        const fetchLoans = async () => {
            if (!user) return;
            const { data } = await supabase
                .from('loans')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (data) {
                setLoans(data);
                const hasPending = data.some(l => l.status === 'pending');
                if (hasPending) setActiveTab('verifikasi');
            }
            setLoading(false);
        };

        const params = new URLSearchParams(location.search);
        if (params.get('success') === 'true') {
            setShowSuccessModal(true);
            window.history.replaceState({}, '', '/pembiayaan');
        }

        fetchLoans();
    }, [user, location]);

    const countPending = useMemo(() => loans.filter(l => l.status === 'pending').length, [loans]);

    // 🔥 LOGIKA FILTER CERDAS: Menyembunyikan "Ditolak" jika sudah ada pengajuan baru 🔥
    const filteredLoans = useMemo(() => {
        // Ambil daftar nama barang yang sedang aktif atau sedang diverifikasi
        const activeItemNames = loans
            .filter(l => l.status === 'active' || l.status === 'pending')
            .map(l => (l.details?.name || l.details?.item || '').toLowerCase());

        if (activeTab === 'verifikasi') {
            return loans.filter(l => l.status === 'pending');
        } else if (activeTab === 'berjalan') {
            return loans.filter(l => l.status === 'active');
        } else {
            // Di tab Riwayat: Tampilkan yang lunas, atau ditolak TAPI yang belum diajukan ulang
            return loans.filter(l => {
                if (l.status === 'paid') return true;
                if (l.status === 'rejected') {
                    const itemName = (l.details?.name || l.details?.item || '').toLowerCase();
                    // JIKA barang ini sudah ada di daftar 'pending' atau 'active', sembunyikan yang 'rejected'
                    const alreadyReapplied = activeItemNames.includes(itemName);
                    return !alreadyReapplied;
                }
                return false;
            });
        }
    }, [loans, activeTab]);

    return (
        <div className="p-4 lg:p-6 space-y-6 min-h-screen bg-gray-50 font-sans text-slate-900 pb-20 text-left">

            {/* --- HERO HEADER --- */}
            <div className="bg-[#136f42] rounded-[2rem] shadow-xl overflow-hidden relative p-6 lg:p-8 flex flex-col md:flex-row justify-between items-center gap-6 min-h-[180px]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#167d4a] to-[#0f5c35] z-0" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 z-0"></div>

                <div className="relative z-10 space-y-2 text-center md:text-left">
                    <div className="flex items-center gap-2 mb-1 justify-center md:justify-start text-left">
                        <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-md border border-white/10">
                            <Wallet size={18} className="text-[#aeea00]" />
                        </div>
                        <span className="text-[9px] font-black text-[#aeea00] uppercase tracking-[0.2em]">Layanan Digital</span>
                    </div>
                    <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">Pembiayaan</h1>
                    <p className="text-green-50/70 text-sm font-medium max-w-xs leading-snug">
                        Solusi dana cepat dan amanah untuk mendukung kebutuhan Anda.
                    </p>
                </div>

                <Link
                    to="/pembiayaan/ajukan"
                    className="relative z-10 bg-[#aeea00] text-[#0f5c35] px-6 py-3 rounded-xl font-black text-xs hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-2 uppercase tracking-wider"
                >
                    <Plus size={16} strokeWidth={3} /> Ajukan Baru
                </Link>
            </div>

            {/* --- DINAMIS TAB NAVIGATION --- */}
            <div className="flex justify-center px-1">
                <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-1 w-full max-w-xl text-left">
                    {countPending > 0 && (
                        <button 
                            onClick={() => setActiveTab('verifikasi')}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                activeTab === 'verifikasi' ? "bg-amber-500 text-white shadow-md shadow-amber-900/20" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <Clock size={14} /> Verifikasi
                        </button>
                    )}
                    
                    <button 
                        onClick={() => setActiveTab('berjalan')}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            activeTab === 'berjalan' ? "bg-[#136f42] text-white shadow-md shadow-green-900/20" : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        <RefreshCw size={14} /> Berjalan
                    </button>

                    <button 
                        onClick={() => setActiveTab('riwayat')}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            activeTab === 'riwayat' ? "bg-[#136f42] text-white shadow-md shadow-green-900/20" : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        <History size={14} /> Riwayat
                    </button>
                </div>
            </div>

            {/* --- LIST CONTENT --- */}
            <div className="flex items-center gap-3 px-1 text-left">
                <h2 className="font-bold text-slate-800 text-base tracking-tight capitalize">
                    {activeTab === 'verifikasi' ? 'Menunggu Konfirmasi Admin' : 
                     activeTab === 'berjalan' ? 'Pembiayaan Aktif' : 'Riwayat Pengajuan'}
                </h2>
                <div className="h-px flex-1 bg-slate-200 rounded-full" />
            </div>

            {loading ? (
                <div className="grid gap-4 md:grid-cols-2 text-left">
                    {[1, 2].map(i => (
                        <div key={i} className="h-32 bg-white rounded-2xl animate-pulse border border-slate-100 shadow-sm" />
                    ))}
                </div>
            ) : filteredLoans.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center space-y-4 italic text-slate-400">
                    <FileText size={32} className="opacity-20" />
                    <p className="text-sm font-medium">Tidak ada data pembiayaan di kategori ini.</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 text-left">
                    {filteredLoans.map((loan) => {
                        const isCatalogRedirect = loan.status === 'rejected' && loan.reason?.toLowerCase().includes('katalog');
                        const itemName = loan.details?.name || loan.details?.item || loan.details?.item_name || '';

                        return (
                            <div key={loan.id} className={cn(
                                "group bg-white p-6 rounded-[2rem] border shadow-sm transition-all relative overflow-hidden flex flex-col",
                                isCatalogRedirect ? 'border-blue-200 bg-blue-50/20 shadow-blue-900/5' : 'border-slate-100 hover:shadow-md'
                            )}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="space-y-0.5 max-w-[70%] text-left">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{loan.type}</p>
                                            {itemName && (
                                                <span className="text-[9px] font-bold text-[#136f42] uppercase tracking-wider bg-green-50 px-2 py-0.5 rounded border border-green-100 truncate">
                                                    - {itemName}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900 tracking-tighter">{formatRupiah(loan.amount)}</h3>
                                    </div>
                                    <span className={cn(
                                        "px-3 py-1 rounded-full text-[9px] font-black uppercase border whitespace-nowrap",
                                        loan.status === 'active' ? 'bg-green-50 text-[#136f42] border-green-100' :
                                            loan.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                loan.status === 'paid' ? 'bg-[#136f42] text-white border-transparent' :
                                                    'bg-rose-50 text-rose-600 border-rose-100'
                                    )}>
                                        {loan.status === 'active' ? 'Berjalan' :
                                            loan.status === 'paid' ? 'Lunas' :
                                                loan.status === 'pending' ? 'Verifikasi' : 'Ditolak'}
                                    </span>
                                </div>

                                <div className="flex items-center gap-3 mb-6">
                                    <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                                        <Calendar size={12} className="text-[#136f42]" />
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">Tenor {loan.duration} Bulan</span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100 mt-auto text-left">
                                    {isCatalogRedirect ? (
                                        <div className="space-y-3">
                                            <div className="flex items-start gap-2 bg-white/50 p-3 rounded-xl border border-blue-100">
                                                <Info size={14} className="text-blue-600 shrink-0 mt-0.5" />
                                                <p className="text-[10px] text-blue-800 font-medium leading-relaxed">
                                                    {loan.reason}
                                                </p>
                                            </div>
                                            <button 
                                                onClick={() => navigate('/pembiayaan/ajukan')}
                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex justify-center items-center gap-2 shadow-lg shadow-blue-900/20 active:scale-95 transition-all"
                                            >
                                                Pilih Dari Katalog <ArrowRight size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-center text-left">
                                            <div>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Cicilan / bln</p>
                                                <p className="text-base font-black text-[#136f42] tracking-tighter">
                                                    {loan.status === 'rejected' ? 'Rp 0' : formatRupiah(loan.monthly_payment)}
                                                </p>
                                            </div>
                                            {(loan.status === 'active' || loan.status === 'paid') && (
                                                <Link to={`/pembiayaan/${loan.id}`} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[#136f42] transition-all shadow-md active:scale-95">
                                                    Detail <ArrowRight size={14} />
                                                </Link>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <p className="text-center text-slate-300 text-[9px] font-bold uppercase tracking-[0.2em] pt-10">
                © 2026 Koperasi Pemasaran Karya Kita Jaya
            </p>

            <SuccessModal 
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                title="PENGAJUAN TERKIRIM!"
                message="Pengajuan pembiayaan Anda telah berhasil dikirim. Admin akan segera melakukan verifikasi dan meninjau berkas Anda dalam maksimal 1x24 jam."
            />
        </div>
    );
};
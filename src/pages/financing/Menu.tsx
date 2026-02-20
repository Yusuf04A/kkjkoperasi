import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, ArrowRight, FileText, Calendar, Wallet, Info, CheckCircle, Clock } from 'lucide-react';
import { formatRupiah, cn } from '../../lib/utils';

export const FinancingMenu = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [loans, setLoans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // STATE BARU: Untuk filter kategori tab
    const [activeTab, setActiveTab] = useState<'berjalan' | 'lunas'>('berjalan');

    useEffect(() => {
        const fetchLoans = async () => {
            if (!user) return;
            const { data } = await supabase
                .from('loans')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (data) setLoans(data);
            setLoading(false);
        };
        fetchLoans();
    }, [user]);

    // LOGIKA FILTER: Memisahkan data berdasarkan tab tanpa mengubah state loans asli
    const filteredLoans = useMemo(() => {
        if (activeTab === 'berjalan') {
            return loans.filter(l => l.status === 'active' || l.status === 'pending');
        } else {
            return loans.filter(l => l.status === 'paid' || l.status === 'rejected');
        }
    }, [loans, activeTab]);

    return (
        <div className="p-4 lg:p-6 space-y-6 min-h-screen bg-gray-50 font-sans">

            {/* --- HERO HEADER (TIDAK BERUBAH) --- */}
            <div className="bg-[#136f42] rounded-[2rem] shadow-xl overflow-hidden relative p-6 lg:p-8 flex flex-col md:flex-row justify-between items-center gap-6 min-h-[180px]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#167d4a] to-[#0f5c35] z-0" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 z-0"></div>

                <div className="relative z-10 space-y-2 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
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

            {/* --- PENAMBAHAN TAB CATEGORY SESUAI REFERENSI --- */}
            <div className="flex justify-center px-1">
                <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-1 w-full max-w-md">
                    <button 
                        onClick={() => setActiveTab('berjalan')}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            activeTab === 'berjalan' ? "bg-[#136f42] text-white shadow-md shadow-green-900/20" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                        )}
                    >
                        <Clock size={14} /> Berjalan
                    </button>
                    <button 
                        onClick={() => setActiveTab('lunas')}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            activeTab === 'lunas' ? "bg-[#136f42] text-white shadow-md shadow-green-900/20" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                        )}
                    >
                        <CheckCircle size={14} /> Riwayat Lunas
                    </button>
                </div>
            </div>

            {/* --- SECTION TITLE (TIDAK BERUBAH) --- */}
            <div className="flex items-center gap-3 px-1">
                <h2 className="font-bold text-slate-800 text-base tracking-tight">
                    {activeTab === 'berjalan' ? 'Pembiayaan Berjalan' : 'Riwayat Pengajuan'}
                </h2>
                <div className="h-px flex-1 bg-slate-200 rounded-full" />
            </div>

            {/* --- CONTENT LIST (LOGIKA FILTER DIUBAH AGAR SESUAI TAB) --- */}
            {loading ? (
                <div className="grid gap-4 md:grid-cols-2">
                    {[1, 2].map(i => (
                        <div key={i} className="h-32 bg-white rounded-2xl animate-pulse border border-slate-100 shadow-sm" />
                    ))}
                </div>
            ) : filteredLoans.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center space-y-4">
                    <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center text-[#136f42]/20">
                        <FileText size={32} />
                    </div>
                    <div className="space-y-1">
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Belum ada data</p>
                        <p className="text-slate-600 text-sm font-medium italic">
                            {activeTab === 'berjalan' ? 'Tidak ada pembiayaan yang sedang berjalan.' : 'Belum ada riwayat pembiayaan yang selesai.'}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {filteredLoans.map((loan) => {
                        const isCatalogRedirect = loan.status === 'rejected' && loan.reason?.toLowerCase().includes('katalog');
                        const itemName = loan.details?.item || 'Pengadaan Barang';

                        return (
                            <div key={loan.id} className={`group bg-white p-5 lg:p-6 rounded-[1.5rem] border shadow-sm hover:shadow-lg transition-all relative overflow-hidden ${isCatalogRedirect ? 'border-blue-100' : 'border-slate-100'}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="space-y-0.5 max-w-[65%]">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                                            {loan.type}
                                        </p>
                                        <h3 className="text-lg font-black text-slate-900 tracking-tight truncate">
                                            {isCatalogRedirect ? itemName : formatRupiah(loan.amount)}
                                        </h3>
                                    </div>
                                    <span className={cn(
                                        "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border whitespace-nowrap",
                                        loan.status === 'active' ? 'bg-green-50 text-green-700 border-green-100' :
                                            loan.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                loan.status === 'paid' ? 'bg-[#136f42] text-white border-transparent' :
                                                    isCatalogRedirect ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                        'bg-rose-50 text-rose-600 border-rose-100'
                                    )}>
                                        {loan.status === 'active' ? 'Berjalan' :
                                            loan.status === 'paid' ? 'Lunas' :
                                                isCatalogRedirect ? 'Cek Katalog' :
                                                    loan.status === 'rejected' ? 'Ditolak' : loan.status}
                                    </span>
                                </div>

                                {!isCatalogRedirect && (
                                    <div className="flex items-center gap-2 mb-5">
                                        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                                            <Calendar size={12} className="text-[#136f42]" />
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">Tenor {loan.duration} Bulan</span>
                                        </div>
                                    </div>
                                )}

                                <div className={`pt-4 flex justify-between items-center ${isCatalogRedirect ? 'border-t border-blue-50' : 'border-t border-slate-50'}`}>
                                    {isCatalogRedirect ? (
                                        <div className="w-full">
                                            <div className="flex gap-2 items-start bg-blue-50 p-3 rounded-xl border border-blue-100 mb-3">
                                                <Info size={14} className="text-blue-600 shrink-0 mt-0.5" />
                                                <p className="text-[11px] text-blue-800 leading-relaxed font-medium">
                                                    Barang sudah diverifikasi Admin dan ada di Katalog. Silakan ajukan ulang untuk melihat simulasi cicilan.
                                                </p>
                                            </div>
                                            <Link
                                                to="/pembiayaan/ajukan"
                                                className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex justify-center items-center gap-1.5 hover:bg-blue-700 transition-colors shadow-md active:scale-95"
                                            >
                                                Pilih dari Katalog <ArrowRight size={14} />
                                            </Link>
                                        </div>
                                    ) : (
                                        <>
                                            <div>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Cicilan / bln</p>
                                                <p className="text-base font-black text-[#136f42] tracking-tight">{formatRupiah(loan.monthly_payment)}</p>
                                            </div>

                                            {loan.status === 'active' || loan.status === 'paid' ? (
                                                <Link
                                                    to={`/pembiayaan/${loan.id}`}
                                                    className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 hover:bg-[#136f42] transition-colors shadow-md active:scale-95"
                                                >
                                                    Detail <ArrowRight size={14} />
                                                </Link>
                                            ) : (
                                                <div className="text-right">
                                                    <p className={cn("text-[9px] font-black uppercase italic", loan.status === 'rejected' ? "text-rose-600" : "text-amber-600")}>
                                                        {loan.status === 'rejected' ? 'Pengajuan Ditolak' : 'Verifikasi Admin'}
                                                    </p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <p className="text-center text-slate-300 text-[9px] font-bold uppercase tracking-[0.2em] pt-6">
                © 2026 Koperasi Pemasaran Karya Kita Jaya
            </p>
        </div>
    );
};
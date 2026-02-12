import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { formatRupiah, cn } from '../../lib/utils';
import { 
    ArrowLeft, TrendingUp, Wallet, ShoppingCart, 
    Zap, Calendar, ChevronRight, Info, Award 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from "date-fns";
import { id as indonesia } from "date-fns/locale";

export const UserLHURiwayat = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [lhuHistory, setLhuHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) fetchUserLHU();
    }, [user]);

    const fetchUserLHU = async () => {
        setLoading(true);
        // Mengambil data detail LHU anggota beserta info periode dari tabel induk
        const { data, error } = await supabase
            .from('lhu_member_details')
            .select(`
                *,
                lhu_distributions (
                    period_month,
                    period_year,
                    status
                )
            `)
            .eq('user_id', user?.id)
            .order('created_at', { ascending: false });

        if (!error) setLhuHistory(data || []);
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans text-slate-900">
            {/* HEADER RAMPING KONSISTEN */}
            <div className="bg-[#003366] text-white p-6 rounded-b-[2.5rem] shadow-xl">
                <div className="max-w-xl mx-auto flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all">
                        <ArrowLeft size={22} />
                    </button>
                    <div>
                        <h1 className="text-xl font-[1000] uppercase tracking-tighter">Riwayat LHU</h1>
                        <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Lebihan Hasil Usaha Anggota</p>
                    </div>
                </div>
            </div>

            <div className="max-w-xl mx-auto px-6 -mt-6 space-y-4">
                {/* RINGKASAN TOTAL LHU */}
                <div className="bg-white rounded-[2rem] p-6 shadow-xl border flex items-center justify-between overflow-hidden relative group">
                    <div className="absolute -right-4 -top-4 text-slate-50 group-hover:text-blue-50 transition-colors duration-500">
                        <Award size={120} strokeWidth={1} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Perolehan Anda</p>
                        <p className="text-2xl font-[1000] text-[#003366]">
                            {formatRupiah(lhuHistory.reduce((acc, curr) => acc + curr.total_received, 0))}
                        </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 text-[#003366] rounded-2xl flex items-center justify-center relative z-10 shadow-inner">
                        <TrendingUp size={24} />
                    </div>
                </div>

                {/* LIST RIWAYAT */}
                <div className="space-y-3">
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Detail Distribusi</h3>
                    
                    {loading ? (
                        <div className="text-center py-20 font-bold text-slate-300 uppercase tracking-widest animate-pulse">Menghitung Data...</div>
                    ) : lhuHistory.length === 0 ? (
                        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-200">
                            <Info size={40} className="mx-auto text-slate-200 mb-3" />
                            <p className="text-sm font-bold text-slate-400">Belum ada distribusi LHU untuk Anda.</p>
                        </div>
                    ) : (
                        lhuHistory.map((item) => (
                            <div key={item.id} className="bg-white rounded-[1.8rem] p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center border border-slate-50 shadow-inner">
                                            <Calendar size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-[1000] text-slate-900 uppercase tracking-tight">
                                                Periode {item.lhu_distributions.period_month} / {item.lhu_distributions.period_year}
                                            </h4>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                                Cair pada {format(new Date(item.created_at), 'dd MMM yyyy', { locale: indonesia })}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-[14px] font-[1000] text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full shadow-sm">
                                        +{formatRupiah(item.total_received)}
                                    </span>
                                </div>

                                {/* BREAKDOWN PORSI - TRANSPARANSI DATA */}
                                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-dashed border-slate-100">
                                    <div className="text-center p-2 rounded-2xl bg-blue-50/50 border border-blue-100/50">
                                        <Wallet size={14} className="mx-auto text-blue-400 mb-1" />
                                        <p className="text-[7px] font-black text-slate-400 uppercase mb-0.5">Simpanan</p>
                                        <p className="text-[10px] font-bold text-blue-700">{formatRupiah(item.portion_savings)}</p>
                                    </div>
                                    <div className="text-center p-2 rounded-2xl bg-amber-50/50 border border-amber-100/50">
                                        <Zap size={14} className="mx-auto text-amber-400 mb-1" />
                                        <p className="text-[7px] font-black text-slate-400 uppercase mb-0.5">Financing</p>
                                        <p className="text-[10px] font-bold text-amber-700">{formatRupiah(item.portion_financing)}</p>
                                    </div>
                                    <div className="text-center p-2 rounded-2xl bg-purple-50/50 border border-purple-100/50">
                                        <ShoppingCart size={14} className="mx-auto text-purple-400 mb-1" />
                                        <p className="text-[7px] font-black text-slate-400 uppercase mb-0.5">Belanja</p>
                                        <p className="text-[10px] font-bold text-purple-700">{formatRupiah(item.portion_shopping)}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* INFO EDUKASI */}
                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 flex gap-3 items-start shadow-sm">
                    <Info size={18} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-amber-700 font-medium leading-relaxed italic">
                        *LHU dibagikan setiap periode berdasarkan partisipasi Anda dalam simpanan, penggunaan pembiayaan (TAMASA/Gadai), dan aktivitas belanja di Toko Koperasi. Semakin aktif Anda, semakin besar hasil usahanya.
                    </p>
                </div>
            </div>
        </div>
    );
};
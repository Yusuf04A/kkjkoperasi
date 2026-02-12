import React, { useEffect, useState } from 'react';
import {
    Users, FileText, ChevronRight, LogOut, ShieldCheck,
    ArrowRightLeft, PieChart, Megaphone, AlertTriangle, Scale, 
    Bell, Settings, Activity, Gem, ShoppingBag,
    PackageCheck, TrendingUp, Receipt
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { cn } from '../../lib/utils';

export const AdminDashboard = () => {
    const { logout, user } = useAuthStore();
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        pendingUsers: 0,
        pendingTx: 0,
        pendingLoans: 0,
        pendingRestructures: 0,
        pendingTamasa: 0,
        pendingPawn: 0,
        pendingOrders: 0,
        pendingLHU: 0, // 🔥 State LHU baru
    });

    const [firstRestructureId, setFirstRestructureId] = useState<string | null>(null);

    const fetchStats = async () => {
        // 1. Verifikasi Anggota
        const { count: pendingMember } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending');
        // 2. Transaksi Keuangan
        const { count: pendingTrans } = await supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('status', 'pending');
        // 3. Pinjaman Baru
        const { count: pendingLoan } = await supabase.from('loans').select('*', { count: 'exact', head: true }).eq('status', 'pending');
        // 4. Restrukturisasi Tenor
        const { data: restructureData } = await supabase.from('loans').select('id').eq('restructure_status', 'pending');
        // 5. TAMASA
        const { count: pendingTamasa } = await supabase.from('tamasa_transactions').select('*', { count: 'exact', head: true }).eq('status', 'pending');
        // 6. Gadai Emas
        const { count: pendingPawn } = await supabase.from('pawn_transactions').select('*', { count: 'exact', head: true }).eq('status', 'pending');
        // 7. Toko: Pesanan Masuk
        const { count: pendingOrders } = await supabase.from('shop_orders').select('*', { count: 'exact', head: true }).eq('status', 'diproses');
        // 8. 🔥 LHU: Pembagian yang menunggu eksekusi
        const { count: pendingLHU } = await supabase.from('lhu_distributions').select('*', { count: 'exact', head: true }).eq('status', 'waiting');

        setStats({
            pendingUsers: pendingMember || 0,
            pendingTx: pendingTrans || 0,
            pendingLoans: pendingLoan || 0,
            pendingRestructures: restructureData?.length || 0,
            pendingTamasa: pendingTamasa || 0,
            pendingPawn: pendingPawn || 0,
            pendingOrders: pendingOrders || 0,
            pendingLHU: pendingLHU || 0,
        });

        if (restructureData && restructureData.length > 0) {
            setFirstRestructureId(restructureData[0].id);
        }
    };

    useEffect(() => {
        fetchStats();
        
        const channel = supabase
            .channel('dashboard-updates')
            .on('postgres_changes', { event: '*', schema: 'public' }, () => fetchStats())
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-12 font-sans">
            {/* TOP BAR RINGKAS */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-50 px-6 py-3 shadow-sm">
                <div className="max-w-[1600px] mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#003366] rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
                            <ShieldCheck className="text-white" size={18} />
                        </div>
                        <h1 className="font-black text-slate-900 tracking-tighter text-base uppercase">KKJ <span className="text-[#003366]">Control Center</span></h1>
                    </div>
                    
                    <div className="flex items-center gap-4">
                         <div className="hidden md:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">System Active</span>
                        </div>
                        <button onClick={handleLogout} className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-all border border-transparent hover:border-rose-100">
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto px-6 pt-6 space-y-8">
                
                {/* HERO SECTION COMPACT */}
                <div className="relative bg-[#003366] rounded-[1.5rem] p-6 md:p-8 overflow-hidden shadow-2xl shadow-blue-900/20">
                    <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-[100px] -mr-32 -mt-32" />
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                        <div className="space-y-2">
                            <h1 className="text-2xl md:text-4xl font-[1000] text-white tracking-tight uppercase leading-none">
                                Halo, {user?.full_name?.split(' ')[0] || 'Admin'}
                            </h1>
                            <p className="text-blue-100/60 text-[10px] font-bold uppercase tracking-[0.3em]">Master Administrator Panel</p>
                        </div>
                        <Link to="/admin/labarugi" className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10 backdrop-blur-sm flex items-center gap-2">
                            <PieChart size={14} /> Keuangan Real-time
                        </Link>
                    </div>
                </div>

                {/* NOTIFIKASI URGENT */}
                {(stats.pendingRestructures > 0 || stats.pendingUsers > 0 || stats.pendingLHU > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {stats.pendingRestructures > 0 && (
                            <AlertCard 
                                to={firstRestructureId ? `/admin/pembiayaan/${firstRestructureId}` : '/admin/pembiayaan'}
                                title={`${stats.pendingRestructures} Request Tenor`}
                                type="danger"
                            />
                        )}
                        {stats.pendingUsers > 0 && (
                            <AlertCard to="/admin/verifikasi" title={`${stats.pendingUsers} Verifikasi Anggota`} type="warning" />
                        )}
                        {stats.pendingLHU > 0 && (
                            <AlertCard to="/admin/lhu" title={`${stats.pendingLHU} Eksekusi LHU`} type="info" />
                        )}
                    </div>
                )}

                {/* 7-COLUMN GRID - INTEGRATED */}
                <div className="space-y-3">
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-1">Layanan Utama Koperasi</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
                        <DashboardCard to="/admin/verifikasi" icon={<Users size={22} />} title="ANGGOTA" color="indigo" count={stats.pendingUsers} />
                        <DashboardCard to="/admin/transaksi" icon={<ArrowRightLeft size={22} />} title="FINANCE" color="emerald" count={stats.pendingTx} />
                        <DashboardCard to="/admin/tamasa" icon={<ShieldCheck size={22} />} title="TAMASA" color="amber" count={stats.pendingTamasa} />
                        <DashboardCard to="/admin/pegadaian" icon={<Scale size={22} />} title="GADAI" color="blue" count={stats.pendingPawn} />
                        <DashboardCard to="/admin/toko" icon={<ShoppingBag size={22} />} title="TOKO" color="violet" count={stats.pendingOrders} />
                        <DashboardCard to="/admin/lhu" icon={<TrendingUp size={22} />} title="LHU" color="emerald" count={stats.pendingLHU} />
                        <DashboardCard to="/admin/labarugi" icon={<Receipt size={22} />} title="LABA RUGI" color="rose" count={0} />
                    </div>
                </div>

                {/* TOOLS & SHORTCUTS */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-4 border-t border-slate-200">
                    <ToolCard to="/admin/kabar" icon={<Megaphone size={16}/>} title="Kabar KKJ" />
                    <ToolCard to="/admin/toko/katalog" icon={<PackageCheck size={16}/>} title="Stok Produk" />
                    <ToolCard to="/admin/labarugi" icon={<PieChart size={16}/>} title="Arus Kas" />
                    <ToolCard to="/admin/lhu" icon={<Activity size={16}/>} title="Bagi Hasil" />
                    <ToolCard to="/admin/pegadaian" icon={<Gem size={16}/>} title="Log Emas" />
                </div>

                <div className="text-center pt-8 border-t border-slate-100">
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.6em]">
                        Internal Control Panel v3.6 • Build 2026.02
                    </p>
                </div>
            </div>
        </div>
    );
};

/* --- SUB-COMPONENTS --- */

const DashboardCard = ({ to, icon, title, color, count }: any) => {
    const colorStyles: any = {
        indigo: "bg-indigo-50 text-indigo-600 shadow-indigo-100",
        emerald: "bg-emerald-50 text-emerald-600 shadow-emerald-100",
        orange: "bg-orange-50 text-orange-600 shadow-orange-100",
        amber: "bg-amber-50 text-amber-600 shadow-amber-100",
        blue: "bg-blue-50 text-blue-600 shadow-blue-100",
        violet: "bg-violet-50 text-violet-600 shadow-violet-100",
        rose: "bg-rose-50 text-rose-600 shadow-rose-100",
    };

    return (
        <Link to={to} className="group bg-white p-5 rounded-[1.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between h-[180px] relative overflow-hidden hover:border-[#003366] hover:-translate-y-1">
            <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity rotate-12 group-hover:scale-110 duration-500">
                {React.cloneElement(icon as React.ReactElement, { size: 100 })}
            </div>
            <div>
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4 shadow-sm transition-transform group-hover:scale-110", colorStyles[color])}>
                    {icon}
                </div>
                <h3 className="text-xs font-black text-slate-900 tracking-tight uppercase leading-tight">{title}</h3>
            </div>
            <div className="flex items-center justify-between mt-auto z-10">
                <span className="text-[8px] font-black text-[#003366] uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all">
                    Detail <ChevronRight size={10} />
                </span>
                {count > 0 && (
                    <span className="bg-[#003366] text-white text-[8px] font-black px-2 py-0.5 rounded-full animate-pulse shadow-lg shadow-blue-900/30">
                        {count} NEW
                    </span>
                )}
            </div>
        </Link>
    );
};

const AlertCard = ({ to, title, type }: any) => (
    <Link to={to} className={cn(
        "p-3 rounded-2xl flex items-center justify-between group transition-all shadow-sm border",
        type === 'danger' ? "bg-rose-50 border-rose-100 hover:bg-rose-600 hover:border-rose-600 shadow-rose-100" : 
        type === 'warning' ? "bg-amber-50 border-amber-100 hover:bg-amber-500 hover:border-amber-500 shadow-amber-100" :
        "bg-blue-50 border-blue-100 hover:bg-[#003366] hover:border-[#003366] shadow-blue-100"
    )}>
        <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg group-hover:bg-white/20 transition-colors", 
                type === 'danger' ? "bg-rose-100 text-rose-600 group-hover:text-white" : 
                type === 'warning' ? "bg-amber-100 text-amber-600 group-hover:text-white" :
                "bg-blue-100 text-blue-600 group-hover:text-white")}>
                <AlertTriangle size={16} />
            </div>
            <h4 className={cn("text-[10px] font-black uppercase tracking-tight", 
                type === 'danger' ? "text-rose-900 group-hover:text-white" : 
                type === 'warning' ? "text-amber-900 group-hover:text-white" :
                "text-[#003366] group-hover:text-white")}>{title}</h4>
        </div>
        <ChevronRight size={14} className={cn("transition-colors", "group-hover:text-white")} />
    </Link>
);

const ToolCard = ({ to, icon, title }: any) => (
    <Link to={to} className="bg-white p-4 rounded-[1rem] border border-slate-200 flex items-center gap-3 hover:border-[#003366] hover:shadow-md transition-all group shadow-sm">
        <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-[#003366] group-hover:text-white transition-all">
            {icon}
        </div>
        <h4 className="text-[9px] font-black text-slate-700 uppercase tracking-widest">{title}</h4>
    </Link>
);
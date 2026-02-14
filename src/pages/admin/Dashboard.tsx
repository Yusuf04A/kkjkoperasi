import React, { useEffect, useState } from 'react';
import {
    Users, ChevronRight, LogOut, ShieldCheck,
    ArrowRightLeft, PieChart, Megaphone, AlertTriangle, Scale,
    ShoppingBag, TrendingUp, Receipt, Banknote, Warehouse, Building, Wallet // Tambah Wallet
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
        pendingLHU: 0,
        activeInflip: 0,
        pendingWithdrawals: 0, // State baru untuk Request Tarik Simpanan
    });

    const [firstRestructureId, setFirstRestructureId] = useState<string | null>(null);

    const fetchStats = async () => {
        // 1. Fetch data existing
        const { count: pendingMember } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending');
        const { count: pendingTrans } = await supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('status', 'pending');
        const { count: pendingLoan } = await supabase.from('loans').select('*', { count: 'exact', head: true }).eq('status', 'pending');
        const { data: restructureData } = await supabase.from('loans').select('id').eq('restructure_status', 'pending');
        const { count: pendingTamasa } = await supabase.from('tamasa_transactions').select('*', { count: 'exact', head: true }).eq('status', 'pending');
        const { count: pendingPawn } = await supabase.from('pawn_transactions').select('*', { count: 'exact', head: true }).eq('status', 'pending');
        const { count: pendingOrders } = await supabase.from('shop_orders').select('*', { count: 'exact', head: true }).eq('status', 'diproses');
        const { count: pendingLHU } = await supabase.from('lhu_distributions').select('*', { count: 'exact', head: true }).eq('status', 'waiting');
        const { count: activeInflip } = await supabase.from('inflip_projects').select('*', { count: 'exact', head: true }).eq('status', 'open');

        // 2. Fetch Request Tarik Simpanan (Tabel Baru)
        const { count: pendingWithdrawals } = await supabase.from('savings_withdrawals').select('*', { count: 'exact', head: true }).eq('status', 'pending');

        setStats({
            pendingUsers: pendingMember || 0,
            pendingTx: pendingTrans || 0,
            pendingLoans: pendingLoan || 0,
            pendingRestructures: restructureData?.length || 0,
            pendingTamasa: pendingTamasa || 0,
            pendingPawn: pendingPawn || 0,
            pendingOrders: pendingOrders || 0,
            pendingLHU: pendingLHU || 0,
            activeInflip: activeInflip || 0,
            pendingWithdrawals: pendingWithdrawals || 0, // Update state
        });

        if (restructureData && restructureData.length > 0) {
            setFirstRestructureId(restructureData[0].id);
        }
    };

    useEffect(() => {
        fetchStats();
        // Subscribe realtime agar notifikasi muncul tanpa refresh
        const channel = supabase
            .channel('dashboard-updates')
            .on('postgres_changes', { event: '*', schema: 'public' }, () => fetchStats())
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const handleLogout = async () => {
        const confirm = window.confirm("Akhiri sesi admin?");
        if (!confirm) return;
        await logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-12 font-sans">
            {/* TOP BAR */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-50 px-6 py-4 shadow-sm">
                <div className="max-w-[1400px] mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#003366] rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
                            <ShieldCheck className="text-white" size={18} />
                        </div>
                        <h1 className="font-black text-slate-900 tracking-tighter text-lg uppercase">KKJ <span className="text-[#003366]">Control Center</span></h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">System Active</span>
                        </div>
                        <button onClick={handleLogout} className="p-2.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all border border-transparent hover:border-rose-100">
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto px-6 pt-8 space-y-8">

                {/* HERO SECTION */}
                <div className="relative bg-[#003366] rounded-[2rem] p-8 overflow-hidden shadow-2xl shadow-blue-900/20">
                    <div className="absolute right-0 top-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none" />
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="space-y-2">
                            <h1 className="text-3xl md:text-4xl font-[1000] text-white tracking-tighter uppercase leading-none">
                                Halo, {user?.full_name?.split(' ')[0] || 'Admin'}
                            </h1>
                            <p className="text-blue-200/70 text-xs font-bold uppercase tracking-[0.3em]">Master Administrator Panel</p>
                        </div>
                        <Link to="/admin/labarugi" className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10 backdrop-blur-sm flex items-center gap-2 shadow-lg">
                            <PieChart size={14} /> Keuangan Real-time
                        </Link>
                    </div>
                </div>

                {/* NOTIFIKASI URGENT (ROW ATAS) */}
                {(stats.pendingWithdrawals > 0 || stats.pendingRestructures > 0 || stats.pendingUsers > 0 || stats.pendingLHU > 0 || stats.pendingOrders > 0 || stats.pendingLoans > 0) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-in fade-in slide-in-from-bottom-4">
                        {/* 1. Request Tarik Simpanan (PRIORITAS TINGGI) */}
                        {stats.pendingWithdrawals > 0 && (
                            <AlertCard
                                to="/admin/simpanan"
                                title={`${stats.pendingWithdrawals} Request Tarik Tunai`}
                                type="danger"
                            />
                        )}
                        
                        {/* 2. Pengajuan Pinjaman */}
                        {stats.pendingLoans > 0 && (
                            <AlertCard
                                to="/admin/pembiayaan"
                                title={`${stats.pendingLoans} Pengajuan Pinjaman`}
                                type="danger"
                            />
                        )}

                        {/* 3. Restrukturisasi */}
                        {stats.pendingRestructures > 0 && (
                            <AlertCard
                                to={firstRestructureId ? `/admin/pembiayaan/${firstRestructureId}` : '/admin/pembiayaan'}
                                title={`${stats.pendingRestructures} Request Tenor`}
                                type="danger"
                            />
                        )}

                        {/* 4. Verifikasi Anggota */}
                        {stats.pendingUsers > 0 && (
                            <AlertCard to="/admin/verifikasi" title={`${stats.pendingUsers} Verifikasi Anggota`} type="warning" />
                        )}

                        {/* 5. LHU */}
                        {stats.pendingLHU > 0 && (
                            <AlertCard to="/admin/lhu" title={`${stats.pendingLHU} Eksekusi LHU`} type="info" />
                        )}

                        {/* 6. Pesanan Toko */}
                        {stats.pendingOrders > 0 && (
                            <AlertCard to="/admin/toko" title={`${stats.pendingOrders} Pesanan Toko Baru`} type="info" />
                        )}
                    </div>
                )}

                {/* LAYANAN UTAMA KOPERASI (GRID MENU) */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 border-l-4 border-[#003366] pl-4">
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">Layanan Utama</h2>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                        <DashboardCard to="/admin/verifikasi" icon={<Users size={24} />} title="Anggota" color="indigo" count={stats.pendingUsers} />
                        <DashboardCard to="/admin/transaksi" icon={<ArrowRightLeft size={24} />} title="Finance" color="emerald" count={stats.pendingTx} />
                        
                        {/* MENU BARU: TARIK SIMPANAN */}
                        <DashboardCard 
                            to="/admin/simpanan" 
                            icon={<Wallet size={24} />} 
                            title="Tarik Simpanan" 
                            color="rose" 
                            count={stats.pendingWithdrawals} 
                        />

                        <DashboardCard to="/admin/tamasa" icon={<ShieldCheck size={24} />} title="Tamasa" color="amber" count={stats.pendingTamasa} />
                        <DashboardCard to="/admin/pegadaian" icon={<Scale size={24} />} title="Gadai" color="blue" count={stats.pendingPawn} />
                        
                        <DashboardCard to="/admin/pembiayaan" icon={<Banknote size={24} />} title="Pinjaman" color="rose" count={stats.pendingLoans} />

                        <DashboardCard to="/admin/inflip" icon={<Building size={24} />} title="Properti (INFLIP)" color="sky" count={stats.activeInflip} />
                        <DashboardCard to="/admin/gudang-kredit" icon={<Warehouse size={24} />} title="Gudang Kredit" color="cyan" count={0} />

                        <DashboardCard to="/admin/toko" icon={<ShoppingBag size={24} />} title="Toko" color="violet" count={stats.pendingOrders} />
                        <DashboardCard to="/admin/lhu" icon={<TrendingUp size={24} />} title="LHU" color="teal" count={stats.pendingLHU} />
                        <DashboardCard to="/admin/labarugi" icon={<Receipt size={24} />} title="Laba Rugi" color="slate" count={0} />
                        <DashboardCard to="/admin/kabar" icon={<Megaphone size={24} />} title="Kabar KKJ" color="brown" count={0} />
                    </div>
                </div>

                <div className="text-center pt-8 pb-4">
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.6em]">
                        Internal Control Panel v3.8 • Build 2026.02
                    </p>
                </div>
            </div>
        </div>
    );
};

/* --- SUB-COMPONENTS --- */

const DashboardCard = ({ to, icon, title, color, count }: any) => {
    const styles: any = {
        indigo: "bg-indigo-50/80 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white border-indigo-100",
        emerald: "bg-emerald-50/80 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white border-emerald-100",
        amber: "bg-amber-50/80 text-amber-600 group-hover:bg-amber-500 group-hover:text-white border-amber-100",
        blue: "bg-blue-50/80 text-blue-600 group-hover:bg-blue-600 group-hover:text-white border-blue-100",
        violet: "bg-violet-50/80 text-violet-600 group-hover:bg-violet-600 group-hover:text-white border-violet-100",
        rose: "bg-rose-50/80 text-rose-600 group-hover:bg-rose-600 group-hover:text-white border-rose-100",
        teal: "bg-teal-50/80 text-teal-600 group-hover:bg-teal-600 group-hover:text-white border-teal-100",
        slate: "bg-slate-100 text-slate-600 group-hover:bg-slate-600 group-hover:text-white border-slate-200",
        brown: "bg-orange-50/80 text-orange-800 group-hover:bg-orange-700 group-hover:text-white border-orange-100",
        cyan: "bg-cyan-50/80 text-cyan-600 group-hover:bg-cyan-600 group-hover:text-white border-cyan-100",
        sky: "bg-sky-50/80 text-sky-600 group-hover:bg-sky-600 group-hover:text-white border-sky-100",
    };

    const activeStyle = styles[color] || styles.slate;

    return (
        <Link to={to} className={`group bg-white rounded-[2rem] p-5 border shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 flex flex-col items-center justify-center text-center gap-3 relative overflow-hidden h-[150px] hover:-translate-y-1 ${activeStyle.split(' ').pop()?.includes('border') ? '' : 'border-slate-100'}`}>
            {count > 0 && (
                <div className="absolute top-4 right-4 w-5 h-5 bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full shadow-lg shadow-rose-500/40 animate-pulse z-10 border-2 border-white">
                    {count}
                </div>
            )}
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-all duration-500 group-hover:scale-110", activeStyle)}>
                {icon}
            </div>
            <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest group-hover:text-[#003366] transition-colors mt-1">
                {title}
            </h3>
        </Link>
    );
};

const AlertCard = ({ to, title, type }: any) => (
    <Link to={to} className={cn(
        "px-4 py-3 rounded-2xl flex items-center justify-between group transition-all shadow-sm border border-transparent hover:scale-[1.02]",
        type === 'danger' ? "bg-rose-50 hover:bg-rose-100 text-rose-700" :
            type === 'warning' ? "bg-amber-50 hover:bg-amber-100 text-amber-700" :
                "bg-blue-50 hover:bg-blue-100 text-[#003366]"
    )}>
        <div className="flex items-center gap-3">
            <div className="bg-white/60 p-1.5 rounded-lg shadow-sm">
                <AlertTriangle size={14} />
            </div>
            <h4 className="text-[10px] font-black uppercase tracking-widest">{title}</h4>
        </div>
        <ChevronRight size={14} className="opacity-40 group-hover:opacity-100 transition-opacity" />
    </Link>
);
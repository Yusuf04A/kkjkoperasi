import React, { useEffect, useState } from 'react';
import {
    Users, ChevronRight, LogOut, ShieldCheck,
    ArrowRightLeft, PieChart, Megaphone, AlertTriangle, Scale,
    ShoppingBag, TrendingUp, Receipt, Banknote, Warehouse, Building, Wallet,
    ArrowUpRight, CreditCard, RefreshCcw
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { cn } from '../../lib/utils';

// --- IMPORT LOGO ---
import logoKKJ from '../../assets/Logo-kkj.png';

export const AdminDashboard = () => {
    const { logout, user } = useAuthStore();
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        pendingUsers: 0, pendingTx: 0, pendingLoans: 0, pendingRestructures: 0,
        pendingTamasa: 0, pendingPawn: 0, pendingOrders: 0, pendingLHU: 0,
        activeInflip: 0, pendingWithdrawals: 0,
    });

    const [transactionStats, setTransactionStats] = useState<any[]>([]);
    const [loadingStats, setLoadingStats] = useState(false);
    const [firstRestructureId, setFirstRestructureId] = useState<string | null>(null);

    const formatIDR = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);

    const fetchStats = async () => {
        try {
            const [
                { count: pendingMember }, { count: pendingTrans }, { count: pendingLoan },
                { data: restructureData }, { count: pendingTamasaCount }, { count: pendingPawnCount },
                { count: pendingOrdersCount }, { count: pendingLHUCount }, { count: activeInflipCount },
                { count: pendingWithdrawalsCount }
            ] = await Promise.all([
                supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                supabase.from('loans').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                supabase.from('loans').select('id').eq('restructure_status', 'pending'),
                supabase.from('tamasa_transactions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                supabase.from('pawn_transactions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                supabase.from('shop_orders').select('*', { count: 'exact', head: true }).eq('status', 'diproses'),
                supabase.from('lhu_distributions').select('*', { count: 'exact', head: true }).eq('status', 'waiting'),
                supabase.from('inflip_projects').select('*', { count: 'exact', head: true }).eq('status', 'open'),
                supabase.from('savings_withdrawals').select('*', { count: 'exact', head: true }).eq('status', 'pending')
            ]);

            setStats({
                pendingUsers: pendingMember || 0, pendingTx: pendingTrans || 0, pendingLoans: pendingLoan || 0,
                pendingRestructures: restructureData?.length || 0, pendingTamasa: pendingTamasaCount || 0,
                pendingPawn: pendingPawnCount || 0, pendingOrders: pendingOrdersCount || 0,
                pendingLHU: pendingLHUCount || 0, activeInflip: activeInflipCount || 0,
                pendingWithdrawals: pendingWithdrawalsCount || 0,
            });
            if (restructureData && restructureData.length > 0) setFirstRestructureId(restructureData[0].id);
        } catch (error) { console.error(error); }
    };

    const fetchTransactionTableStats = async () => {
        try {
            setLoadingStats(true);
            const now = new Date();
            const today = new Date(now.setHours(0, 0, 0, 0)).toISOString();
            const firstDayMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

            // Helper: jumlahkan amount dari array
            const sum = (arr: any[], amountKey = 'amount') =>
                arr?.reduce((acc, curr) => acc + (curr[amountKey] || 0), 0) || 0;

            // --- 1. TRANSAKSI DARI TABEL `transactions` (hanya status 'success') ---
            // Setor Simpanan: type='topup' dengan prefix [SETOR SIMPANAN] di description
            const txTypes = [
                { key: 'topup', label: 'Top Up TaPro', descFilter: null },
                { key: 'withdraw', label: 'Penarikan TaPro', descFilter: null },
                { key: 'payment', label: 'Bayar Cicilan', descFilter: null },
            ];

            const txRows = await Promise.all(txTypes.map(async (item) => {
                const { data: allAny } = await supabase
                    .from('transactions').select('amount, status')
                    .eq('type', item.key).not('description', 'ilike', '%SETOR SIMPANAN%');
                const { data: allOk } = await supabase
                    .from('transactions').select('amount')
                    .eq('type', item.key).eq('status', 'success')
                    .not('description', 'ilike', '%SETOR SIMPANAN%');
                const { data: dayOk } = await supabase
                    .from('transactions').select('amount')
                    .eq('type', item.key).eq('status', 'success')
                    .not('description', 'ilike', '%SETOR SIMPANAN%')
                    .gte('created_at', today);
                const { data: monthOk } = await supabase
                    .from('transactions').select('amount')
                    .eq('type', item.key).eq('status', 'success')
                    .not('description', 'ilike', '%SETOR SIMPANAN%')
                    .gte('created_at', firstDayMonth);

                return {
                    label: item.label,
                    todayCount: dayOk?.length || 0, todaySum: sum(dayOk || []),
                    monthCount: monthOk?.length || 0, monthSum: sum(monthOk || []),
                    totalCount: allOk?.length || 0, totalSum: sum(allOk || []),
                    approved: allAny?.filter(x => x.status === 'success').length || 0,
                    pending: allAny?.filter(x => x.status === 'pending').length || 0,
                    rejected: allAny?.filter(x => x.status === 'failed').length || 0,
                };
            }));

            // Setor Simpanan — topup + description [SETOR SIMPANAN]
            const { data: ssAny } = await supabase.from('transactions').select('amount, status').eq('type', 'topup').ilike('description', '%SETOR SIMPANAN%');
            const { data: ssOk } = await supabase.from('transactions').select('amount').eq('type', 'topup').eq('status', 'success').ilike('description', '%SETOR SIMPANAN%');
            const { data: ssDay } = await supabase.from('transactions').select('amount').eq('type', 'topup').eq('status', 'success').ilike('description', '%SETOR SIMPANAN%').gte('created_at', today);
            const { data: ssMonth } = await supabase.from('transactions').select('amount').eq('type', 'topup').eq('status', 'success').ilike('description', '%SETOR SIMPANAN%').gte('created_at', firstDayMonth);
            const ssRow = {
                label: 'Setor Simpanan',
                todayCount: ssDay?.length || 0, todaySum: sum(ssDay || []),
                monthCount: ssMonth?.length || 0, monthSum: sum(ssMonth || []),
                totalCount: ssOk?.length || 0, totalSum: sum(ssOk || []),
                approved: ssAny?.filter(x => x.status === 'success').length || 0,
                pending: ssAny?.filter(x => x.status === 'pending').length || 0,
                rejected: ssAny?.filter(x => x.status === 'failed').length || 0,
            };

            // --- 2. PENARIKAN SIMPANAN (savings_withdrawals, status='approved') ---
            const { data: swAll } = await supabase.from('savings_withdrawals').select('amount, status');
            const { data: swDay } = await supabase.from('savings_withdrawals').select('amount').eq('status', 'approved').gte('created_at', today);
            const { data: swMonth } = await supabase.from('savings_withdrawals').select('amount').eq('status', 'approved').gte('created_at', firstDayMonth);
            const { data: swOk } = await supabase.from('savings_withdrawals').select('amount').eq('status', 'approved');
            const swRow = {
                label: 'Tarik Simpanan',
                todayCount: swDay?.length || 0, todaySum: sum(swDay || []),
                monthCount: swMonth?.length || 0, monthSum: sum(swMonth || []),
                totalCount: swOk?.length || 0, totalSum: sum(swOk || []),
                approved: swAll?.filter(x => x.status === 'approved').length || 0,
                pending: swAll?.filter(x => x.status === 'pending').length || 0,
                rejected: swAll?.filter(x => x.status === 'rejected').length || 0,
            };

            // --- 3. TAMASA (tamasa_transactions, kolom nominal = 'setoran', status='approved') ---
            const { data: taAll } = await supabase.from('tamasa_transactions').select('setoran, status');
            const { data: taDay } = await supabase.from('tamasa_transactions').select('setoran').eq('status', 'approved').gte('created_at', today);
            const { data: taMonth } = await supabase.from('tamasa_transactions').select('setoran').eq('status', 'approved').gte('created_at', firstDayMonth);
            const { data: taOk } = await supabase.from('tamasa_transactions').select('setoran').eq('status', 'approved');
            const taRow = {
                label: 'Tamasa (Emas)',
                todayCount: taDay?.length || 0, todaySum: sum(taDay || [], 'setoran'),
                monthCount: taMonth?.length || 0, monthSum: sum(taMonth || [], 'setoran'),
                totalCount: taOk?.length || 0, totalSum: sum(taOk || [], 'setoran'),
                approved: taAll?.filter(x => x.status === 'approved').length || 0,
                pending: taAll?.filter(x => x.status === 'pending').length || 0,
                rejected: taAll?.filter(x => x.status === 'rejected').length || 0,
            };

            // --- 4. GADAI (pawn_transactions, kolom nominal = 'loan_amount', status='approved') ---
            const { data: paAll } = await supabase.from('pawn_transactions').select('loan_amount, status');
            const { data: paDay } = await supabase.from('pawn_transactions').select('loan_amount').eq('status', 'approved').gte('created_at', today);
            const { data: paMonth } = await supabase.from('pawn_transactions').select('loan_amount').eq('status', 'approved').gte('created_at', firstDayMonth);
            const { data: paOk } = await supabase.from('pawn_transactions').select('loan_amount').eq('status', 'approved');
            const paRow = {
                label: 'Gadai Syariah',
                todayCount: paDay?.length || 0, todaySum: sum(paDay || [], 'loan_amount'),
                monthCount: paMonth?.length || 0, monthSum: sum(paMonth || [], 'loan_amount'),
                totalCount: paOk?.length || 0, totalSum: sum(paOk || [], 'loan_amount'),
                approved: paAll?.filter(x => x.status === 'approved').length || 0,
                pending: paAll?.filter(x => x.status === 'pending').length || 0,
                rejected: paAll?.filter(x => x.status === 'rejected').length || 0,
            };

            // --- 5. PINJAMAN/LOANS (loans, status='approved' atau 'active') ---
            const { data: loAll } = await supabase.from('loans').select('amount, status');
            const { data: loDay } = await supabase.from('loans').select('amount').in('status', ['approved', 'active']).gte('created_at', today);
            const { data: loMonth } = await supabase.from('loans').select('amount').in('status', ['approved', 'active']).gte('created_at', firstDayMonth);
            const { data: loOk } = await supabase.from('loans').select('amount').in('status', ['approved', 'active']);
            const loRow = {
                label: 'Pinjaman',
                todayCount: loDay?.length || 0, todaySum: sum(loAll ? loDay || [] : []),
                monthCount: loMonth?.length || 0, monthSum: sum(loMonth || []),
                totalCount: loOk?.length || 0, totalSum: sum(loOk || []),
                approved: loAll?.filter(x => ['approved', 'active', 'lunas'].includes(x.status)).length || 0,
                pending: loAll?.filter(x => x.status === 'pending').length || 0,
                rejected: loAll?.filter(x => x.status === 'rejected').length || 0,
            };

            // --- 6. ORDER TOKO (shop_orders, kolom nominal = 'total_amount', status='siap_diambil') ---
            const { data: soAll } = await supabase.from('shop_orders').select('total_amount, status');
            const { data: soDay } = await supabase.from('shop_orders').select('total_amount').eq('status', 'siap_diambil').gte('created_at', today);
            const { data: soMonth } = await supabase.from('shop_orders').select('total_amount').eq('status', 'siap_diambil').gte('created_at', firstDayMonth);
            const { data: soOk } = await supabase.from('shop_orders').select('total_amount').eq('status', 'siap_diambil');
            const soRow = {
                label: 'Order Toko',
                todayCount: soDay?.length || 0, todaySum: sum(soDay || [], 'total_amount'),
                monthCount: soMonth?.length || 0, monthSum: sum(soMonth || [], 'total_amount'),
                totalCount: soOk?.length || 0, totalSum: sum(soOk || [], 'total_amount'),
                approved: soAll?.filter(x => x.status === 'siap_diambil').length || 0,
                pending: soAll?.filter(x => x.status === 'diproses').length || 0,
                rejected: soAll?.filter(x => x.status === 'ditolak').length || 0,
            };

            setTransactionStats([...txRows, ssRow, swRow, taRow, paRow, loRow, soRow]);
        } catch (error) { console.error(error); } finally { setLoadingStats(false); }
    };

    useEffect(() => {
        fetchStats(); fetchTransactionTableStats();
        const channel = supabase.channel('admin-dashboard-updates');
        ['profiles', 'transactions', 'loans', 'tamasa_transactions', 'pawn_transactions', 'shop_orders', 'lhu_distributions', 'inflip_projects', 'savings_withdrawals'].forEach((table) => {
            channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => {
                fetchStats(); fetchTransactionTableStats();
            });
        });
        channel.subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    const handleLogout = async () => { if (window.confirm("Akhiri sesi admin?")) { await logout(); navigate('/login'); } };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-12 font-sans">
            {/* TOP BAR */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-50 px-6 py-4 shadow-sm">
                <div className="max-w-[1400px] mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="h-11 w-11 flex items-center justify-center bg-white border border-slate-100 rounded-xl p-1.5 shadow-sm">
                            <img src={logoKKJ} alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="font-black text-slate-900 text-lg uppercase leading-none tracking-tighter">KKJ <span className="text-[#136f42]">Control Center</span></h1>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Administrator</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => { fetchStats(); fetchTransactionTableStats(); }} className="p-2 text-slate-400 hover:text-[#136f42] transition-colors"><RefreshCcw size={18} className={loadingStats ? "animate-spin" : ""} /></button>
                        <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all border border-transparent hover:border-rose-100 uppercase text-[10px] font-black tracking-widest">Logout <LogOut size={18} /></button>
                    </div>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto px-6 pt-8 space-y-8">
                {/* 1. HERO SECTION */}
                <div className="relative bg-[#136f42] rounded-[2.5rem] p-8 overflow-hidden shadow-2xl">
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6 text-white">
                        <div className="space-y-1 text-center md:text-left">
                            <h1 className="text-3xl md:text-4xl font-[1000] uppercase tracking-tighter leading-none">Halo, {user?.full_name?.split(' ')[0] || 'Admin'}</h1>
                            <p className="text-green-100/60 text-[10px] font-bold uppercase tracking-[0.3em]">Master Administrator Dashboard</p>
                        </div>
                        <Link to="/admin/labarugi" className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/10 backdrop-blur-md flex items-center gap-2">
                            <PieChart size={14} /> Keuangan Real-time
                        </Link>
                    </div>
                </div>

                {/* 2. NOTIFIKASI URGENT (PINDAH KE ATAS) */}
                {(Object.values(stats).some(v => v > 0)) && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="flex items-center gap-3 border-l-4 border-rose-500 pl-4">
                            <h2 className="text-xs font-black text-rose-500 uppercase tracking-[0.4em]">NOTIFIKASI</h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {stats.pendingWithdrawals > 0 && <AlertCard to="/admin/simpanan" title={`${stats.pendingWithdrawals} Request Tarik Tunai`} type="danger" />}
                            {stats.pendingLoans > 0 && <AlertCard to="/admin/pembiayaan" title={`${stats.pendingLoans} Pengajuan Pinjaman`} type="danger" />}
                            {stats.pendingRestructures > 0 && <AlertCard to={firstRestructureId ? `/admin/pembiayaan/${firstRestructureId}` : '/admin/pembiayaan'} title={`${stats.pendingRestructures} Request Tenor`} type="danger" />}
                            {stats.pendingTamasa > 0 && <AlertCard to="/admin/tamasa" title={`${stats.pendingTamasa} Request Tamasa`} type="warning" />}
                            {stats.pendingPawn > 0 && <AlertCard to="/admin/pegadaian" title={`${stats.pendingPawn} Pengajuan Gadai`} type="warning" />}
                            {stats.pendingTx > 0 && <AlertCard to="/admin/transaksi" title={`${stats.pendingTx} Transaksi Finance`} type="warning" />}
                            {stats.pendingUsers > 0 && <AlertCard to="/admin/verifikasi" title={`${stats.pendingUsers} Verifikasi Anggota`} type="warning" />}
                            {stats.pendingLHU > 0 && <AlertCard to="/admin/lhu" title={`${stats.pendingLHU} Eksekusi LHU`} type="info" />}
                            {stats.pendingOrders > 0 && <AlertCard to="/admin/toko" title={`${stats.pendingOrders} Pesanan Toko Baru`} type="info" />}
                        </div>
                    </div>
                )}

                {/* 3. TABEL STATISTIK LENGKAP */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-l-4 border-[#136f42] pl-4">
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">Arus Kas Transaksi</h2>
                    </div>

                    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden shadow-slate-200/50">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-separate border-spacing-0">
                                <thead>
                                    <tr>
                                        <th className="bg-slate-50 p-5 text-[10px] font-black uppercase text-slate-500 border-b border-slate-100">Layanan</th>
                                        <th colSpan={2} className="bg-blue-50/50 p-5 text-[10px] font-black uppercase text-blue-700 border-b border-blue-100 text-center">Hari Ini</th>
                                        <th colSpan={2} className="bg-emerald-50/50 p-5 text-[10px] font-black uppercase text-emerald-700 border-b border-emerald-100 text-center">Bulan Ini</th>
                                        <th colSpan={2} className="bg-purple-50/50 p-5 text-[10px] font-black uppercase text-purple-700 border-b border-purple-100 text-center">Total Keseluruhan</th>
                                        <th className="bg-slate-50 p-5 text-[10px] font-black uppercase text-slate-500 border-b border-slate-100 text-center">Rekap Status</th>
                                    </tr>
                                    <tr className="bg-white text-[8px] font-black text-slate-400 uppercase">
                                        <th className="p-2 border-b border-slate-50"></th>
                                        <th className="p-2 text-center bg-blue-50/20 border-b border-slate-50">Freq</th>
                                        <th className="p-2 text-right bg-blue-50/20 border-b border-slate-50 pr-6">Nominal</th>
                                        <th className="p-2 text-center bg-emerald-50/20 border-b border-slate-50">Freq</th>
                                        <th className="p-2 text-right bg-emerald-50/20 border-b border-slate-50 pr-6">Nominal</th>
                                        <th className="p-2 text-center bg-purple-50/20 border-b border-slate-50">Freq</th>
                                        <th className="p-2 text-right bg-purple-50/20 border-b border-slate-50 pr-6">Nominal</th>
                                        <th className="p-2 border-b border-slate-50"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {loadingStats ? (
                                        <tr><td colSpan={8} className="p-20 text-center font-black text-slate-300 uppercase animate-pulse tracking-widest">Sinkronisasi Data...</td></tr>
                                    ) : transactionStats.map((row, i) => (
                                        <tr key={i} className="hover:bg-slate-50/80 transition-all group">
                                            <td className="p-4 pl-6 font-extrabold text-slate-700 text-xs uppercase border-r border-slate-50">{row.label}</td>
                                            <td className="p-4 text-center bg-blue-50/5 font-bold text-blue-600 text-xs">{row.todayCount}</td>
                                            <td className="p-4 text-right bg-blue-50/5 font-black text-slate-800 text-xs pr-6">{formatIDR(row.todaySum)}</td>
                                            <td className="p-4 text-center bg-emerald-50/5 font-bold text-emerald-600 text-xs">{row.monthCount}</td>
                                            <td className="p-4 text-right bg-emerald-50/5 font-black text-slate-800 text-xs pr-6">{formatIDR(row.monthSum)}</td>
                                            <td className="p-4 text-center bg-purple-50/5 font-bold text-purple-600 text-xs">{row.totalCount}</td>
                                            <td className="p-4 text-right bg-purple-50/5 font-black text-[#136f42] text-xs pr-6">{formatIDR(row.totalSum)}</td>
                                            <td className="p-4 border-l border-slate-50">
                                                <div className="flex justify-center gap-1.5">
                                                    <StatusBadge count={row.approved} label="Acc" color="bg-green-500" />
                                                    <StatusBadge count={row.pending} label="Wait" color="bg-amber-500" />
                                                    <StatusBadge count={row.rejected} label="Rej" color="bg-rose-500" />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* 4. LAYANAN UTAMA (MENU CARD) */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 border-l-4 border-[#136f42] pl-4">
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">Layanan Utama</h2>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                        <DashboardCard to="/admin/verifikasi" icon={<Users size={24} />} title="Anggota" color="green" count={stats.pendingUsers} />
                        <DashboardCard to="/admin/transaksi" icon={<ArrowRightLeft size={24} />} title="Finance" color="emerald" count={stats.pendingTx} />
                        <DashboardCard to="/admin/simpanan" icon={<Wallet size={24} />} title="Tarik Simpanan" color="rose" count={stats.pendingWithdrawals} />
                        <DashboardCard to="/admin/tamasa" icon={<ShieldCheck size={24} />} title="Tamasa" color="amber" count={stats.pendingTamasa} />
                        <DashboardCard to="/admin/pegadaian" icon={<Scale size={24} />} title="Gadai" color="blue" count={stats.pendingPawn} />
                        <DashboardCard to="/admin/pembiayaan" icon={<Banknote size={24} />} title="Pinjaman" color="rose" count={stats.pendingLoans} />
                        <DashboardCard to="/admin/inflip" icon={<Building size={24} />} title="Properti (INFLIP)" color="sky" count={stats.activeInflip} />
                        <DashboardCard to="/admin/gudang-kredit" icon={<Warehouse size={24} />} title="Gudang Kredit" color="cyan" count={0} />
                        <DashboardCard to="/admin/tarik-simpanan" icon={<ArrowUpRight size={24} />} title="Tarik Semua Simpanan" color="amber" count={0} />
                        <DashboardCard to="/admin/tapro-anggota" icon={<CreditCard size={24} />} title="TaPro Anggota" color="indigo" count={0} />
                        <DashboardCard to="/admin/toko" icon={<ShoppingBag size={24} />} title="Toko" color="violet" count={stats.pendingOrders} />
                        <DashboardCard to="/admin/lhu" icon={<TrendingUp size={24} />} title="LHU" color="teal" count={stats.pendingLHU} />
                        <DashboardCard to="/admin/labarugi" icon={<Receipt size={24} />} title="Laba Rugi" color="slate" count={0} />
                        <DashboardCard to="/admin/kabar" icon={<Megaphone size={24} />} title="Kabar KKJ" color="brown" count={0} />
                    </div>
                </div>

                <div className="text-center pt-8 pb-4 opacity-30">
                    <p className="text-[9px] font-black uppercase tracking-[0.6em]">Internal Control Panel v3.9 • 2026</p>
                </div>
            </div>
        </div>
    );
};

// --- HELPER COMPONENTS ---

const StatusBadge = ({ count, label, color }: any) => (
    <div className="flex flex-col items-center">
        <div className={cn("px-2 py-0.5 text-white rounded text-[9px] font-black min-w-[22px] text-center", color)}>
            {count}
        </div>
        <span className="text-[6px] font-bold text-slate-400 mt-0.5 uppercase">{label}</span>
    </div>
);

const DashboardCard = ({ to, icon, title, color, count }: any) => {
    const styles: any = {
        green: "bg-green-50/80 text-[#136f42] group-hover:bg-[#136f42] group-hover:text-white border-green-100",
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
        indigo: "bg-indigo-50/80 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white border-indigo-100",
    };
    return (
        <Link to={to} className="group bg-white rounded-[2rem] p-5 border shadow-sm hover:shadow-xl transition-all flex flex-col items-center justify-center text-center gap-3 relative h-[150px] hover:-translate-y-1">
            {count > 0 && <div className="absolute top-4 right-4 w-5 h-5 bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full animate-pulse border-2 border-white">{count}</div>}
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110", styles[color] || styles.slate)}>{icon}</div>
            <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest group-hover:text-[#136f42]">{title}</h3>
        </Link>
    );
};

const AlertCard = ({ to, title, type }: any) => (
    <Link to={to} className={cn("px-4 py-3 rounded-2xl flex items-center justify-between group transition-all border border-transparent hover:scale-[1.02] shadow-sm",
        type === 'danger' ? "bg-rose-50 text-rose-700 hover:bg-rose-100" :
            type === 'warning' ? "bg-amber-50 text-amber-700 hover:bg-amber-100" :
                "bg-green-50 text-[#136f42] hover:bg-green-100")}>
        <div className="flex items-center gap-3">
            <div className="bg-white/60 p-1.5 rounded-lg shadow-sm text-current"><AlertTriangle size={14} /></div>
            <h4 className="text-[10px] font-black uppercase tracking-widest leading-none">{title}</h4>
        </div>
        <ChevronRight size={14} className="opacity-40 group-hover:opacity-100 transition-opacity" />
    </Link>
);
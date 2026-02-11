import React, { useEffect, useState } from 'react';
import { 
    Users, FileText, ChevronRight, LogOut, ShieldCheck, 
    ArrowRightLeft, PieChart, Megaphone, AlertTriangle 
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';

interface KabarKKJ {
    id: string;
    title: string;
    description: string;
    type: 'PROMO' | 'INFO' | 'RAT' | 'PROGRAM';
    color: 'blue' | 'yellow' | 'green';
    is_active: boolean;
    created_at: string;
}

export const AdminDashboard = () => {
    const { logout, user } = useAuthStore();
    const navigate = useNavigate();

    // State Statistik (Hanya yang perlu untuk notifikasi)
    const [stats, setStats] = useState({
        pendingUsers: 0,
        pendingTx: 0,
        pendingLoans: 0,
        pendingRestructures: 0,
    });

    const [firstRestructureId, setFirstRestructureId] = useState<string | null>(null);
    const [kabarList, setKabarList] = useState<KabarKKJ[]>([]);

    useEffect(() => {
        const fetchStats = async () => {
            // 1. Cek User Pending (Verifikasi)
            const { count: pendingMember } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending');

            // 2. Cek Transaksi Pending
            const { count: pendingTrans } = await supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('status', 'pending');

            // 3. Cek Pinjaman Pending
            const { count: pendingLoan } = await supabase.from('loans').select('*', { count: 'exact', head: true }).eq('status', 'pending');

            // 4. Cek Request Perpanjangan Tenor
            const { data: restructureData, count: pendingRestructure } = await supabase
                .from('loans')
                .select('id', { count: 'exact' })
                .eq('restructure_status', 'pending');

            setStats({
                pendingUsers: pendingMember || 0,
                pendingTx: pendingTrans || 0,
                pendingLoans: pendingLoan || 0,
                pendingRestructures: pendingRestructure || 0,
            });

            if (restructureData && restructureData.length > 0) {
                setFirstRestructureId(restructureData[0].id);
            }
        };

        const fetchKabar = async () => {
            try {
                const { data, error } = await supabase
                    .from('kabar_kkj')
                    .select('*')
                    .eq('is_active', true)
                    .order('created_at', { ascending: false })
                    .limit(3);

                if (!error && data) {
                    setKabarList(data as KabarKKJ[]);
                }
            } catch (err) {
                console.log("Tabel kabar_kkj mungkin belum ada.");
            }
        };

        fetchStats();
        fetchKabar();
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const colorMap: Record<string, string> = {
        blue: 'bg-blue-600',
        yellow: 'bg-yellow-500',
        green: 'bg-green-600',
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* HEADER ADMIN */}
                <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-3xl p-8 text-white shadow-xl flex justify-between items-center relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-1 bg-white/10 rounded-lg border border-white/20">
                                <ShieldCheck className="text-yellow-400" size={24} />
                            </div>
                            <span className="text-[10px] font-bold tracking-widest uppercase opacity-80">Administrator Panel</span>
                        </div>
                        <h1 className="text-3xl font-bold">Halo, {user?.full_name || 'Admin'}</h1>
                        <p className="text-blue-200 mt-1 text-sm">Selamat bertugas kembali.</p>
                        
                        <div className="flex gap-2 mt-4">
                            <Link to="/admin/laporan" className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors">
                                <PieChart size={16} /> Laporan Keuangan
                            </Link>
                        </div>
                    </div>

                    <button onClick={handleLogout} className="relative z-10 bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-colors border border-white/20 group" title="Keluar">
                        <LogOut size={20} className="group-hover:scale-110 transition-transform" />
                    </button>
                    <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                </div>

                {/* NOTIFIKASI BAR */}
                <div className="space-y-3">
                    
                    {/* REQUEST PERPANJANGAN (URGENT) */}
                    {stats.pendingRestructures > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between animate-in slide-in-from-top-2 shadow-sm">
                            <div className="flex items-center gap-3 text-red-800">
                                <div className="bg-red-100 p-2 rounded-full animate-pulse">
                                    <AlertTriangle size={18} className="text-red-600" />
                                </div>
                                <div>
                                    <span className="font-bold text-sm block">PERHATIAN: {stats.pendingRestructures} Pengajuan Perpanjangan Tenor!</span>
                                    <span className="text-xs text-red-600">Member meminta perubahan jadwal cicilan.</span>
                                </div>
                            </div>
                            <Link 
                                to={firstRestructureId ? `/admin/pembiayaan/${firstRestructureId}` : '/admin/pembiayaan'} 
                                className="text-xs font-bold bg-white border border-red-200 text-red-700 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors shadow-sm flex items-center gap-1"
                            >
                                Cek Sekarang <ChevronRight size={14}/>
                            </Link>
                        </div>
                    )}

                    {/* Pending Users */}
                    {stats.pendingUsers > 0 && (
                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center justify-between animate-in slide-in-from-top-2">
                            <div className="flex items-center gap-3 text-orange-800">
                                <div className="bg-orange-100 p-2 rounded-full"><Users size={18} className="text-orange-600" /></div>
                                <span className="font-bold text-sm">Ada {stats.pendingUsers} Anggota Menunggu Verifikasi!</span>
                            </div>
                            <Link to="/admin/verifikasi" className="text-xs font-bold bg-white border border-orange-200 text-orange-700 px-4 py-2 rounded-lg hover:bg-orange-100 transition-colors shadow-sm">
                                Proses
                            </Link>
                        </div>
                    )}

                    {/* Pending Tx */}
                    {stats.pendingTx > 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between animate-in slide-in-from-top-2">
                            <div className="flex items-center gap-3 text-green-800">
                                <div className="bg-green-100 p-2 rounded-full"><ArrowRightLeft size={18} className="text-green-600" /></div>
                                <span className="font-bold text-sm">Ada {stats.pendingTx} Transaksi Baru Masuk!</span>
                            </div>
                            <Link to="/admin/transaksi" className="text-xs font-bold bg-white border border-green-200 text-green-700 px-4 py-2 rounded-lg hover:bg-green-100 transition-colors shadow-sm">
                                Cek
                            </Link>
                        </div>
                    )}

                    {/* Pending Loan */}
                    {stats.pendingLoans > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between animate-in slide-in-from-top-2">
                            <div className="flex items-center gap-3 text-blue-800">
                                <div className="bg-blue-100 p-2 rounded-full"><PieChart size={18} className="text-blue-600" /></div>
                                <span className="font-bold text-sm">Ada {stats.pendingLoans} Pengajuan Pinjaman Baru!</span>
                            </div>
                            <Link to="/admin/pembiayaan" className="text-xs font-bold bg-white border border-blue-200 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors shadow-sm">
                                Review
                            </Link>
                        </div>
                    )}
                </div>

                {/* MENU GRID UTAMA */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                    {/* 1. MANAJEMEN ANGGOTA */}
                    <Link to="/admin/verifikasi" className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-blue-500 transition-all cursor-pointer relative overflow-hidden h-full flex flex-col justify-between">
                        <div>
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <Users size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Manajemen Anggota</h3>
                            <p className="text-sm text-gray-500 mt-1 leading-relaxed">Verifikasi pendaftaran, Data Anggota & Reset PIN.</p>
                        </div>
                        <div className="mt-4 flex items-center text-blue-600 text-xs font-bold group-hover:translate-x-1 transition-transform">
                            BUKA MENU <ChevronRight size={14} />
                        </div>
                    </Link>

                    {/* 2. TRANSAKSI */}
                    <Link to="/admin/transaksi" className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-green-500 transition-all cursor-pointer relative overflow-hidden h-full flex flex-col justify-between">
                        <div>
                            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-600 group-hover:text-white transition-colors">
                                <ArrowRightLeft size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Transaksi</h3>
                            <p className="text-sm text-gray-500 mt-1 leading-relaxed">Approval Top Up & Penarikan Saldo.</p>
                        </div>
                        <div className="mt-4 flex items-center text-green-600 text-xs font-bold group-hover:translate-x-1 transition-transform">
                            BUKA MENU <ChevronRight size={14} />
                        </div>
                    </Link>

                    {/* 3. PINJAMAN */}
                    <Link to="/admin/pembiayaan" className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-orange-500 transition-all cursor-pointer relative overflow-hidden h-full flex flex-col justify-between">
                        <div>
                            <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                <FileText size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Pinjaman</h3>
                            <p className="text-sm text-gray-500 mt-1 leading-relaxed">Approval pengajuan kredit & Restrukturisasi.</p>
                        </div>
                        <div className="mt-4 flex items-center text-orange-600 text-xs font-bold group-hover:translate-x-1 transition-transform">
                            BUKA MENU <ChevronRight size={14} />
                        </div>
                    </Link>

                    {/* 4. KABAR KKJ */}
                    <Link to="/admin/kabar" className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-indigo-500 transition-all cursor-pointer relative overflow-hidden h-full flex flex-col justify-between">
                        <div>
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <Megaphone size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Kabar KKJ</h3>
                            <p className="text-sm text-gray-500 mt-1 leading-relaxed">Kelola berita, promo, dan info koperasi.</p>
                        </div>
                        <div className="mt-4 flex items-center text-indigo-600 text-xs font-bold group-hover:translate-x-1 transition-transform">
                            KELOLA KABAR <ChevronRight size={14} />
                        </div>
                    </Link>

                </div>

                {/* PREVIEW KABAR */}
                {kabarList.length > 0 && (
                    <div className="space-y-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <Megaphone size={20} className="text-indigo-600" /> Kabar Aktif Saat Ini
                            </h2>
                            <Link to="/admin/kabar" className="text-sm font-semibold text-indigo-600 hover:underline flex items-center gap-1">
                                Lihat Semua <ChevronRight size={16} />
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {kabarList.map(item => (
                                <div key={item.id} className="bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col">
                                    <div className={`${colorMap[item.color] || 'bg-gray-500'} text-white font-bold text-center py-6 text-sm tracking-widest uppercase`}>
                                        {item.type}
                                    </div>
                                    <div className="p-5 flex-1 flex flex-col">
                                        <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                                        <p className="text-sm text-gray-500 line-clamp-3">{item.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="text-center text-gray-400 text-[10px] mt-10 tracking-widest uppercase">
                    Koperasi Karya Kita Jaya Admin Panel v1.0
                </div>
            </div>
        </div>
    );
};
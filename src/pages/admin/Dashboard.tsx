import React, { useEffect, useState } from 'react';
import { Users, FileText, Wallet, Bell, ChevronRight, LogOut, ShieldCheck, ArrowRightLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';

export const AdminDashboard = () => {
    const { logout, user } = useAuthStore();
    const navigate = useNavigate();

    // State untuk angka statistik
    const [stats, setStats] = useState({
        pendingUsers: 0,
        pendingTx: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            // Cek User Pending
            const { count: pendingMember } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending');

            // Cek Transaksi Pending (Top Up)
            const { count: pendingTrans } = await supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('status', 'pending');

            setStats({
                pendingUsers: pendingMember || 0,
                pendingTx: pendingTrans || 0
            });
        };
        fetchStats();
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* HEADER ADMIN */}
                <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-3xl p-8 text-white shadow-xl flex justify-between items-center relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <ShieldCheck className="text-yellow-400" size={28} />
                            <span className="text-[10px] font-bold tracking-widest bg-white/10 border border-white/20 px-2 py-1 rounded uppercase">Administrator Panel</span>
                        </div>
                        <h1 className="text-3xl font-bold">Halo, {user?.full_name || 'Admin'}</h1>
                        <p className="text-blue-200 mt-1 text-sm">Selamat bertugas kembali. Cek notifikasi di bawah.</p>
                    </div>

                    <button onClick={handleLogout} className="relative z-10 bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-colors border border-white/20 group" title="Keluar">
                        <LogOut size={20} className="group-hover:scale-110 transition-transform" />
                    </button>

                    {/* Dekorasi */}
                    <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                </div>

                {/* NOTIFIKASI BAR (Jika ada pending) */}
                <div className="space-y-3">
                    {stats.pendingUsers > 0 && (
                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center justify-between animate-in slide-in-from-top-2">
                            <div className="flex items-center gap-3 text-orange-800">
                                <div className="bg-orange-100 p-2 rounded-full"><Bell size={18} className="text-orange-600" /></div>
                                <span className="font-bold text-sm">Ada {stats.pendingUsers} Anggota Menunggu Verifikasi!</span>
                            </div>
                            <Link to="/admin/verifikasi" className="text-xs font-bold bg-white border border-orange-200 text-orange-700 px-4 py-2 rounded-lg hover:bg-orange-100 transition-colors shadow-sm">
                                Proses Sekarang
                            </Link>
                        </div>
                    )}

                    {stats.pendingTx > 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between animate-in slide-in-from-top-2">
                            <div className="flex items-center gap-3 text-green-800">
                                <div className="bg-green-100 p-2 rounded-full"><ArrowRightLeft size={18} className="text-green-600" /></div>
                                <span className="font-bold text-sm">Ada {stats.pendingTx} Transaksi Baru Masuk!</span>
                            </div>
                            <Link to="/admin/transaksi" className="text-xs font-bold bg-white border border-green-200 text-green-700 px-4 py-2 rounded-lg hover:bg-green-100 transition-colors shadow-sm">
                                Cek Transaksi
                            </Link>
                        </div>
                    )}
                </div>

                {/* MENU GRID UTAMA (4 KOLOM) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                    {/* 1. DATA ANGGOTA */}
                    <Link to="/admin/verifikasi" className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-blue-500 transition-all cursor-pointer relative overflow-hidden h-full flex flex-col justify-between">
                        <div>
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <Users size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Anggota</h3>
                            <p className="text-sm text-gray-500 mt-1 leading-relaxed">Verifikasi & kelola data anggota.</p>
                        </div>
                        <div className="mt-4 flex items-center text-blue-600 text-xs font-bold group-hover:translate-x-1 transition-transform">
                            BUKA MENU <ChevronRight size={14} />
                        </div>
                    </Link>

                    {/* 2. CEK TRANSAKSI (FITUR BARU) */}
                    <Link to="/admin/transaksi" className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-green-500 transition-all cursor-pointer relative overflow-hidden h-full flex flex-col justify-between">
                        <div>
                            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-600 group-hover:text-white transition-colors">
                                <ArrowRightLeft size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Transaksi</h3>
                            <p className="text-sm text-gray-500 mt-1 leading-relaxed">Approval Top Up & Penarikan.</p>
                        </div>
                        <div className="mt-4 flex items-center text-green-600 text-xs font-bold group-hover:translate-x-1 transition-transform">
                            BUKA MENU <ChevronRight size={14} />
                        </div>
                    </Link>

                    {/* 3. PENGAJUAN KREDIT */}
                    <div className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-orange-500 transition-all cursor-pointer relative overflow-hidden h-full flex flex-col justify-between opacity-50">
                        <div>
                            <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                <FileText size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Pinjaman</h3>
                            <p className="text-sm text-gray-500 mt-1 leading-relaxed">Cek pengajuan pembiayaan.</p>
                        </div>
                        <div className="mt-4 flex items-center text-orange-600 text-xs font-bold group-hover:translate-x-1 transition-transform">
                            SEGERA HADIR <ChevronRight size={14} />
                        </div>
                    </div>

                    {/* 4. LAPORAN KEUANGAN */}
                    <div className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-purple-500 transition-all cursor-pointer relative overflow-hidden h-full flex flex-col justify-between opacity-50">
                        <div>
                            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                <Wallet size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Laporan</h3>
                            <p className="text-sm text-gray-500 mt-1 leading-relaxed">Laporan aset dan perputaran kas.</p>
                        </div>
                        <div className="mt-4 flex items-center text-purple-600 text-xs font-bold group-hover:translate-x-1 transition-transform">
                            SEGERA HADIR <ChevronRight size={14} />
                        </div>
                    </div>

                </div>

                <div className="text-center text-gray-400 text-[10px] mt-10 tracking-widest uppercase">
                    Koperasi Karya Kita Jaya Admin Panel v1.0
                </div>
            </div>
        </div>
    );
};
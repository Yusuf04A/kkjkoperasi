import React, { useEffect, useState } from 'react';
import { Users, FileText, Wallet, Bell, ChevronRight, LogOut, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';

export const AdminDashboard = () => {
    const { logout, user } = useAuthStore();
    const navigate = useNavigate();

    // State untuk angka statistik (Realtime nanti, skrg dummy dulu biar rapi)
    const [stats, setStats] = useState({
        pendingUsers: 0,
        totalUsers: 0
    });

    // Hitung user yang pending
    useEffect(() => {
        const fetchStats = async () => {
            const { count: pending } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending');
            const { count: total } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'member');
            setStats({ pendingUsers: pending || 0, totalUsers: total || 0 });
        };
        fetchStats();
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* HEADER ADMIN */}
                <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-2xl p-8 text-white shadow-xl flex justify-between items-center relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <ShieldCheck className="text-yellow-400" size={28} />
                            <span className="text-xs font-bold tracking-widest bg-white/20 px-2 py-1 rounded">ADMINISTRATOR</span>
                        </div>
                        <h1 className="text-3xl font-bold">Halo, {user?.full_name || 'Admin'}</h1>
                        <p className="text-blue-200 mt-1">Selamat bertugas kembali.</p>
                    </div>

                    {/* Tombol Logout */}
                    <button onClick={handleLogout} className="relative z-10 bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-colors border border-white/20">
                        <LogOut size={20} />
                    </button>

                    {/* Dekorasi Background */}
                    <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                </div>

                {/* STATUS BAR (Penting/Urgent) */}
                {stats.pendingUsers > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center justify-between animate-pulse">
                        <div className="flex items-center gap-3 text-orange-800">
                            <Bell className="fill-orange-500 text-orange-600" />
                            <span className="font-bold">Ada {stats.pendingUsers} Anggota Menunggu Verifikasi!</span>
                        </div>
                        <Link to="/admin/verifikasi" className="text-xs font-bold bg-orange-200 text-orange-800 px-3 py-1.5 rounded-lg hover:bg-orange-300">
                            Proses Sekarang
                        </Link>
                    </div>
                )}

                {/* MENU GRID UTAMA */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* KARTU 1: VERIFIKASI (Paling Penting) */}
                    <Link to="/admin/verifikasi" className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-blue-500 transition-all cursor-pointer relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Users size={100} className="text-blue-600" />
                        </div>
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <Users size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Data Anggota</h3>
                        <p className="text-sm text-gray-500 mt-1">Verifikasi pendaftaran & kelola data anggota.</p>
                        <div className="mt-4 flex items-center text-blue-600 text-sm font-bold group-hover:translate-x-1 transition-transform">
                            Buka Menu <ChevronRight size={16} />
                        </div>
                    </Link>

                    {/* KARTU 2: PEMBIAYAAN */}
                    <div className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-green-500 transition-all cursor-pointer relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <FileText size={100} className="text-green-600" />
                        </div>
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-600 group-hover:text-white transition-colors">
                            <FileText size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Pengajuan Kredit</h3>
                        <p className="text-sm text-gray-500 mt-1">Cek dan setujui pengajuan pembiayaan.</p>
                        <div className="mt-4 flex items-center text-green-600 text-sm font-bold group-hover:translate-x-1 transition-transform">
                            Buka Menu <ChevronRight size={16} />
                        </div>
                    </div>

                    {/* KARTU 3: LAPORAN */}
                    <div className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-purple-500 transition-all cursor-pointer relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Wallet size={100} className="text-purple-600" />
                        </div>
                        <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                            <Wallet size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Keuangan</h3>
                        <p className="text-sm text-gray-500 mt-1">Laporan aset dan perputaran kas.</p>
                        <div className="mt-4 flex items-center text-purple-600 text-sm font-bold group-hover:translate-x-1 transition-transform">
                            Buka Menu <ChevronRight size={16} />
                        </div>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="text-center text-gray-400 text-xs mt-10">
                    Koperasi Karya Kita Jaya Admin Panel v1.0
                </div>
            </div>
        </div>
    );
};
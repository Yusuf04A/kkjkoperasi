import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import {
    Menu, X, ChevronDown, Bell,
    LayoutDashboard, Wallet, History, Send, ArrowDownLeft, ArrowUpRight,
    FileText, LogOut, User, ArrowRightLeft, Megaphone
} from 'lucide-react';
// IMPORT LOGO KKJ DARI ASSETS
import logoKKJ from '../../assets/Logo-kkj.png';

export const Navbar = () => {
    const { user, logout, unreadCount, fetchUnreadCount } = useAuthStore();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);

    // Cek notifikasi setiap kali pindah halaman
    useEffect(() => {
        if (user) fetchUnreadCount();
    }, [location.pathname, user]);

    if (!user) return null;

    const isAdmin = user.role === 'admin';

    // --- CONFIG MENU ---
    const adminLinks = [
        { label: 'Dashboard', path: '/admin/dashboard' },
        { label: 'Verifikasi', path: '/admin/verifikasi' },
        { label: 'Transaksi', path: '/admin/transaksi' },
        { label: 'Pinjaman', path: '/admin/pembiayaan' },
        { label: 'Kabar', path: '/admin/kabar' },
    ];

    const memberLinks = [
        { label: 'Dashboard', path: '/' },
        { label: 'Pembiayaan', path: '/pembiayaan' },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">

                    {/* 1. LOGO & BRANDING (KIRI) */}
                    <div className="flex-shrink-0 flex items-center cursor-pointer">
                        <Link to={isAdmin ? "/admin/dashboard" : "/"} className="flex items-center gap-3">
                            {/* GANTI DIV KKJ DENGAN GAMBAR LOGO */}
                            <div className="bg-white rounded-lg p-1 border border-gray-100 shadow-sm">
                                <img 
                                    src={logoKKJ} 
                                    alt="Logo KKJ" 
                                    className="h-8 w-auto object-contain"
                                />
                            </div>
                            
                            <div className="hidden md:block leading-tight">
                                <span className="block font-extrabold text-[#003366] text-sm uppercase tracking-wide">Koperasi KKJ</span>
                                <span className="block text-[10px] text-gray-500 font-medium tracking-wider">MITRA SEJAHTERA</span>
                            </div>
                        </Link>
                    </div>

                    {/* 2. MENU TENGAH (CENTERED - KHUSUS DESKTOP) */}
                    <div className="hidden md:flex flex-1 justify-center items-center gap-8">
                        {(isAdmin ? adminLinks : memberLinks).map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`text-sm font-medium transition-colors border-b-2 py-5 ${isActive(link.path)
                                    ? 'border-[#003366] text-[#003366] font-bold'
                                    : 'border-transparent text-gray-500 hover:text-gray-900'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}

                        {!isAdmin && (
                            <div className="relative group">
                                <button className="flex items-center gap-1 text-gray-700 hover:text-[#003366] font-medium py-2">
                                    Transaksi <ChevronDown size={16} />
                                </button>
                                {/* Dropdown Content */}
                                <div className="absolute top-full left-0 w-48 bg-white shadow-xl rounded-xl border border-gray-100 p-2 hidden group-hover:block z-50 transform transition-all duration-200 mt-1">
                                    <Link to="/transaksi/topup" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg font-medium">Isi Saldo</Link>
                                    <Link to="/transaksi/tarik" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg font-medium">Tarik Tunai</Link>
                                    <Link to="/transaksi/kirim" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg font-medium">Kirim Uang</Link>
                                    <Link to="/transaksi/riwayat" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg font-medium">Riwayat</Link>
                                    <div className="h-px bg-gray-100 my-1"></div>
                                    <Link to="/transaksi" className="block px-4 py-2 text-sm font-bold text-[#003366] hover:bg-blue-50 rounded-lg">Semua Menu</Link>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 3. PROFIL & NOTIF (KANAN) */}
                    <div className="hidden md:flex items-center gap-4">

                        {/* Lonceng Notifikasi */}
                        <Link to="/notifikasi" className="relative p-2 text-gray-400 hover:text-[#003366] transition-colors rounded-full hover:bg-gray-100">
                            <Bell size={20} className={unreadCount > 0 ? 'text-gray-600 animate-pulse' : ''} />
                            {unreadCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                            )}
                        </Link>

                        <div className="h-6 w-px bg-gray-200"></div>

                        <Link to="/profil" className="flex items-center gap-3 hover:bg-gray-50 p-1.5 pr-3 rounded-full transition-all border border-transparent hover:border-gray-200">
                            <div className="text-right hidden lg:block">
                                <p className="text-sm font-bold text-gray-900 leading-none">{user.full_name}</p>
                                <p className="text-[10px] text-gray-500 uppercase font-bold mt-1 tracking-wide">{user.role}</p>
                            </div>
                            <img
                                src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.full_name}&background=003366&color=fff`}
                                alt="Profile"
                                className="w-9 h-9 rounded-full object-cover shadow-sm border border-gray-100"
                            />
                        </Link>
                    </div>

                    {/* MOBILE MENU BUTTON */}
                    <div className="md:hidden flex items-center gap-2">
                        <Link to="/notifikasi" className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                            <Bell size={22} />
                            {unreadCount > 0 && (
                                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                            )}
                        </Link>
                        <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* MOBILE MENU DRAWER */}
            {isOpen && (
                <div className="md:hidden bg-white border-t border-gray-100 p-4 shadow-lg absolute w-full left-0 top-16 h-screen overflow-y-auto pb-32 animate-in slide-in-from-top-5 z-40">
                    
                    {/* User Profile Card Mobile */}
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl mb-6 border border-gray-100 shadow-sm">
                        <img
                            src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.full_name}&background=003366&color=fff`}
                            alt="Profile"
                            className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                            <p className="font-bold text-gray-900 text-lg leading-tight">{user.full_name}</p>
                            <Link to="/profil" onClick={() => setIsOpen(false)} className="text-sm text-[#003366] font-bold hover:underline">Edit Profil</Link>
                        </div>
                    </div>

                    <p className="text-xs font-bold text-gray-400 uppercase mb-3 px-2 tracking-wider">Menu Utama</p>
                    <div className="space-y-2">
                        {(isAdmin ? adminLinks : memberLinks).map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                onClick={() => setIsOpen(false)}
                                className={`block px-4 py-3 rounded-xl text-base font-bold transition-all ${isActive(link.path) ? 'bg-blue-50 text-[#003366] border border-blue-100' : 'text-gray-600 bg-white border border-gray-100 hover:bg-gray-50'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}

                        {!isAdmin && (
                            <Link
                                to="/transaksi"
                                onClick={() => setIsOpen(false)}
                                className={`block px-4 py-3 rounded-xl text-base font-bold flex justify-between items-center transition-all ${location.pathname.includes('/transaksi') ? 'bg-blue-50 text-[#003366] border border-blue-100' : 'text-gray-600 bg-white border border-gray-100 hover:bg-gray-50'
                                    }`}
                            >
                                Transaksi <ChevronDown size={16} className="-rotate-90 text-gray-400" />
                            </Link>
                        )}
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <button
                            onClick={() => { logout(); setIsOpen(false); }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                        >
                            <LogOut size={18} /> Keluar Aplikasi
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
};
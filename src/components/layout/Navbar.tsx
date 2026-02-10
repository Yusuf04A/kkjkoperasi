import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import {
    Menu, X, ChevronDown, Bell,
    LayoutDashboard, Wallet, History, Send, ArrowDownLeft, ArrowUpRight,
    FileText, LogOut, User, ArrowRightLeft, Megaphone
} from 'lucide-react';

export const Navbar = () => {
    const { user, logout, unreadCount, fetchUnreadCount } = useAuthStore();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);

    // Cek notifikasi setiap kali pindah halaman (biar update terus)
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

    const transactionLinks = [
        { label: 'Isi Saldo', path: '/transaksi/topup', icon: <ArrowDownLeft size={16} className="text-green-600" /> },
        { label: 'Tarik Tunai', path: '/transaksi/tarik', icon: <ArrowUpRight size={16} className="text-red-600" /> },
        { label: 'Kirim Uang', path: '/transaksi/kirim', icon: <Send size={16} className="text-blue-600" /> },
        { label: 'Riwayat', path: '/transaksi/riwayat', icon: <History size={16} className="text-orange-600" /> },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">

                    {/* 1. LOGO (KIRI) */}
                    <div className="flex-shrink-0 flex items-center cursor-pointer">
                        <Link to={isAdmin ? "/admin/dashboard" : "/"} className="flex items-center gap-2">
                            <div className="bg-kkj-blue text-white p-1.5 rounded-lg font-bold text-xl">KKJ</div>
                            <div className="hidden md:block leading-tight">
                                <span className="block font-bold text-gray-800 text-sm">Koperasi KKJ</span>
                                <span className="block text-[10px] text-gray-500 tracking-wider">MITRA SEJAHTERA</span>
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
                                        ? 'border-kkj-blue text-kkj-blue font-bold'
                                        : 'border-transparent text-gray-500 hover:text-gray-900'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}

                        {!isAdmin && (
                            <div className="relative group h-full flex items-center">
                                <button
                                    className={`text-sm font-medium transition-colors border-b-2 py-5 flex items-center gap-1 ${location.pathname.includes('/transaksi')
                                            ? 'border-kkj-blue text-kkj-blue font-bold'
                                            : 'border-transparent text-gray-500 hover:text-gray-900'
                                        }`}
                                >
                                    Transaksi <ChevronDown size={14} />
                                </button>
                                <div className="absolute top-[60px] left-1/2 -translate-x-1/2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top">
                                    {transactionLinks.map((item) => (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            {item.icon} {item.label}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 3. PROFIL & NOTIF (KANAN) */}
                    <div className="hidden md:flex items-center gap-4">

                        {/* Lonceng Notifikasi PINTAR */}
                        <Link to="/notifikasi" className="relative p-2 text-gray-400 hover:text-kkj-blue transition-colors rounded-full hover:bg-gray-100">
                            <Bell size={20} className={unreadCount > 0 ? 'text-gray-600 animate-pulse' : ''} />
                            {unreadCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                            )}
                        </Link>

                        <div className="h-6 w-px bg-gray-200"></div>

                        <Link to="/profil" className="flex items-center gap-3 hover:bg-gray-50 p-1.5 pr-3 rounded-full transition-all border border-transparent hover:border-gray-200">
                            <div className="text-right hidden lg:block">
                                <p className="text-sm font-bold text-gray-900 leading-none">{user.full_name}</p>
                                <p className="text-[10px] text-gray-500 uppercase font-bold mt-1">{user.role}</p>
                            </div>
                            <img
                                src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.full_name}&background=0D8ABC&color=fff`}
                                alt="Profile"
                                className="w-9 h-9 rounded-full object-cover shadow-sm"
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
                        <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* MOBILE MENU DRAWER */}
            {isOpen && (
                <div className="md:hidden bg-white border-t border-gray-100 p-4 shadow-lg absolute w-full left-0 top-16 h-screen overflow-y-auto pb-32 animate-in slide-in-from-top-5">
                    {/* ... (Konten Mobile Menu Sama Seperti Sebelumnya) ... */}
                    {/* Saya singkat biar gak kepanjangan, isinya sama persis dengan yang lama */}
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl mb-6 border border-gray-100">
                        <img
                            src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.full_name}&background=0D8ABC&color=fff`}
                            alt="Profile"
                            className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                            <p className="font-bold text-gray-900 text-lg">{user.full_name}</p>
                            <Link to="/profil" onClick={() => setIsOpen(false)} className="text-sm text-kkj-blue font-bold hover:underline">Edit Profil</Link>
                        </div>
                    </div>

                    <p className="text-xs font-bold text-gray-400 uppercase mb-3 px-2 tracking-wider">Menu Utama</p>
                    <div className="space-y-2">
                        {(isAdmin ? adminLinks : memberLinks).map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                onClick={() => setIsOpen(false)}
                                className={`block px-4 py-3 rounded-xl text-base font-bold transition-all ${isActive(link.path) ? 'bg-blue-50 text-kkj-blue' : 'text-gray-600 bg-white border border-gray-100 hover:bg-gray-50'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}

                        {!isAdmin && (
                            <Link
                                to="/transaksi"
                                onClick={() => setIsOpen(false)}
                                className={`block px-4 py-3 rounded-xl text-base font-bold flex justify-between items-center transition-all ${location.pathname.includes('/transaksi') ? 'bg-blue-50 text-kkj-blue' : 'text-gray-600 bg-white border border-gray-100 hover:bg-gray-50'
                                    }`}
                            >
                                Transaksi <ChevronDown size={16} className="-rotate-90 text-gray-400" />
                            </Link>
                        )}
                    </div>

                    <button
                        onClick={() => { logout(); setIsOpen(false); }}
                        className="w-full mt-8 flex items-center justify-center gap-2 px-4 py-4 rounded-xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                    >
                        <LogOut size={18} /> Keluar Aplikasi
                    </button>
                </div>
            )}
        </nav>
    );
};
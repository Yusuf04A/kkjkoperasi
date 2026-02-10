import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, LogOut, Bell, Menu } from 'lucide-react'; // Tambah Menu icon jika nanti butuh mobile trigger
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/useAuthStore';

export const Navbar = () => {
    const location = useLocation();
    const { logout, user } = useAuthStore();

    // Logic Menu Dinamis
    const memberNavItems = [
        { label: 'Dashboard', path: '/' },
        { label: 'Transaksi', path: '/transaksi' },
        { label: 'Pembiayaan', path: '/pembiayaan' },
    ];

    const adminNavItems = [
        { label: 'Dashboard Admin', path: '/admin/dashboard' },
        { label: 'Verifikasi', path: '/admin/verifikasi' },
        { label: 'Cek Transaksi', path: '/admin/transaksi' },
    ];

    const navItems = user?.role === 'admin' ? adminNavItems : memberNavItems;

    // Helper untuk inisial nama (Misal: Rizki -> RI)
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    return (
        <nav className="hidden lg:block bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">

                {/* 1. Logo Section */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-kkj-blue to-[#144272] rounded-xl flex items-center justify-center text-kkj-gold shadow-lg shadow-blue-900/20">
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <h1 className="font-bold text-kkj-blue text-xl leading-none">Koperasi KKJ</h1>
                        <p className="text-[10px] text-gray-500 tracking-wider font-medium mt-0.5 uppercase">
                            {user?.role === 'admin' ? 'Panel Pengurus' : 'Mitra Sejahtera'}
                        </p>
                    </div>
                </div>

                {/* 2. Menu Links */}
                <div className="flex items-center gap-8">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "text-sm font-medium transition-all duration-200 relative py-2",
                                    isActive
                                        ? "text-kkj-blue font-bold"
                                        : "text-gray-500 hover:text-kkj-blue"
                                )}
                            >
                                {item.label}
                                {isActive && (
                                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-kkj-gold rounded-full"></span>
                                )}
                            </Link>
                        );
                    })}
                </div>

                {/* 3. User Profile & Actions (SEKARANG CLICKABLE) */}
                <div className="flex items-center gap-2">
                    {/* Notifikasi */}
                    <Link to="/notifikasi" className="p-2.5 text-gray-400 hover:text-kkj-blue hover:bg-blue-50 rounded-full transition-all relative group">
                        <Bell size={20} />
                        <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white group-hover:scale-110 transition-transform"></span>
                    </Link>

                    {/* Pembatas Vertical */}
                    <div className="h-8 w-[1px] bg-gray-200 mx-2"></div>

                    {/* AREA PROFIL (KLIK DISINI MASUK KE /PROFIL) */}
                    <Link
                        to="/profil"
                        className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-xl hover:bg-gray-50 transition-all cursor-pointer group"
                    >
                        <div className="text-right">
                            <p className="text-sm font-bold text-gray-900 group-hover:text-kkj-blue transition-colors">
                                {user?.full_name || 'User'}
                            </p>
                            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">
                                {user?.role === 'admin' ? 'Administrator' : 'Anggota'}
                            </p>
                        </div>

                        {/* Avatar dengan Inisial */}
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-kkj-blue font-bold text-sm border-2 border-white shadow-sm group-hover:scale-105 group-hover:shadow-md transition-all overflow-hidden">
                            {user?.avatar_url ? (
                                // Tampilkan Foto jika ada
                                <img 
                                    src={user.avatar_url} 
                                    alt="Profile" 
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                // Tampilkan Inisial jika tidak ada foto
                                getInitials(user?.full_name || 'User')
                            )}
                        </div>
                    </Link>

                    {/* Tombol Logout (Terpisah agar tidak terpencet tidak sengaja) */}
                    <button
                        onClick={() => logout()}
                        className="ml-3 p-2.5 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all border border-transparent hover:border-red-100"
                        title="Keluar Aplikasi"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </div>
        </nav>
    );
};
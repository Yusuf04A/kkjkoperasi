import { Home, Repeat, Wallet, Bell, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';

export const BottomNav = () => {
    const location = useLocation();

    const navItems = [
        { label: 'Home', path: '/', icon: Home },
        { label: 'Transaksi', path: '/transaksi', icon: Repeat },
        { label: 'Pembiayaan', path: '/pembiayaan', icon: Wallet },
        { label: 'Notifikasi', path: '/notifikasi', icon: Bell },
        { label: 'Profil', path: '/profil', icon: User },
    ];

    // PERUBAHAN: Tambahkan 'lg:hidden' di className container utama
    return (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
            <div className="flex justify-around items-center h-16 max-w-md mx-auto">
                {/* max-w-md mx-auto menjaga icon tidak terlalu menyebar di tablet */}
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.label}
                            to={item.path}
                            className="flex flex-col items-center justify-center w-full h-full space-y-1"
                        >
                            <item.icon
                                size={22}
                                className={cn(
                                    "transition-colors duration-200",
                                    isActive ? "text-kkj-blue fill-current" : "text-gray-400"
                                )}
                            />
                            <span
                                className={cn(
                                    "text-[10px] font-medium",
                                    isActive ? "text-kkj-blue" : "text-gray-400"
                                )}
                            >
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};
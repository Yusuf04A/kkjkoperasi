import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { Navbar } from './Navbar';

export const MainLayout = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* 1. Navbar (Menu Atas - Khusus Desktop) */}
            <Navbar />

            {/* 2. Content Area */}
            {/* REVISI: Menghapus class 'max-w-7xl', 'mx-auto', 'px-6' agar layout FULL WIDTH (Selayar) */}
            <main className="flex-1 w-full relative">
                <Outlet />
            </main>

            {/* 3. Bottom Nav (Menu Bawah - Khusus Mobile) */}
            <BottomNav />
        </div>
    );
};
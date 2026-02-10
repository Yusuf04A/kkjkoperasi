import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Navbar';

export const MainLayout = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* 1. Sidebar (Hanya Muncul di Desktop) */}
            <Sidebar />

            {/* 2. Main Content Area */}
            {/* lg:ml-64 memberi margin kiri di desktop agar tidak tertutup sidebar */}
            <main className="flex-1 w-full lg:ml-64 min-h-screen relative">
                <div className="max-w-7xl mx-auto pb-20 lg:pb-8 lg:px-8">
                    <Outlet />
                </div>
            </main>

            {/* 3. Bottom Nav (Hanya Muncul di Mobile) */}
            <BottomNav />
        </div>
    );
};
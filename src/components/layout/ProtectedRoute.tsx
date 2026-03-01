import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, isLoading } = useAuthStore();

    if (isLoading) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-50/70 backdrop-blur-sm">
                <Loader2 className="animate-spin text-[#136f42]" size={48} />
            </div>
        );
    }

    // 1. Kalau belum login sama sekali -> Lempar ke Welcome
    if (!user) {
        return <Navigate to="/welcome" replace />;
    }

    // 2. Kalau Login TAPI statusnya 'pending' -> Lempar ke Ruang Tunggu
    // (Kecuali kalau usernya admin, admin bebas masuk walau pending - buat jaga2)
    if (user.status === 'pending' && user.role !== 'admin') {
        return <Navigate to="/pending" replace />;
    }

    // 3. Kalau status 'rejected' (Ditolak) -> Logout paksa (Opsional)
    if (user.status === 'rejected') {
        return <div className="p-10 text-center">Maaf, akun Anda dinonaktifkan. Hubungi Admin.</div>;
    }

    // 4. Lolos semua -> Silakan masuk
    return <>{children}</>;
};
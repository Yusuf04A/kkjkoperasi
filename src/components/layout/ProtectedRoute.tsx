import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const { user, isLoading } = useAuthStore();

    // 1. Tampilkan Loading jika sesi sedang dicek
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="animate-spin text-[#136f42]" size={40} />
                <span className="ml-3 text-sm font-medium text-gray-500">Memuat Sesi...</span>
            </div>
        );
    }

    // 2. Jika tidak ada user (Belum Login), lempar ke Welcome
    if (!user) {
        return <Navigate to="/welcome" replace />;
    }

    // 3. Jika status 'pending' dan bukan admin, lempar ke halaman Pending
    if (user.status === 'pending' && user.role !== 'admin') {
        return <Navigate to="/pending" replace />;
    }

    // 4. Jika status 'rejected', tampilkan pesan (atau lempar ke halaman khusus)
    if (user.status === 'rejected') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-10 text-center">
                <h2 className="text-xl font-bold text-red-600 mb-2">Akun Dinonaktifkan</h2>
                <p className="text-gray-600">Maaf, pendaftaran akun Anda ditolak atau diblokir. Silakan hubungi Admin.</p>
            </div>
        );
    }

    // 5. Jika lolos semua, render halaman yang diminta
    // Menggunakan Outlet jika children tidak ada (untuk nested routes di App.tsx)
    return children ? <>{children}</> : <Outlet />;
};
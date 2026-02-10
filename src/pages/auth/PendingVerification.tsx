import React from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { Clock, ShieldAlert, LogOut, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PendingVerification = () => {
    const { user, logout, checkSession } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleRefresh = async () => {
        await checkSession(); // Cek lagi ke database
        if (user?.status === 'active') {
            navigate('/'); // Kalau sudah aktif, masuk dashboard
        } else {
            alert('Masih menunggu verifikasi admin...');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
            <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-8 text-center border border-gray-100">

                {/* Ilustrasi Jam Pasir / Menunggu */}
                <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                    <Clock size={40} className="text-orange-500 animate-pulse" />
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full border-2 border-white">
                        <ShieldAlert size={16} />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">Menunggu Verifikasi</h1>
                <p className="text-gray-500 mb-6 leading-relaxed">
                    Halo <strong>{user?.full_name}</strong>, pendaftaran Anda sedang ditinjau oleh Admin Koperasi KKJ.
                    <br /><br />
                    Biasanya proses ini memakan waktu <strong>1x24 jam</strong>. Silakan cek berkala atau hubungi Admin jika mendesak.
                </p>

                <div className="space-y-3">
                    <button
                        onClick={handleRefresh}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-kkj-blue text-white rounded-xl font-bold hover:bg-blue-800 transition-colors"
                    >
                        <RefreshCw size={18} />
                        Cek Status Sekarang
                    </button>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-gray-100 text-gray-600 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                    >
                        <LogOut size={18} />
                        Keluar Aplikasi
                    </button>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 text-xs text-gray-400">
                    ID Pendaftaran: {user?.id?.slice(0, 8)}...
                </div>
            </div>
        </div>
    );
};
import React, { useState } from 'react';
import { X, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';

interface PinModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    title?: string;
}

export const PinModal: React.FC<PinModalProps> = ({ isOpen, onClose, onSuccess, title = "Masukkan PIN Transaksi" }) => {
    const { user } = useAuthStore();
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // 1. Cek apakah user sudah punya PIN di database
        if (!user?.pin) {
            toast.error("Anda belum mengatur PIN. Silakan atur di menu Profil.");
            onClose();
            return;
        }

        // 2. Validasi PIN (Sederhana: string match)
        // Note: Di production, sebaiknya validasi ini via RPC/Backend agar PIN tidak terekspos di network tab
        // Tapi untuk MVP Client-side logic, kita cek manual dulu.
        if (pin === user.pin) {
            toast.success("PIN Benar!");
            setPin('');
            onSuccess(); // Jalankan fungsi transaksi
            onClose();   // Tutup modal
        } else {
            toast.error("PIN Salah! Silakan coba lagi.");
            setPin('');
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-xs rounded-2xl p-6 shadow-2xl relative animate-in zoom-in-95">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <X size={20} />
                </button>

                <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3 text-kkj-blue">
                        <Lock size={24} />
                    </div>
                    <h3 className="font-bold text-gray-900">{title}</h3>
                    <p className="text-xs text-gray-500 mt-1">Demi keamanan, masukkan 6 digit PIN Anda.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        inputMode="numeric"
                        maxLength={6}
                        className="w-full text-center text-3xl tracking-[0.5em] font-bold py-3 border-b-2 border-gray-300 focus:border-kkj-blue outline-none mb-6"
                        placeholder="••••••"
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                        autoFocus
                    />

                    <button
                        type="submit"
                        disabled={loading || pin.length < 6}
                        className="w-full bg-kkj-blue text-white font-bold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-800 transition-colors"
                    >
                        {loading ? 'Memeriksa...' : 'Konfirmasi'}
                    </button>
                </form>

                <div className="text-center mt-4">
                    <p className="text-[10px] text-gray-400">Lupa PIN? Hubungi Admin.</p>
                </div>
            </div>
        </div>
    );
};
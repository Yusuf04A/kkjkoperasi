import React, { useState, useEffect } from 'react';
import { X, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
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
    
    // STATE UNTUK KONTROL LIHAT/SEMBUNYI PIN
    const [showPin, setShowPin] = useState(false);

    // 🔥 STATE BARU: Untuk menampilkan UI Sukses di dalam modal
    const [isSuccess, setIsSuccess] = useState(false);

    // Reset state setiap kali modal dibuka/ditutup
    useEffect(() => {
        if (!isOpen) {
            setPin('');
            setShowPin(false);
            setIsSuccess(false);
            setLoading(false);
        }
    }, [isOpen]);

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

        // 2. Validasi PIN
        if (pin === user.pin) {
            // 🔥 UBAH TAMPILAN JADI POPUP SUKSES TENGAH
            setIsSuccess(true);
            
            // Beri jeda 1.5 detik agar user bisa melihat animasi centang hijaunya
            setTimeout(() => {
                onSuccess(); // Jalankan fungsi transaksi (bayar/tarik/topup)
                onClose();   // Tutup modal
            }, 1500);

        } else {
            toast.error("PIN Salah! Silakan coba lagi.");
            setPin('');
            setLoading(false);
        }
    };

    // =========================================================================
    // 🔥 TAMPILAN JIKA PIN BENAR (GANTI WUJUD JADI CENTANG HIJAU)
    // =========================================================================
    if (isSuccess) {
        return (
            <div className="fixed inset-0 z-[999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                <div className="bg-white w-full max-w-xs rounded-[2.5rem] p-10 shadow-2xl relative animate-in zoom-in-95 duration-300 text-center border border-white/20">
                    <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 text-[#136f42] shadow-inner animate-in zoom-in duration-500">
                        <CheckCircle size={56} strokeWidth={2.5} />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">
                        PIN BENAR
                    </h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        Verifikasi keamanan berhasil...
                    </p>
                </div>
            </div>
        );
    }

    // =========================================================================
    // 🔥 TAMPILAN NORMAL (FORM INPUT PIN)
    // =========================================================================
    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-xs rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95 duration-200 border border-white/20">
                <button 
                    onClick={() => {
                        setPin('');
                        setShowPin(false);
                        onClose();
                    }} 
                    className="absolute top-5 right-5 text-slate-300 hover:text-rose-500 transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="text-center mb-8">
                    <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#136f42] shadow-sm">
                        <Lock size={28} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                    <p className="text-[11px] text-slate-400 font-medium mt-1 px-2 leading-relaxed">
                        Demi keamanan transaksi, masukkan 6 digit PIN anda.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative group">
                        <input
                            type={showPin ? "text" : "password"} // 🔥 LOGIKA VIEW PIN
                            inputMode="numeric"
                            maxLength={6}
                            className="w-full text-center text-3xl tracking-[0.5em] font-black py-4 bg-slate-50 border-b-4 border-slate-100 focus:border-[#136f42] outline-none transition-all rounded-xl text-slate-700"
                            placeholder="••••••"
                            value={pin}
                            onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                            autoFocus
                        />
                        
                        {/* 🔥 TOMBOL MATA (VIEW PIN) */}
                        <button 
                            type="button"
                            onClick={() => setShowPin(!showPin)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#136f42] p-2 transition-colors"
                        >
                            {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || pin.length < 6}
                        className="w-full bg-[#136f42] text-white font-bold py-4 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0f5c35] transition-all shadow-lg shadow-green-900/20 active:scale-[0.98] uppercase text-xs tracking-widest"
                    >
                        {loading ? 'Memverifikasi...' : 'Konfirmasi pin'}
                    </button>
                </form>

                <div className="text-center mt-6">
                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest leading-relaxed">
                        Lupa pin transaksi? <br/> Hubungi admin koperasi.
                    </p>
                </div>
            </div>
        </div>
    );
};
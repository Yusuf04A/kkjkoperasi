import React, { useState, useEffect } from 'react';
import { X, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'; 
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';

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
    const [showPin, setShowPin] = useState(false);

    // 🔥 STATE UNTUK KONTROL UI BERHASIL & GAGAL 🔥
    const [isSuccess, setIsSuccess] = useState(false);
    const [isError, setIsError] = useState(false);

    // 🔥 FUNGSI PEMUTAR SUARA (pop.mp3)
    const playSuccessSound = () => {
        const audio = new Audio('/sounds/pop.mp3');
        audio.volume = 0.5;
        audio.play().catch(err => console.log("Gagal putar suara:", err));
    };

    // Reset state setiap kali modal dibuka/ditutup
    useEffect(() => {
        if (!isOpen) {
            setPin('');
            setShowPin(false);
            setIsSuccess(false);
            setIsError(false);
            setLoading(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // TypeScript casting untuk menghindari error 'pin does not exist'
        const userPin = (user as any)?.pin;

        // 1. Cek keberadaan PIN
        if (!userPin) {
            onClose();
            return;
        }

        // 2. Validasi PIN
        if (pin === userPin) {
            // 🔥 Bunyi suara saat PIN BENAR
            playSuccessSound();
            setIsSuccess(true);
            setIsError(false);
            
            // Beri jeda 1.5 detik agar user bisa melihat animasi centang hijau
            setTimeout(() => {
                onSuccess(); 
                onClose();   
            }, 1500);

        } else {
            // 🔥 Bunyi suara saat PIN SALAH
            playSuccessSound();
            
            // Tampilkan popup merah di tengah
            setIsError(true);
            
            // Tunggu 1.5 detik lalu kembalikan ke form input agar user bisa coba lagi
            setTimeout(() => {
                setIsError(false);
                setPin('');
                setLoading(false);
            }, 1500);
        }
    };

    // =========================================================================
    // 🔥 TAMPILAN JIKA PIN BENAR (CENTANG HIJAU)
    // =========================================================================
    if (isSuccess) {
        return (
            <div className="fixed inset-0 z-[999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                <div className="bg-white w-full max-w-xs rounded-[2.5rem] p-10 shadow-2xl relative animate-in zoom-in-95 duration-300 text-center border border-white/20">
                    <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 text-[#136f42] shadow-inner animate-in zoom-in duration-500">
                        <CheckCircle size={56} strokeWidth={2.5} />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">PIN BENAR</h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">verifikasi keamanan berhasil...</p>
                </div>
            </div>
        );
    }

    // =========================================================================
    // 🔥 TAMPILAN JIKA PIN SALAH (PERINGATAN MERAH DI TENGAH)
    // =========================================================================
    if (isError) {
        return (
            <div className="fixed inset-0 z-[999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                <div className="bg-white w-full max-w-xs rounded-[2.5rem] p-10 shadow-2xl relative animate-in zoom-in-95 duration-300 text-center border border-white/20">
                    <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-600 shadow-inner animate-bounce">
                        <AlertCircle size={56} strokeWidth={2.5} />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2 text-rose-600">PIN SALAH!</h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed lowercase">silakan masukkan pin yang benar.</p>
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
                    <p className="text-[11px] text-slate-400 font-medium mt-1 px-2 leading-relaxed text-center lowercase">
                        demi keamanan transaksi, masukkan 6 digit pin anda.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative group">
                        <input
                            type={showPin ? "text" : "password"} 
                            inputMode="numeric"
                            maxLength={6}
                            className="w-full text-center text-3xl tracking-[0.5em] font-black py-4 bg-slate-50 border-b-4 border-slate-100 focus:border-[#136f42] outline-none transition-all rounded-xl text-slate-700 shadow-inner"
                            placeholder="••••••"
                            value={pin}
                            onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                            autoFocus
                        />
                        
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
                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest leading-relaxed text-center">
                        Lupa pin transaksi? <br/> Hubungi admin koperasi.
                    </p>
                </div>
            </div>
        </div>
    );
};
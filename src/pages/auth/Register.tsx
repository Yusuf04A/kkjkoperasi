import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { User, Phone, Lock, Mail, Loader2, ArrowLeft, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';
import { SuccessModal } from '../../components/SuccessModal'; 
import logoKKJ from '/src/assets/Logo-kkj.png';

export const Register = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // --- STATE UNTUK MODAL TENGAH (SUKSES & GAGAL) ---
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'success' | 'error';
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'success'
    });

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: ''
    });

    // 🔥 FUNGSI PEMUTAR SUARA (pop.mp3)
    const playSuccessSound = () => {
        try {
            const audio = new Audio('/sounds/pop.mp3');
            audio.volume = 0.5;
            audio.play().catch(err => console.warn("audio play blocked", err));
        } catch (e) {
            console.error("audio file not found");
        }
    };

    const checkPasswordStrength = (value: string) => {
        if (value.length === 0) return null;
        if (value.length < 6) return { label: 'Minimal 6 karakter', color: 'text-slate-400', isWeak: true };
        
        const hasNumber = /\d/.test(value);
        const hasUpper = /[A-Z]/.test(value);
        const isVeryWeak = "1234567890".includes(value) || value.toLowerCase() === "password";

        if (isVeryWeak) return { label: 'Password terlalu mudah ditebak', color: 'text-rose-500', isWeak: true };
        if (hasNumber && hasUpper && value.length >= 8) {
            return { label: 'Keamanan sangat baik', color: 'text-emerald-500', isWeak: false };
        }
        return { label: 'Keamanan cukup', color: 'text-amber-500', isWeak: false };
    };

    const strength = checkPasswordStrength(formData.password);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.email || !formData.phone || !formData.password) {
            toast.error('Mohon lengkapi semua data');
            return;
        }

        if (strength?.isWeak) {
            toast.error('Mohon perkuat password Anda');
            return;
        }

        setIsLoading(true);

        try {
            const { data, error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.name,
                        phone_number: formData.phone, 
                        role: 'member'
                    }
                }
            });

            if (error) {
                playSuccessSound();
                let errorMessage = "Terjadi kesalahan saat mendaftar. Silakan coba lagi.";
                if (error.message.includes("User already registered")) {
                    errorMessage = "Email ini sudah terdaftar. Silakan gunakan email lain atau masuk ke akun Anda.";
                }

                setModalConfig({
                    isOpen: true,
                    title: "Pendaftaran Gagal!",
                    message: errorMessage,
                    type: 'error'
                });
                throw error;
            }

            if (data.user) {
                playSuccessSound();
                setModalConfig({
                    isOpen: true,
                    title: "Pendaftaran Diajukan!",
                    message: `Selamat kak ${formData.name.toLowerCase()}, akun Anda berhasil didaftarkan. Silakan tunggu proses verifikasi oleh Admin maksimal 1x24 jam sebelum Anda dapat masuk ke aplikasi.`,
                    type: 'success'
                });
            }

        } catch (err: any) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleModalClose = () => {
        const isSuccess = modalConfig.type === 'success';
        setModalConfig({ ...modalConfig, isOpen: false });
        if (isSuccess) {
            navigate('/login');
        }
    };

    return (
        <div className="min-h-screen flex w-full font-sans bg-white overflow-hidden text-left">
            
            {/* === BAGIAN KIRI (KAPITAL DI AWAL) === */}
            <div className="hidden lg:flex w-1/2 bg-[#136f42] relative flex-col justify-between p-12 text-white">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-[#167d4a] to-[#0f5c35] opacity-95"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-white rounded-2xl shadow-lg border-b-2 border-[#4caf50]">
                            <img src={logoKKJ} alt="Logo KKJ" className="w-16 h-16 object-contain" />
                        </div>
                        <div className="flex flex-col font-black tracking-widest uppercase">
                            <span className="text-lg leading-none">Koperasi</span>
                            <span className="text-lg text-[#aeea00] leading-none mt-1">KKJ</span>
                        </div>
                    </div>

                    <h1 className="text-5xl font-extrabold leading-tight mb-6 tracking-tight">
                        Bergabung menjadi anggota <span className="text-[#aeea00]">Koperasi KKJ</span>
                    </h1>
                    <p className="text-green-100/90 text-lg leading-relaxed max-w-md font-medium">
                        Nikmati kemudahan layanan simpanan dan pembiayaan digital yang amanah dan transparan.
                    </p>
                </div>

                <div className="relative z-10 text-xs text-green-200/60 font-light tracking-wider uppercase">
                    &copy; 2026 Koperasi Pemasaran Karya Kita Jaya. All rights reserved.
                </div>
            </div>

            {/* === BAGIAN KANAN (FORM REGISTER) === */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white relative overflow-y-auto">
                <div className="w-full max-w-md space-y-6">
                    
                    <div className="lg:hidden flex flex-col items-center mb-6">
                        <img src={logoKKJ} alt="Logo" className="w-20 h-20 mb-3 object-contain drop-shadow-md" />
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight text-center uppercase">Daftar Anggota</h2>
                    </div>

                    <div className="hidden lg:block mb-4 uppercase">
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Buat Akun Baru</h2>
                        <p className="mt-1 text-sm text-gray-500 font-medium lowercase">Lengkapi data diri Anda untuk mendaftar</p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-1.5 uppercase">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Nama Lengkap</label>
                            <Input
                                placeholder="Nama lengkap"
                                icon={<User size={18} className="text-green-600" />}
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                className="focus:ring-[#5db930] focus:border-[#5db930] bg-gray-50 border-gray-200 pl-10 py-4 rounded-xl text-sm text-slate-800"
                            />
                        </div>
                        
                        <div className="space-y-1.5 uppercase">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Email Aktif</label>
                            <Input
                                type="email"
                                placeholder="contoh@email.com"
                                icon={<Mail size={18} className="text-green-600" />}
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                                className="focus:ring-[#5db930] focus:border-[#5db930] bg-gray-50 border-gray-200 pl-10 py-4 rounded-xl text-sm text-slate-800"
                            />
                        </div>
                        
                        <div className="space-y-1.5 uppercase">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Nomor Whatsapp</label>
                            <Input
                                type="tel"
                                placeholder="08123456789"
                                icon={<Phone size={18} className="text-green-600" />}
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                required
                                className="focus:ring-[#5db930] focus:border-[#5db930] bg-gray-50 border-gray-200 pl-10 py-4 rounded-xl text-sm text-slate-800"
                            />
                        </div>
                        
                        <div className="space-y-1.5 uppercase">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Password</label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Minimal 6 karakter"
                                    icon={<Lock size={18} className="text-green-600" />}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    className={cn(
                                        "focus:ring-[#5db930] focus:border-[#5db930] bg-gray-50 border-gray-200 pl-10 pr-12 py-4 rounded-xl text-sm transition-all text-slate-800",
                                        strength?.isWeak && formData.password.length > 0 && "border-rose-300 focus:ring-rose-200"
                                    )}
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-600 transition-colors uppercase">
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            {strength && (
                                <div className={cn("flex items-center gap-1.5 mt-1.5 ml-1 animate-in fade-in", strength.color)}>
                                    {strength.isWeak ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
                                    <span className="text-[10px] font-bold uppercase">{strength.label}</span>
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 rounded-xl bg-gradient-to-t from-[#5db930] to-[#76d646] text-white font-black text-lg shadow-[0_4px_0_#4a9c22] hover:translate-y-0.5 active:shadow-none active:translate-y-[4px] transition-all tracking-wider uppercase flex items-center justify-center gap-2 mt-6 disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={22} /> : 'Daftar Sekarang'}
                        </button>

                        {/* 🔥 TEKS NAVIGASI DIUBAH MENJADI KAPITAL DI AWAL 🔥 */}
                        <div className="text-center mt-8">
                            <p className="text-sm text-gray-500 font-medium">
                                Sudah punya akun?{' '}
                                <Link to="/login" className="font-bold text-[#136f42] hover:text-[#5db930] hover:underline transition-all">
                                    Masuk di sini
                                </Link>
                            </p>
                        </div>
                    </form>

                    <button 
                        onClick={() => navigate('/welcome')} 
                        className="flex items-center justify-center gap-2 text-gray-400 hover:text-[#136f42] text-[11px] font-bold uppercase tracking-widest transition-colors w-full mt-4"
                    >
                        <ArrowLeft size={14} /> Kembali ke Depan
                    </button>
                </div>
            </div>

            {/* modal tengah dinamis */}
            <SuccessModal 
                isOpen={modalConfig.isOpen}
                onClose={handleModalClose}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type} 
            />
        </div>
    );
};
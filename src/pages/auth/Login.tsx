import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore'; 
import { Mail, Lock, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { Input } from '../../components/ui/Input';
import { SuccessModal } from '../../components/SuccessModal'; 
import logoKKJ from '/src/assets/Logo-kkj.png'; 

export const Login = () => {
    const navigate = useNavigate();
    const { checkSession } = useAuthStore(); 
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({ email: '', password: '' });
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

    const [userRole, setUserRole] = useState('');

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password
            });

            // 🔥 LOGIKA POPUP GAGAL (WARNA MERAH & SENTENCE CASE) 🔥
            if (error) {
                playSuccessSound(); 
                setModalConfig({
                    isOpen: true,
                    title: "Login Gagal!",
                    message: "Email atau password yang Anda masukkan salah. Silakan periksa kembali akun Anda.",
                    type: 'error'
                });
                throw error;
            }

            if (data.user) {
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('role, status, full_name')
                    .eq('id', data.user.id)
                    .single();

                if (profileError) throw profileError;

                // PROTEKSI STATUS AKUN
                if (profile?.status === 'pending') {
                    playSuccessSound();
                    setModalConfig({
                        isOpen: true,
                        title: "Akun Belum Aktif",
                        message: `Halo ${profile.full_name}, akun Anda masih menunggu verifikasi admin. Silakan tunggu maksimal 1x24 jam.`,
                        type: 'error'
                    });
                    await supabase.auth.signOut();
                    return;
                }

                // 🔥 LOGIKA POPUP BERHASIL (SENTENCE CASE) 🔥
                playSuccessSound();
                setUserRole(profile.role);
                setModalConfig({
                    isOpen: true,
                    title: "Login Berhasil!",
                    message: `Selamat datang kembali ${profile.full_name}. Senang melihat Anda kembali di SiDiLA Koperasi KKJ.`,
                    type: 'success'
                });
                
                await checkSession(); 
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
            if (userRole === 'admin') {
                navigate('/admin/dashboard', { replace: true });
            } else {
                navigate('/', { replace: true });
            }
        }
    };

    return (
        <div className="min-h-screen flex w-full font-sans bg-white text-left">
            
            {/* --- BAGIAN KIRI (SENTENCE CASE - TIDAK KAPITAL SEMUA) --- */}
            <div className="hidden lg:flex w-1/2 bg-[#136f42] relative overflow-hidden flex-col justify-between p-12 text-white">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-[#167d4a] to-[#0f5c35] opacity-95"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="p-3 bg-white rounded-2xl shadow-lg">
                            <img src={logoKKJ} alt="Logo KKJ" className="w-20 h-20 object-contain" />
                        </div>
                        <div className="flex flex-col font-black tracking-widest uppercase">
                            <span className="text-lg leading-none">Koperasi</span>
                            <span className="text-lg text-[#aeea00] leading-none mt-1">KKJ</span>
                        </div>
                    </div>
                    {/* 🔥 JUDUL DISESUAIKAN: HANYA DEPANNYA KAPITAL 🔥 */}
                    <h1 className="text-5xl font-extrabold leading-tight mb-6 tracking-tight">
                        Berkoperasi demi wujud <span className="text-[#aeea00]">kesejahteraan bersama</span>
                    </h1>
                    <p className="text-green-100/90 text-lg leading-relaxed max-w-lg font-medium lowercase first-letter:uppercase">
                        Platform digital terpadu untuk layanan simpanan, pembiayaan, dan transaksi yang aman & transparan.
                    </p>
                </div>
                <div className="relative z-10 text-xs text-green-200/60 font-light tracking-wider uppercase">
                    &copy; 2026 Koperasi Pemasaran Karya Kita Jaya. All rights reserved.
                </div>
            </div>

            {/* --- BAGIAN KANAN (FORM LOGIN) --- */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white relative">
                <div className="w-full max-w-md space-y-8">
                    <div className="lg:hidden flex justify-center mb-6">
                        <img src={logoKKJ} alt="Logo" className="w-24 h-24 object-contain drop-shadow-lg" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Selamat Datang</h2>
                        <p className="mt-2 text-sm text-gray-500 font-medium">Masuk untuk mengakses layanan SiDiLA Koperasi KKJ</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Email Anggota</label>
                            <Input
                                type="email"
                                placeholder="Masukkan email Anda"
                                icon={<Mail size={18} className="text-green-600" />} 
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                                className="focus:ring-[#5db930] focus:border-[#5db930] bg-gray-50 border-gray-200 pl-10 py-5 rounded-xl text-slate-800"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                    <Lock className="h-[18px] w-[18px] text-green-600" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="block w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5db930] transition-all"
                                    placeholder="Masukkan password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-green-600 transition-colors">
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>
                        <button type="submit" disabled={isLoading} className="w-full py-4 rounded-xl bg-gradient-to-t from-[#5db930] to-[#76d646] text-white font-black text-lg shadow-[0_4px_0px_#4a9c22] hover:translate-y-1 active:shadow-none active:translate-y-[4px] transition-all tracking-wider uppercase flex items-center justify-center gap-2 mt-4">
                            {isLoading ? <Loader2 className="animate-spin" /> : 'Masuk Sekarang'}
                        </button>
                        <div className="text-center mt-8">
                            <p className="text-sm text-gray-500 font-medium">
                                Belum terdaftar?{' '}
                                <Link to="/register" className="font-bold text-[#136f42] hover:text-[#5db930] hover:underline transition-all">Daftar Anggota Baru</Link>
                            </p>
                        </div>
                    </form>

                    <button 
                        onClick={() => navigate('/welcome')} 
                        className="flex items-center justify-center gap-2 text-gray-400 hover:text-[#136f42] text-xs font-bold uppercase tracking-widest transition-colors w-full mt-4"
                    >
                        <ArrowLeft size={14} /> Kembali ke Depan
                    </button>
                </div>
            </div>

            {/* MODAL TENGAH DINAMIS */}
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
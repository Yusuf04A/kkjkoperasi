import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Mail, Lock, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { Input } from '../../components/ui/Input';
import logoKKJ from '/src/assets/Logo-kkj.png'; 

export const Login = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password
            });

            if (error) throw error;

            if (data.user) {
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('role, status, full_name')
                    .eq('id', data.user.id)
                    .single();

                if (profileError) throw profileError;

                if (profile?.status === 'pending') {
                    toast((t) => (
                        <div className="flex flex-col gap-1">
                            <span className="font-bold text-green-800">Login Berhasil, Tapi...</span>
                            <span className="text-sm text-green-700">Akun Kak <b>{profile.full_name}</b> masih menunggu verifikasi Admin.</span>
                            <button onClick={() => toast.dismiss(t.id)} className="bg-green-100 text-green-800 border border-green-200 font-bold px-2 py-1 text-xs rounded mt-1">Tutup</button>
                        </div>
                    ), { icon: '⏳', duration: 6000 });
                    await supabase.auth.signOut();
                    return;
                }

                if (profile?.status === 'rejected') {
                    toast.error('Maaf, pendaftaran akun ditolak.');
                    await supabase.auth.signOut();
                    return;
                }

                toast.success(`Selamat Datang, ${profile.full_name}!`);

                if (profile?.role === 'admin') {
                    navigate('/admin/dashboard');
                } else {
                    navigate('/');
                }
            }

        } catch (err: any) {
            console.error(err);
            toast.error('Email atau Password salah.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex w-full font-sans bg-white">
            
            {/* === BAGIAN KIRI (HIJAU - BRANDING) === */}
            <div className="hidden lg:flex w-1/2 bg-[#136f42] relative overflow-hidden flex-col justify-between p-12 text-white">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-[#167d4a] to-[#0f5c35] opacity-95 z-0"></div>

                <div className="relative z-10">
                    {/* --- HEADER LOGO --- */}
                    <div className="flex items-center gap-4 mb-10">
                        {/* Container Logo (Border dihapus/transparan) */}
                        <div className="p-3 bg-white rounded-2xl shadow-lg">
                            <img 
                                src={logoKKJ} 
                                alt="Logo KKJ" 
                                className="w-20 h-20 object-contain"
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-black tracking-[0.2em] text-lg uppercase text-white shadow-black drop-shadow-sm leading-none">
                                KOPERASI
                            </span>
                            <span className="font-black tracking-[0.2em] text-lg uppercase text-[#aeea00] shadow-black drop-shadow-sm leading-none mt-1">
                                KKJ
                            </span>
                        </div>
                    </div>

                    <h1 className="text-5xl font-extrabold leading-tight mb-6 tracking-tight">
                        Berkoperasi Demi Wujud <span className="text-[#aeea00]">Kesejahteraan Bersama</span>
                    </h1>
                    <p className="text-green-100/90 text-lg leading-relaxed max-w-lg font-medium">
                        Platform digital terpadu untuk layanan simpanan, pembiayaan, dan transaksi yang aman & transparan.
                    </p>
                </div>

                <div className="relative z-10 text-xs text-green-200/60 font-light tracking-wider">
                    &copy; 2026 Koperasi Pemasaran Karya Kita Jaya. All rights reserved.
                </div>
            </div>

            {/* === BAGIAN KANAN (FORM LOGIN) === */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white relative">
                <div className="w-full max-w-md space-y-8">
                    
                    {/* Header Mobile */}
                    <div className="lg:hidden flex justify-center mb-6">
                        <img src={logoKKJ} alt="Logo" className="w-24 h-24 object-contain drop-shadow-lg" />
                    </div>

                    <div className="text-left">
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Selamat Datang Kembali</h2>
                        <p className="mt-2 text-sm text-gray-500 font-medium">Masuk untuk mengakses layanan SiDiLA</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Email</label>
                            <div className="relative">
                                <Input
                                    type="email"
                                    placeholder="Masukkan email terdaftar"
                                    icon={<Mail size={18} className="text-green-600" />} 
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                    className="focus:ring-[#5db930] focus:border-[#5db930] bg-gray-50 border-gray-200 pl-10 py-5 rounded-xl"
                                />
                            </div>
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
                                    className="block w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5db930] focus:border-transparent transition-all"
                                    placeholder="Masukkan password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-green-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 rounded-xl bg-gradient-to-t from-[#5db930] to-[#76d646] text-white font-black text-lg shadow-[0_4px_0px_#4a9c22] hover:translate-y-1 active:shadow-none active:translate-y-[4px] transition-all tracking-wider uppercase flex items-center justify-center gap-2 mt-4"
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : 'MASUK APLIKASI'}
                        </button>

                        <div className="text-center mt-8">
                            <p className="text-sm text-gray-500 font-medium">
                                Belum menjadi anggota?{' '}
                                <Link to="/register" className="font-bold text-[#136f42] hover:text-[#5db930] hover:underline transition-all">
                                    Daftar Sekarang
                                </Link>
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

        </div>
    );
};
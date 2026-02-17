import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Phone, Lock, Mail, Loader2, ArrowLeft } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import toast from 'react-hot-toast';
import API from '../../api/api'; // Menggunakan jembatan API Laravel Anda
import logoKKJ from '/src/assets/Logo-kkj.png'; 

export const Register = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    // State Form
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '' 
    });

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validasi Sederhana
        if (!formData.name || !formData.email || !formData.phone || !formData.password) {
            toast.error('Mohon lengkapi semua data');
            return;
        }

        setIsLoading(true);

        try {
            // 1. DAFTAR KE LARAVEL BACKEND
            // Data dikirim ke Route::post('/register') di Laravel
            const response = await API.post('/register', {
                name: formData.name,
                email: formData.email,
                phone: formData.phone, // Pastikan di database MySQL Anda sudah ada kolom phone
                password: formData.password,
                password_confirmation: formData.password // Menggunakan password yang sama untuk konfirmasi
            });

            // 201 Created = Sukses Register
            if (response.status === 201) {
                toast.success('Pendaftaran Berhasil! Data tersimpan di MySQL.');
                
                // Opsional: Langsung login setelah daftar atau arahkan ke login page
                // navigate('/login'); 
                
                // Jika ingin auto-login, simpan token yang dikembalikan register (jika ada)
                // const { token, user } = response.data;
                // localStorage.setItem('token', token); ...
                
                navigate('/login');
            }

        } catch (err: any) {
            console.error(err);
            // Menangkap pesan error spesifik dari Laravel (misal: email sudah terdaftar)
            // Laravel biasanya mengembalikan error validasi di err.response.data.errors
            const errorMessage = err.response?.data?.message || 'Gagal mendaftar, silakan coba lagi.';
            toast.error(errorMessage);
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
                    <div className="flex items-center gap-4 mb-10">
                        <div className="p-3 bg-white rounded-2xl shadow-lg border-b-4 border-[#4caf50]">
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
                        Bergabung Menjadi Anggota <span className="text-[#aeea00]">Koperasi KKJ</span>
                    </h1>
                    <p className="text-green-100/90 text-lg leading-relaxed max-w-lg font-medium">
                        Platform digital terpadu untuk layanan simpanan, pembiayaan, dan transaksi yang amanah dan transparan.
                    </p>
                </div>

                <div className="relative z-10 text-xs text-green-200/60 font-light tracking-wider">
                    &copy; 2026 Koperasi Pemasaran Karya Kita Jaya. All rights reserved.
                </div>
            </div>

            {/* === BAGIAN KANAN (FORM REGISTER - PUTIH) === */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white relative">
                <div className="w-full max-w-md space-y-8">
                    
                    <div className="lg:hidden flex flex-col items-center mb-6">
                        <img src={logoKKJ} alt="Logo" className="w-24 h-24 mb-4 object-contain drop-shadow-lg" />
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight text-center">Daftar Anggota Baru</h2>
                    </div>

                    <div className="text-left hidden lg:block">
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Buat Akun Baru</h2>
                        <p className="mt-2 text-sm text-gray-500 font-medium">Lengkapi data diri Anda untuk mendaftar</p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-5">
                        
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Nama Lengkap (Sesuai KTP)</label>
                            <Input
                                placeholder="Nama Lengkap"
                                icon={<User size={18} className="text-green-600" />}
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                className="focus:ring-[#5db930] focus:border-[#5db930] bg-gray-50 border-gray-200 pl-10 py-5 rounded-xl"
                            />
                        </div>
                        
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Email Aktif</label>
                            <Input
                                type="email"
                                placeholder="contoh@email.com"
                                icon={<Mail size={18} className="text-green-600" />}
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                                className="focus:ring-[#5db930] focus:border-[#5db930] bg-gray-50 border-gray-200 pl-10 py-5 rounded-xl"
                            />
                        </div>
                        
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Nomor WhatsApp</label>
                            <Input
                                type="tel"
                                placeholder="08123456789"
                                icon={<Phone size={18} className="text-green-600" />}
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                required
                                className="focus:ring-[#5db930] focus:border-[#5db930] bg-gray-50 border-gray-200 pl-10 py-5 rounded-xl"
                            />
                        </div>
                        
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Password</label>
                            <Input
                                type="password"
                                placeholder="Minimal 6 karakter"
                                icon={<Lock size={18} className="text-green-600" />}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                                className="focus:ring-[#5db930] focus:border-[#5db930] bg-gray-50 border-gray-200 pl-10 py-5 rounded-xl"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 rounded-xl bg-gradient-to-t from-[#5db930] to-[#76d646] text-white font-black text-lg shadow-[0_4px_0px_#4a9c22] hover:translate-y-1 active:shadow-none active:translate-y-[4px] transition-all tracking-wider uppercase flex items-center justify-center gap-2 mt-6"
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : 'DAFTAR SEKARANG'}
                        </button>

                        <div className="text-center mt-6">
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
                        className="flex items-center justify-center gap-2 text-gray-400 hover:text-[#136f42] text-xs font-bold uppercase tracking-widest transition-colors w-full mt-4"
                    >
                        <ArrowLeft size={14} /> Kembali ke Depan
                    </button>
                </div>
            </div>
        </div>
    );
};
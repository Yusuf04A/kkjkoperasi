import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
// 🔥 Icon lengkap sesuai kode awal Anda
import { 
    User, Phone, Lock, Mail, Loader2, ArrowLeft, 
    Eye, EyeOff, AlertCircle, CheckCircle2, FileUp, 
    MessageCircle, CreditCard, QrCode 
} from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';
import { SuccessModal } from '../../components/SuccessModal'; 
import logoKKJ from '/src/assets/Logo-kkj.png';

export const Register = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    // 🔥 State File KTP mandatori
    const [ktpFile, setKtpFile] = useState<File | null>(null);

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

    // 🔥 FUNGSI PEMUTAR SUARA
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setKtpFile(e.target.files[0]);
        }
    };

    // 🔥 Fungsi WA Admin Otomatis
    const handleSendWhatsApp = () => {
        const adminNumber = "6289676065953"; 
        const text = `Halo Admin KKJ, saya *${formData.name}* baru saja mendaftar di aplikasi. Berikut saya lampirkan Bukti Bayar Simpanan Pokok saya senilai *Rp 250.000 (PAS)*. Mohon bantuannya untuk verifikasi akun saya. Terima kasih.`;
        const waUrl = `https://wa.me/${adminNumber}?text=${encodeURIComponent(text)}`;
        window.open(waUrl, '_blank');
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        // 🛑 VALIDASI KTP WAJIB
        if (!formData.name || !formData.email || !formData.phone || !formData.password || !ktpFile) {
            toast.error('Mohon lengkapi semua data dan upload KTP Anda');
            return;
        }

        if (strength?.isWeak) {
            toast.error('Mohon perkuat password Anda');
            return;
        }

        setIsLoading(true);

        try {
            // 1. PROSES UPLOAD KTP KE STORAGE
            const fileExt = ktpFile.name.split('.').pop();
            const fileName = `${Date.now()}-${formData.name.replace(/\s+/g, '_').toLowerCase()}.${fileExt}`;
            
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('ktp-registrations') 
                .upload(fileName, ktpFile);

            if (uploadError) {
                if (uploadError.message.includes("bucket not found")) {
                    setModalConfig({
                        isOpen: true,
                        title: "Sistem Belum Siap!",
                        message: "Wadah penyimpanan 'ktp-registrations' belum dibuat. Hubungi admin.",
                        type: 'error'
                    });
                } else {
                    toast.error("Gagal upload KTP: " + uploadError.message);
                }
                throw uploadError;
            }

            // 2. REGISTER DENGAN METADATA LENGKAP
            // 🔥 PERBAIKAN: uploadData.path dipastikan masuk ke objek metadata data
            const { data, error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.name,
                        phone_number: formData.phone, 
                        role: 'member',
                        ktp_url: uploadData.path, // 🔥 NILAI INI YANG DISIMPAN KE DATABASE
                        is_verified: false 
                    }
                }
            });

            if (error) {
                playSuccessSound();
                let errorMessage = error.message.includes("User already registered") 
                    ? "Email ini sudah terdaftar." 
                    : "Terjadi kesalahan saat mendaftar.";

                setModalConfig({ isOpen: true, title: "Pendaftaran Gagal!", message: errorMessage, type: 'error' });
                throw error;
            }

            if (data.user) {
                playSuccessSound();
                setModalConfig({
                    isOpen: true,
                    title: "Data Diterima!",
                    message: `Halo kak ${formData.name.toLowerCase()}, pendaftaran Anda sedang diproses. LANGKAH TERAKHIR: Silakan klik tombol di bawah untuk mengirim Bukti Bayar Simpanan Pokok (Rp 250.000) ke WhatsApp Admin agar akun Anda segera diverifikasi.`,
                    type: 'success'
                });
            }

        } catch (err: any) {
            console.error("Register Process Error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleModalClose = () => {
        const isSuccess = modalConfig.type === 'success';
        setModalConfig({ ...modalConfig, isOpen: false });
        if (isSuccess) {
            handleSendWhatsApp(); 
            navigate('/login');
        }
    };

    return (
        <div className="min-h-screen flex w-full font-sans bg-white overflow-hidden text-left">
            
            {/* === BAGIAN KIRI === */}
            <div className="hidden lg:flex w-1/2 bg-[#136f42] relative flex-col justify-between p-12 text-white">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-[#167d4a] to-[#0f5c35] opacity-95"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-8 text-left">
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

            {/* === BAGIAN KANAN === */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white relative overflow-y-auto">
                <div className="w-full max-w-md space-y-6">
                    
                    <div className="lg:hidden flex flex-col items-center mb-6">
                        <img src={logoKKJ} alt="Logo" className="w-20 h-20 mb-3 object-contain drop-shadow-md" />
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight text-center uppercase">Daftar Anggota</h2>
                    </div>

                    <div className="hidden lg:block mb-4">
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Buat Akun Baru</h2>
                        <p className="mt-1 text-sm text-gray-500 font-medium lowercase italic text-emerald-600 font-bold">Wajib upload KTP dan kirim bukti bayar Simpanan Pokok</p>
                    </div>

                    {/* TABEL INFORMASI BANK */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="flex items-center gap-2 text-[#136f42] font-black text-xs uppercase tracking-wider">
                            <CreditCard size={16} /> <span>Tujuan Transfer Simpanan Pokok</span>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-start border-b border-slate-200 pb-2">
                                <div className="text-[10px] font-bold text-slate-500 uppercase">Bank Mandiri</div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-slate-800">1360031033316</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase leading-none mt-0.5">an. Koperasi Karya Kita Jaya</p>
                                </div>
                            </div>
                            <div className="flex justify-between items-start border-b border-slate-200 pb-2">
                                <div className="text-[10px] font-bold text-slate-500 uppercase">Bank BRI</div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-slate-800">032501003161306</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase leading-none mt-0.5">an. Koperasi Karya Kita Jaya</p>
                                </div>
                            </div>
                            <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-dashed border-slate-300">
                                <div className="text-[10px] font-black text-emerald-600 uppercase flex items-center gap-1.5">
                                    <QrCode size={14} /> Bayar Pakai QRIS
                                </div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scan di Admin</div>
                            </div>
                        </div>
                        <div className="bg-orange-50 p-2 rounded-lg border border-orange-100">
                             <p className="text-[9px] font-bold text-orange-600 text-center leading-tight lowercase">
                                *pastikan nominal transfer pas rp 250.000. simpan bukti transfer untuk dikirim ke whatsapp admin setelah pendaftaran.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-1.5 uppercase">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Nama Lengkap</label>
                            <Input
                                placeholder="Nama lengkap sesuai KTP"
                                icon={<User size={18} className="text-green-600" />}
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                className="focus:ring-[#5db930] focus:border-[#5db930] bg-gray-50 border-gray-200 pl-10 py-4 rounded-xl text-sm text-slate-800 font-bold uppercase"
                            />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                    placeholder="08xx"
                                    icon={<Phone size={18} className="text-green-600" />}
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    required
                                    className="focus:ring-[#5db930] focus:border-[#5db930] bg-gray-50 border-gray-200 pl-10 py-4 rounded-xl text-sm text-slate-800"
                                />
                            </div>
                        </div>

                        {/* BOX UPLOAD KTP */}
                        <div className="space-y-1.5 uppercase">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Upload KTP Asli</label>
                            <div className={cn(
                                "relative flex items-center justify-center border-2 border-dashed rounded-xl p-6 transition-all bg-gray-50",
                                ktpFile ? "border-[#5db930] bg-green-50 shadow-inner" : "border-gray-200 hover:border-green-400"
                            )}>
                                <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" required />
                                <div className="flex flex-col items-center gap-2">
                                    {ktpFile ? (
                                        <><CheckCircle2 size={28} className="text-[#136f42]" /><span className="text-[10px] font-bold text-[#136f42] uppercase truncate max-w-[200px]">{ktpFile.name}</span></>
                                    ) : (
                                        <><FileUp size={28} className="text-gray-400" /><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Klik Pilih Foto KTP</span></>
                                    )}
                                </div>
                            </div>
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
                                    className={cn("focus:ring-[#5db930] focus:border-[#5db930] bg-gray-50 border-gray-200 pl-10 pr-12 py-4 rounded-xl text-sm text-slate-800", strength?.isWeak && formData.password.length > 0 && "border-rose-300")}
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            {strength && (
                                <div className={cn("flex items-center gap-1.5 mt-1.5 ml-1", strength.color)}>
                                    {strength.isWeak ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
                                    <span className="text-[10px] font-bold uppercase">{strength.label}</span>
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 rounded-xl bg-gradient-to-t from-[#5db930] to-[#76d646] text-white font-black text-lg shadow-[0_4px_0_#4a9c22] uppercase tracking-wider flex items-center justify-center gap-2 mt-6 disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={22} /> : 'Kirim Pendaftaran'}
                        </button>

                        <div className="text-center mt-8 pb-10">
                            <p className="text-sm text-gray-500 font-medium">Sudah punya akun? <Link to="/login" className="font-bold text-[#136f42] hover:underline">Masuk di sini</Link></p>
                        </div>
                    </form>
                </div>
            </div>

            <SuccessModal 
                isOpen={modalConfig.isOpen}
                onClose={handleModalClose}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type} 
                actionLabel="Kirim Bukti ke Admin (WA)"
                onAction={handleSendWhatsApp}
            />
        </div>
    );
};
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { Mail, Lock, Loader2, ArrowLeft, Eye, EyeOff, Phone, ChevronRight } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { SuccessModal } from '../../components/SuccessModal';
import logoKKJ from '/src/assets/Logo-kkj.png';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export const Login = () => {
    const navigate = useNavigate();
    const { checkSession } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);

    // Smart Door State 
    const [loginId, setLoginId] = useState('');
    const [isAdminMode, setIsAdminMode] = useState(false);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // OTP state
    const [otpStep, setOtpStep] = useState<1 | 2>(1);
    const [otp, setOtp] = useState(['', '', '', '']);
    const [generatedOtp, setGeneratedOtp] = useState('');
    const [countdown, setCountdown] = useState(0);

    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean; title: string; message: string; type: 'success' | 'error';
    }>({ isOpen: false, title: '', message: '', type: 'success' });

    const [userRole, setUserRole] = useState('');

    const playSuccessSound = () => {
        try {
            const audio = new Audio('/sounds/pop.mp3');
            audio.volume = 0.5;
            audio.play().catch(() => { });
        } catch (e) { }
    };

    // Countdown effect
    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    // WebOTP API
    useEffect(() => {
        if (otpStep === 2 && 'credentials' in navigator) {
            const ac = new AbortController();
            (navigator.credentials as any).get({
                otp: { transport: ['sms'] },
                signal: ac.signal
            }).then((cred: any) => {
                if (cred && cred.code) {
                    const codeArr = cred.code.split('').slice(0, 4);
                    setOtp([...codeArr, ...Array(4 - codeArr.length).fill('')].slice(0, 4));
                }
            }).catch((e: any) => console.error(e));
            return () => ac.abort();
        }
    }, [otpStep]);

    // Auto-Detect Mode
    useEffect(() => {
        setIsAdminMode(loginId.includes('@'));
    }, [loginId]);

    // Format phone number / email
    const handleLoginIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setLoginId(val);
    };

    const sendOtpToFonnte = async (targetPhone: string, code: string) => {
        const token = import.meta.env.VITE_FONNTE_TOKEN || "TOKEN";
        const data = new FormData();
        data.append('target', targetPhone);
        data.append('message', `Kode OTP SiDiLA Koperasi KKJ Anda adalah: ${code}. Berlaku selama 5 menit. JANGAN BERIKAN KODE INI KEPADA SIAPAPUN.`);

        try {
            const res = await fetch('https://api.fonnte.com/send', {
                method: 'POST',
                headers: { 'Authorization': token },
                body: data
            });
            const result = await res.json();
            if (!res.ok || !result.status) throw new Error(result.reason || "Gagal mengirim OTP");
            return true;
        } catch (error) {
            console.error(error);
            toast.error("Gagal mengirim OTP melalui Fonnte.");
            return false;
        }
    };

    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();

        // Cek jika ini mode submit admin
        if (isAdminMode) {
            return handleAdminSubmit(e);
        }

        if (!loginId) return toast.error("Masukkan nomor HP");
        setIsLoading(true);

        try {
            // FORMAT NOMOR HP UNTUK PENGECEKAN
            const cleanPhone = loginId.replace(/\D/g, '');
            let baseNumber = cleanPhone;
            if (cleanPhone.startsWith('628')) {
                baseNumber = cleanPhone.substring(2);
            } else if (cleanPhone.startsWith('08')) {
                baseNumber = cleanPhone.substring(1);
            } else if (cleanPhone.startsWith('8')) {
                baseNumber = cleanPhone;
            }

            const phone08 = '0' + baseNumber;
            const phone62 = '62' + baseNumber;
            const phonePlus62 = '+62' + baseNumber;

            const { data: profile, error } = await supabase
                .from('profiles')
                .select('status, phone, full_name')
                .or(`phone.eq.${phone08},phone.eq.${phone62},phone.eq.${phonePlus62}`)
                .single();

            if (error || !profile) {
                toast.error("Nomor HP tidak terdaftar di sistem!");
                setIsLoading(false);
                return;
            }

            if (profile.status === 'pending') {
                playSuccessSound();
                setModalConfig({
                    isOpen: true,
                    title: "Menunggu Verifikasi Admin",
                    message: `Halo ${profile.full_name}, pendaftaran Anda masih dalam tahap verifikasi oleh admin Koperasi KKJ. Mohon tunggu maksimal 1x24 jam.`,
                    type: 'error'
                });
                setIsLoading(false);
                return;
            }

            if (profile.status === 'rejected') {
                playSuccessSound();
                setModalConfig({
                    isOpen: true,
                    title: "Pendaftaran Ditolak",
                    message: `Mohon maaf ${profile.full_name}, pendaftaran akun Anda telah ditolak oleh Admin. Silakan hubungi pengurus Koperasi KKJ untuk info lebih lanjut.`,
                    type: 'error'
                });
                setIsLoading(false);
                return;
            }

            if (profile.status !== 'active') {
                playSuccessSound();
                setModalConfig({
                    isOpen: true,
                    title: "Akun Dinonaktifkan",
                    message: `Maaf ${profile.full_name}, akun Anda saat ini tidak aktif. Silakan hubungi Admin Koperasi KKJ.`,
                    type: 'error'
                });
                setIsLoading(false);
                return;
            }

            let formattedPhone = loginId;
            if (formattedPhone.startsWith('08')) {
                formattedPhone = '628' + formattedPhone.substring(2);
            } else if (formattedPhone.startsWith('8')) {
                formattedPhone = '628' + formattedPhone.substring(1);
            }

            const newOtp = Math.floor(1000 + Math.random() * 9000).toString();
            setGeneratedOtp(newOtp);

            const success = await sendOtpToFonnte(formattedPhone, newOtp);
            if (success) {
                toast.success("OTP berhasil dikirim!");
                setOtpStep(2);
                setCountdown(60);
            }
        } catch (err) {
            console.error(err);
            toast.error("Terjadi kesalahan saat memeriksa data");
        }
        
        setIsLoading(false);
    };

    const handleOtpChange = (index: number, value: string) => {
        if (!/^[0-9]*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        if (value && index < 3) {
            document.getElementById(`otp-${index + 1}`)?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            document.getElementById(`otp-${index - 1}`)?.focus();
        }
    };

    const onVerified = async (phone: string) => {
        try {
            // Bersihkan segala macam spasi, strip, atau plus
            const cleanPhone = phone.replace(/\D/g, '');

            // Generate 3 jenis prefix yang sering ada di Database
            // Contoh base number: 12345678 (dari 0812345678 atau 62812345678)
            let baseNumber = cleanPhone;
            if (cleanPhone.startsWith('628')) {
                baseNumber = cleanPhone.substring(2); // "8..."
            } else if (cleanPhone.startsWith('08')) {
                baseNumber = cleanPhone.substring(1); // "8..."
            } else if (cleanPhone.startsWith('8')) {
                baseNumber = cleanPhone;              // "8..."
            }

            const phone08 = '0' + baseNumber;
            const phone62 = '62' + baseNumber;
            const phonePlus62 = '+62' + baseNumber;

            console.log("Mencari user dengan HP:", { phone08, phone62, phonePlus62 });

            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .or(`phone.eq.${phone08},phone.eq.${phone62},phone.eq.${phonePlus62}`)
                .single();

            if (error) {
                console.error("Supabase Error pencarian profil OTP:", error);
                return false;
            }

            if (!profile) {
                console.warn("Profil tidak ditemukan dengan variasi HP tersebut.");
                return false;
            }

            // Delay checkSession into handleModalClose to prevent App.tsx from auto-routing
            // Persistence Session logic (Local Storage Sync)
            localStorage.setItem('kkj_otp_session', JSON.stringify(profile));
            // useAuthStore.setState({ user: profile, isLoading: false });

            console.log("Login sukses, menyetel sesi:", profile);
            return true;
        } catch (error) {
            console.error("onVerified Fatal Error:", error);
            return false;
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        const entered = otp.join('');
        if (entered.length < 4) return toast.error("Masukkan 4 digit OTP");

        setIsLoading(true);
        if (entered === generatedOtp || entered === '1234') { // Fallback 1234 for testing
            // Format phoneNumber untuk pengecekan awal
            let formattedPhone = loginId;
            if (formattedPhone.startsWith('08')) {
                formattedPhone = '628' + formattedPhone.substring(2);
            } else if (formattedPhone.startsWith('8')) {
                formattedPhone = '628' + formattedPhone.substring(1);
            }

            console.log("Mencoba validasi DB untuk:", formattedPhone);
            const success = await onVerified(formattedPhone);

            if (success) {
                playSuccessSound();

                const savedSession = localStorage.getItem('kkj_otp_session');
                const parsedProfile = savedSession ? JSON.parse(savedSession) : { role: 'user' };
                setUserRole(parsedProfile.role || 'user');

                // 🔥 ESTABLISH REAL SUPABASE SESSION IN BACKGROUND
                if (parsedProfile && parsedProfile.email && parsedProfile.phone) {
                    try {
                        await supabase.auth.signInWithPassword({
                            email: parsedProfile.email,
                            password: `${parsedProfile.phone}Kkj2026!`
                        });
                    } catch (e) {
                        console.error('Background login failed, but continuing with OTP session:', e);
                    }
                }

                setModalConfig({
                    isOpen: true,
                    title: "Berhasil Masuk!",
                    message: "Kode OTP valid. Mengalihkan Anda ke beranda Koperasi KKJ...",
                    type: 'success'
                });
            } else {
                playSuccessSound();
                setModalConfig({
                    isOpen: true,
                    title: "Gagal Login!",
                    message: "Profil dengan nomor HP ini tidak ditemukan. Pastikan Anda sudah terdaftar atau hubungi admin.",
                    type: 'error'
                });
            }
        } else {
            playSuccessSound();
            setModalConfig({
                isOpen: true,
                title: "Login Gagal!",
                message: "Kode OTP yang Anda masukkan salah.",
                type: 'error'
            });
        }
        setIsLoading(false);
    };

    const handleAdminSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: loginId,
                password: password

            });

            if (error) {
                playSuccessSound();
                setModalConfig({
                    isOpen: true, title: "Login Gagal!", message: "Email atau password yang Anda masukkan salah. Silakan periksa kembali akun Anda.", type: 'error'
                });
                throw error;
            }

            if (data.user) {
                const { data: profile, error: profileError } = await supabase
                    .from('profiles').select('role, status, full_name').eq('id', data.user.id).single();

                if (profileError) throw profileError;

                if (profile?.status === 'pending') {
                    playSuccessSound();
                    setModalConfig({
                        isOpen: true, title: "Akun Belum Aktif", message: `Halo ${profile.full_name}, akun Anda masih menunggu verifikasi admin. Silakan tunggu maksimal 1x24 jam.`, type: 'error'
                    });
                    await supabase.auth.signOut();
                    return;
                }

                if (profile?.status === 'rejected') {
                    playSuccessSound();
                    setModalConfig({
                        isOpen: true, title: "Pendaftaran Ditolak", message: `Mohon maaf ${profile.full_name}, akun admin Anda telah ditolak.`, type: 'error'
                    });
                    await supabase.auth.signOut();
                    return;
                }

                if (profile?.status !== 'active') {
                    playSuccessSound();
                    setModalConfig({
                        isOpen: true, title: "Akun Dinonaktifkan", message: `Maaf ${profile.full_name}, akun Anda saat ini tidak aktif.`, type: 'error'
                    });
                    await supabase.auth.signOut();
                    return;
                }

                playSuccessSound();
                setUserRole(profile.role);
                setModalConfig({
                    isOpen: true,
                    title: "Login Admin Berhasil!",
                    message: `Selamat datang kembali ${profile.full_name}. Anda akan dialihkan ke ruang kendali utama.`,
                    type: 'success'
                });
            }
        } catch (err: any) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleModalClose = async () => {
        const isSuccess = modalConfig.type === 'success';
        setModalConfig({ ...modalConfig, isOpen: false });
        if (isSuccess) {
            // Initiate the global state change ONLY after modal is closed
            await checkSession();

            if (userRole === 'admin' || userRole === 'superadmin') navigate('/admin/dashboard', { replace: true });
            else navigate('/', { replace: true });
        }
    };

    return (
        <div className="min-h-screen flex w-full font-sans bg-slate-50 text-left">
            {/* Bagian Kiri */}
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

            {/* Bagian Kanan dengan Framer Motion & Glassmorphism */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 bg-gray-50 relative overflow-hidden">
                {/* Decorative background blobs */}
                <div className="absolute top-[0%] left-[-10%] w-96 h-96 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
                <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>

                <motion.div
                    animate={{ y: [-5, 5, -5] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-full max-w-md bg-white/70 backdrop-blur-md border border-white/50 p-8 sm:p-10 rounded-3xl shadow-[0_20px_50px_rgba(19,111,66,0.2)] relative z-10"
                >
                    <div className="lg:hidden flex justify-center mb-6">
                        <img src={logoKKJ} alt="Logo" className="w-20 h-20 object-contain drop-shadow-lg" />
                    </div>
                    <div className="mb-8">
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                            Selamat Datang
                        </h2>
                        <p className="mt-2 text-sm text-gray-600 font-medium">
                            {otpStep === 1 ? 'Masukkan WhatsApp atau Email Anda' : 'Masukkan kode OTP yang dikirim ke HP Anda'}
                        </p>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div key="main-form" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }}>
                            {otpStep === 1 ? (
                                <form onSubmit={handleRequestOtp} className="space-y-5">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 transition-all">
                                            {isAdminMode ? 'Email Admin' : 'Nomor HP / WhatsApp'}
                                        </label>
                                        <Input
                                            type="text"
                                            placeholder="08xx"
                                            icon={isAdminMode ? <Mail size={18} className="text-[#136f42]" /> : <Phone size={18} className="text-[#136f42]" />}
                                            value={loginId}
                                            onChange={handleLoginIdChange}
                                            required
                                            className="focus:ring-[#136f42] focus:border-[#136f42] bg-white/50 border-gray-200 pl-10 py-4 rounded-xl text-slate-800 font-medium transition-all"
                                        />
                                        {!isAdminMode && <p className="text-xs text-gray-400 ml-1 mt-1">Sistem otomatis mendeteksi format login.</p>}
                                    </div>

                                    {/* Kolom Password dinamis menggunakan Framer Motion */}
                                    <AnimatePresence>
                                        {isAdminMode && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                                animate={{ opacity: 1, height: 'auto', marginTop: '1.25rem' }}
                                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                className="space-y-1 overflow-hidden"
                                            >
                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Password</label>
                                                <div className="relative group">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                                        <Lock className="h-[18px] w-[18px] text-[#136f42]" />
                                                    </div>
                                                    <input
                                                        type={showPassword ? "text" : "password"}
                                                        required={isAdminMode}
                                                        className="block w-full pl-10 pr-12 py-4 bg-white/50 border border-gray-200 rounded-xl text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#136f42] focus:border-[#136f42] transition-all"
                                                        placeholder="Masukkan password rahasia..."
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                    />
                                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-[#136f42] transition-colors">
                                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <button type="submit" disabled={isLoading} className={`w-full py-4 rounded-xl font-black text-lg shadow-[0_4px_15px_rgba(19,111,66,0.3)] hover:shadow-[0_6px_20px_rgba(19,111,66,0.4)] hover:-translate-y-0.5 active:translate-y-1 transition-all tracking-wider uppercase flex items-center justify-center gap-2 mt-4 text-white ${isAdminMode ? 'bg-gradient-to-r from-gray-800 to-gray-900 shadow-gray-400' : 'bg-gradient-to-r from-[#136f42] to-[#1a8e55]'}`}>
                                        {isLoading ? <Loader2 className="animate-spin" /> : isAdminMode ? 'Login Admin Masuk' : <>Kirim Kode OTP <ChevronRight size={20} /></>}
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handleVerifyOtp} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 text-center block">Kode OTP 4 Digit</label>
                                        <div className="flex justify-center gap-4">
                                            {otp.map((digit, idx) => (
                                                <input
                                                    key={idx}
                                                    id={`otp-${idx}`}
                                                    type="text"
                                                    inputMode="numeric"
                                                    maxLength={1}
                                                    value={digit}
                                                    autoComplete={idx === 0 ? "one-time-code" : "off"}
                                                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                                                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                                    className="w-16 h-16 text-center text-3xl font-black bg-white/60 border-2 border-gray-200 rounded-2xl focus:border-[#136f42] focus:ring-[#136f42] outline-none transition-all shadow-sm"
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <button type="submit" disabled={isLoading || otp.join('').length < 4} className="w-full py-4 rounded-xl bg-gradient-to-r from-[#136f42] to-[#1a8e55] text-white font-black text-lg shadow-[0_4px_15px_rgba(19,111,66,0.4)] transition-all tracking-wider uppercase flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                        {isLoading ? <Loader2 className="animate-spin" /> : 'Verifikasi OTP'}
                                    </button>

                                    <div className="text-center text-sm font-medium">
                                        {countdown > 0 ? (
                                            <span className="text-gray-500">Kirim ulang dalam <span className="text-[#136f42] font-bold">{countdown}s</span></span>
                                        ) : (
                                            <button type="button" onClick={handleRequestOtp} className="text-[#136f42] hover:text-[#1a8e55] font-bold hover:underline transition-all">
                                                Kirim Ulang Kode
                                            </button>
                                        )}
                                    </div>
                                    <button type="button" onClick={() => { setOtpStep(1); setOtp(['', '', '', '']) }} className="w-full flex justify-center text-xs font-bold text-gray-400 hover:text-gray-600 uppercase tracking-widest mt-2">
                                        Ganti Nomor HP
                                    </button>
                                </form>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    <button
                        onClick={() => navigate('/welcome')}
                        className="flex items-center justify-center gap-2 text-gray-400 hover:text-[#136f42] text-xs font-bold uppercase tracking-widest transition-colors w-full mt-6"
                    >
                        <ArrowLeft size={14} /> Kembali ke Depan
                    </button>
                </motion.div>
            </div>

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
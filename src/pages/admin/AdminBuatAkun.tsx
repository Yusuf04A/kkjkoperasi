import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, UserPlus, Eye, EyeOff, RefreshCw,
    CheckCircle2, AlertCircle, Loader2, ShieldAlert, User, Mail, Phone, Lock
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';

// Import Logo
import logoKKJ from '../../assets/Logo-kkj.png';

export const AdminBuatAkun = () => {
    const navigate = useNavigate();
    const { user: currentUser, checkSession } = useAuthStore();

    // Guard: hanya superadmin yang bisa akses
    // isRestoringSession = true saat signUp sedang berlangsung
    // supaya flicker 'Akses Ditolak' tidak muncul
    const [isRestoringSession, setIsRestoringSession] = useState(false);
    const isSuperAdmin = currentUser?.role === 'superadmin';

    // --- FORM STATE ---
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // --- UI STATE ---
    const [isLoading, setIsLoading] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // --- GENERATE PASSWORD RANDOM ---
    const generatePassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!';
        const len = 10;
        let pass = '';
        for (let i = 0; i < len; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setPassword(pass);
        setShowPassword(true);
    };

    // --- VALIDASI FORM ---
    const validateForm = () => {
        if (!fullName.trim()) return 'Nama lengkap wajib diisi.';
        if (!email.trim() || !email.includes('@')) return 'Email tidak valid.';
        if (!phone.trim() || phone.length < 9) return 'Nomor HP tidak valid.';
        if (!password || password.length < 6) return 'Password minimal 6 karakter.';
        return null;
    };

    // --- SUBMIT: BUAT AKUN ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFeedback(null);

        const validationError = validateForm();
        if (validationError) {
            setFeedback({ type: 'error', message: validationError });
            return;
        }

        setIsLoading(true);
        // Blokir guard 'Akses Ditolak' selama proses berlangsung
        setIsRestoringSession(true);
        try {
            // ⚠️ Simpan sesi superadmin SEBELUM signUp
            const { data: { session: adminSession } } = await supabase.auth.getSession();
            if (!adminSession) throw new Error('Sesi superadmin tidak ditemukan. Silakan login ulang.');

            // 0. Generate NIAK terlebih dahulu (sebelum akun dibuat)
            const { count } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'member')
                .eq('status', 'active')
                .not('member_id', 'is', null);
            const seq = (count || 0) + 1;
            const now = new Date();
            const yy = String(now.getFullYear()).slice(2);
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const nnak = String(seq).padStart(4, '0');
            const memberId = `KKJ-${yy}${mm}${nnak}`;

            // 1. Buat akun baru (signUp otomatis sign-in user baru)
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: email.trim().toLowerCase(),
                password,
                options: {
                    data: {
                        full_name: fullName.trim(),
                        phone: phone.trim(),
                    }
                }
            });

            // Jika signUp gagal, langsung restore dulu baru throw
            if (signUpError || !signUpData.user) {
                await supabase.auth.setSession({
                    access_token: adminSession.access_token,
                    refresh_token: adminSession.refresh_token,
                });
                await checkSession();
                setIsRestoringSession(false);
                let msg = signUpError?.message || 'Gagal membuat akun.';
                if (msg.includes('already registered') || msg.includes('User already registered')) {
                    msg = 'Email ini sudah terdaftar. Gunakan email lain.';
                }
                throw new Error(msg);
            }

            const newUserId = signUpData.user.id;

            // 2. Upsert profil lengkap dengan NIAK, role, status aktif
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: newUserId,
                    full_name: fullName.trim(),
                    email: email.trim().toLowerCase(),
                    phone: phone.trim(),
                    role: 'member',
                    status: 'active',
                    member_id: memberId,
                    is_verified: true,
                    simpok_balance: 250000,
                }, { onConflict: 'id' });

            // 3. ✅ Restore sesi superadmin
            await supabase.auth.setSession({
                access_token: adminSession.access_token,
                refresh_token: adminSession.refresh_token,
            });
            // Sync ulang store Zustand agar nama/role superadmin kembali
            await checkSession();
            setIsRestoringSession(false);

            if (profileError) throw new Error('Akun dibuat, tapi gagal set profil: ' + profileError.message);

            // 4. Sukses
            setFeedback({
                type: 'success',
                message: `✅ Akun berhasil dibuat! NIAK: ${memberId} • Email: ${email.trim().toLowerCase()}`,
            });

            // Reset form
            setFullName('');
            setEmail('');
            setPhone('');
            setPassword('');

        } catch (err: any) {
            setFeedback({ type: 'error', message: err.message || 'Terjadi kesalahan.' });
        } finally {
            setIsLoading(false);
        }
    };

    // ===== RENDER: LOADING saat restore sesi (mencegah flash 'Akses Ditolak') =====
    if (isRestoringSession) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 size={40} className="animate-spin text-[#136f42]" />
                    <p className="text-[10px] font-black text-slate-400 tracking-widest">Memproses akun...</p>
                </div>
            </div>
        );
    }

    // ===== RENDER: ACCESS DENIED (bukan superadmin) =====
    if (!isSuperAdmin) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 font-sans">
                <div className="bg-white rounded-[2rem] p-10 shadow-xl border border-slate-100 max-w-sm w-full text-center">
                    <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <ShieldAlert size={40} className="text-rose-500" />
                    </div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tighter">Akses Ditolak</h2>
                    <p className="text-slate-500 text-sm font-medium mt-3 leading-relaxed">
                        Halaman ini hanya dapat diakses oleh <span className="text-[#136f42] font-black">Super Admin</span>.
                    </p>
                    <button
                        onClick={() => navigate('/admin/dashboard')}
                        className="mt-8 w-full py-3.5 bg-[#136f42] hover:bg-[#0f5a35] text-white font-black rounded-2xl text-[10px] tracking-widest transition-all"
                    >
                        Kembali ke Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // ===== RENDER: FORM BUAT AKUN =====
    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-16 font-sans">

            {/* HEADER */}
            <div className="bg-white border-b sticky top-0 z-30 px-6 py-6 shadow-sm">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={() => navigate('/admin/dashboard')}
                            className="flex items-center gap-2 text-gray-400 hover:text-[#136f42] transition-all group w-fit"
                        >
                            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="text-sm font-medium">Kembali</span>
                        </button>

                        <div className="flex flex-col mt-1">
                            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-none mb-1">Buat Akun Anggota</h1>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 pt-8 space-y-6">
                <div className="max-w-2xl mx-auto space-y-6">

                    {/* HERO CARD */}
                    <div className="relative bg-[#136f42] rounded-[2rem] p-7 overflow-hidden shadow-xl">
                        <div className="relative z-10 flex items-center gap-5">
                            <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/20">
                                <UserPlus size={26} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white tracking-tighter leading-tight">
                                    Buat Akun Manual
                                </h2>
                                <p className="text-green-100/70 text-[10px] font-bold tracking-widest mt-1">
                                    Akun langsung aktif tanpa perlu verifikasi
                                </p>
                            </div>
                        </div>
                        <div className="absolute -bottom-8 -right-8 w-36 h-36 bg-white/5 rounded-full blur-3xl" />
                    </div>

                    {/* FEEDBACK BANNER */}
                    <AnimatePresence>
                        {feedback && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className={`flex items-start gap-3 p-4 rounded-2xl border ${feedback.type === 'success'
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                    : 'bg-rose-50 border-rose-200 text-rose-800'
                                    }`}
                            >
                                {feedback.type === 'success'
                                    ? <CheckCircle2 size={18} className="flex-shrink-0 mt-0.5" />
                                    : <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                                }
                                <p className="text-[11px] font-bold leading-relaxed">{feedback.message}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* FORM CARD */}
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-lg p-6 md:p-8">
                        <form onSubmit={handleSubmit} className="space-y-5">

                            {/* Nama Lengkap */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 tracking-widest flex items-center gap-1.5">
                                    <User size={11} /> Nama Lengkap
                                </label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={e => setFullName(e.target.value)}
                                    placeholder="Contoh: Budi Santoso"
                                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-[#136f42] focus:ring-2 focus:ring-[#136f42]/10 transition-all"
                                    disabled={isLoading}
                                />
                            </div>

                            {/* Email */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 tracking-widest flex items-center gap-1.5">
                                    <Mail size={11} /> Email
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="contoh@email.com"
                                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-[#136f42] focus:ring-2 focus:ring-[#136f42]/10 transition-all"
                                    disabled={isLoading}
                                />
                            </div>

                            {/* Nomor HP */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 tracking-widest flex items-center gap-1.5">
                                    <Phone size={11} /> Nomor HP / WhatsApp
                                </label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                                    placeholder="08xxxxxxxxxx"
                                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-[#136f42] focus:ring-2 focus:ring-[#136f42]/10 transition-all"
                                    disabled={isLoading}
                                />
                            </div>

                            {/* Password */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 tracking-widest flex items-center gap-1.5">
                                    <Lock size={11} /> Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="Minimal 6 karakter"
                                        className="w-full px-4 py-3.5 pr-24 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-[#136f42] focus:ring-2 focus:ring-[#136f42]/10 transition-all font-mono"
                                        disabled={isLoading}
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={generatePassword}
                                            title="Generate password otomatis"
                                            className="p-1.5 text-slate-400 hover:text-[#136f42] transition-colors"
                                            disabled={isLoading}
                                        >
                                            <RefreshCw size={14} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(v => !v)}
                                            className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors"
                                            disabled={isLoading}
                                        >
                                            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </button>
                                    </div>
                                </div>
                                <p className="text-[9px] text-slate-400 font-medium pl-1">
                                    💡 Klik ikon <RefreshCw size={9} className="inline" /> untuk generate password otomatis
                                </p>
                            </div>

                            {/* INFO BOX */}
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 flex items-start gap-2.5">
                                <AlertCircle size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
                                <p className="text-[10px] text-blue-700 font-semibold leading-relaxed">
                                    Akun yang dibuat di sini langsung berstatus <strong>aktif (approved)</strong>.
                                    Pastikan catat email & password untuk diberikan ke anggota yang bersangkutan.
                                </p>
                            </div>

                            {/* SUBMIT BUTTON */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 bg-[#136f42] hover:bg-[#0f5a35] disabled:opacity-60 disabled:cursor-not-allowed text-white font-black rounded-2xl text-[10px] tracking-widest transition-all shadow-lg shadow-green-900/20 flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Membuat Akun...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus size={15} />
                                        Buat Akun Sekarang
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    <p className="text-center text-[9px] font-bold text-slate-300 tracking-widest pb-4">
                        Super Admin Exclusive • KKJ Internal Tools
                    </p>
                </div>
            </div>
        </div>
    );
};

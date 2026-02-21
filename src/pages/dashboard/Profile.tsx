import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { 
    User, Phone, Mail, Shield, Save, ArrowLeft, Camera, 
    Trash2, ShieldCheck, Lock, HelpCircle, KeyRound, LogOut, Pencil,
    Eye, EyeOff, AlertCircle, CheckCircle2 // Tambahan import icon
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';

export const Profile = () => {
    const { user, checkSession, logout } = useAuthStore();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [uploading, setUploading] = useState(false);

    // State Form Profil
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
    });

    // State Form PIN
    const [pin, setPin] = useState(''); 
    const [oldPin, setOldPin] = useState(''); 
    const [pinLoading, setPinLoading] = useState(false);

    // 🔥 STATE BARU: Untuk kontrol lihat/sembunyi PIN
    const [showOldPin, setShowOldPin] = useState(false);
    const [showNewPin, setShowNewPin] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                full_name: user.full_name || '',
                phone: user.phone || '',
            });
        }
    }, [user]);

    const getInitials = (name: string) => {
        return name
            ? name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2)
            : 'US';
    };

    // 🔥 FUNGSI BARU: Cek Kelemahan PIN
    const checkPinStrength = (value: string) => {
        if (value.length === 0) return null;
        if (value.length < 6) return { label: 'Minimal 6 digit', color: 'text-slate-400' };
        
        const isRepeated = /(.)\1{5}/.test(value); // Cek angka kembar (111111)
        const isSequential = "0123456789012345".includes(value) || "9876543210987654".includes(value);

        if (isRepeated || isSequential) {
            return { label: 'PIN terlalu lemah (mudah ditebak)', color: 'text-rose-500', isWeak: true };
        }
        return { label: 'Kekuatan PIN baik', color: 'text-emerald-500', isWeak: false };
    };

    const strength = checkPinStrength(pin);

    // --- LOGOUT HANDLER ---
    const handleLogout = async () => {
        const confirm = window.confirm("Apakah Anda yakin ingin keluar dari aplikasi?");
        if (confirm) {
            await logout();
            navigate('/login');
        }
    };

    // --- UPLOAD IMAGE ---
    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            const toastId = toast.loading('Mengupload foto...');

            if (!event.target.files || event.target.files.length === 0) throw new Error('Pilih gambar terlebih dahulu.');

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

            const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user?.id);
            if (updateError) throw updateError;

            await checkSession();
            toast.success('Foto profil diperbarui!', { id: toastId });

        } catch (error: any) {
            toast.error('Gagal upload: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    // --- REMOVE IMAGE ---
    const handleRemoveImage = async () => {
        const confirm = window.confirm("Hapus foto profil?");
        if (!confirm) return;
        const toastId = toast.loading('Menghapus foto...');
        try {
            const { error } = await supabase.from('profiles').update({ avatar_url: null }).eq('id', user?.id);
            if (error) throw error;
            await checkSession();
            toast.success('Foto dihapus.', { id: toastId });
        } catch (error: any) {
            toast.error('Gagal hapus: ' + error.message, { id: toastId });
        }
    };

    // --- UPDATE PROFILE ---
    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const toastId = toast.loading('Menyimpan perubahan...');
        try {
            const { error } = await supabase.from('profiles').update({
                full_name: formData.full_name,
                phone: formData.phone,
            }).eq('id', user?.id);

            if (error) throw error;
            toast.success('Profil diperbarui!', { id: toastId });
            setIsEditing(false);
            await checkSession();
        } catch (error: any) {
            toast.error('Gagal update: ' + error.message, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    // --- LOGIC GANTI/SET PIN ---
    const handleSavePin = async () => {
        if (pin.length !== 6) {
            toast.error("PIN Baru harus 6 digit angka!");
            return;
        }

        // Cek apakah PIN lemah sebelum simpan
        if (strength?.isWeak) {
            toast.error("PIN terlalu lemah, gunakan kombinasi angka lain.");
            return;
        }

        if (user?.pin) {
            if (!oldPin) {
                toast.error("Masukkan PIN Lama untuk verifikasi!");
                return;
            }
            if (oldPin !== user.pin) {
                toast.error("PIN Lama SALAH!");
                return;
            }
            if (oldPin === pin) {
                toast.error("PIN Baru tidak boleh sama dengan PIN Lama.");
                return;
            }
        }

        const confirmText = user?.pin ? "Ubah PIN Transaksi?" : "Set PIN Transaksi?";
        const confirm = window.confirm(confirmText);
        if (!confirm) return;

        setPinLoading(true);
        const toastId = toast.loading("Menyimpan PIN...");
        try {
            const { error } = await supabase.from('profiles').update({ pin: pin }).eq('id', user?.id);
            if (error) throw error;

            toast.success("PIN Berhasil Disimpan!", { id: toastId });
            setPin('');
            setOldPin('');
            await checkSession();
        } catch (err: any) {
            toast.error("Gagal: " + err.message, { id: toastId });
        } finally {
            setPinLoading(false);
        }
    };

    const handleForgotPin = () => {
        const message = `Halo Admin Koperasi KKJ, saya ${user?.full_name} (ID: ${user?.member_id}) lupa PIN transaksi saya. Mohon bantuannya untuk reset. Terimakasih.`;
        const whatsappUrl = `https://wa.me/6281234567890?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <div className="max-w-7xl mx-auto p-4 lg:p-8 pb-32 lg:pb-12">

                {/* Breadcrumb */}
                <div className="hidden lg:flex items-center gap-2 mb-6 text-gray-500 hover:text-[#136f42] cursor-pointer w-fit transition-colors" onClick={() => navigate('/')}>
                    <ArrowLeft size={18} />
                    <span className="text-sm font-bold">Kembali ke Dashboard</span>
                </div>

                {/* --- HEADER TITLE & TOMBOL EDIT PROFIL --- */}
                <div className="flex flex-row justify-between items-end mb-6 gap-4">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight">Profil Saya</h1>
                        <p className="text-gray-500 mt-1 text-sm lg:text-base font-medium">Kelola informasi akun dan preferensi Anda.</p>
                    </div>
                    
                    {!isEditing && (
                        <Button 
                            onClick={() => setIsEditing(true)} 
                            variant="outline" 
                            className="w-fit min-w-0 bg-white border-[#136f42] text-[#136f42] hover:bg-green-50 font-bold shadow-sm px-4 py-2 h-10 rounded-xl flex items-center gap-2 text-sm transition-colors"
                        >
                            <Pencil size={16} strokeWidth={2.5} /> Edit Profil
                        </Button>
                    )}
                </div>

                {/* 1. KARTU PROFIL UTAMA */}
                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-green-900/5 border border-green-50 overflow-hidden relative mb-8">
                    {/* Background Header Hijau */}
                    <div className="h-44 bg-gradient-to-br from-[#167d4a] via-[#136f42] to-[#0f5c35] relative">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#aeea00]/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
                    </div>

                    <div className="px-6 lg:px-10 pb-10 relative">
                        {/* Avatar */}
                        <div className="flex justify-between items-end -mt-16 mb-8">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-full bg-white p-1.5 shadow-2xl">
                                    <div className="w-full h-full rounded-full bg-green-50 flex items-center justify-center text-[#136f42] text-4xl font-black overflow-hidden border border-green-100 relative">
                                        {user?.avatar_url ? (
                                            <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <span>{getInitials(user?.full_name || 'User')}</span>
                                        )}
                                        {uploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-bold">Loading...</div>}
                                    </div>
                                </div>
                                {isEditing && (
                                    <div className="absolute -bottom-2 -right-2 flex gap-2">
                                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                                        <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2.5 bg-[#136f42] text-white rounded-full shadow-lg hover:bg-[#0f5c35] border-4 border-white transition-transform active:scale-95"><Camera size={16} /></button>
                                        {user?.avatar_url && <button type="button" onClick={handleRemoveImage} className="p-2.5 bg-rose-500 text-white rounded-full shadow-lg hover:bg-rose-600 border-4 border-white transition-transform active:scale-95"><Trash2 size={16} /></button>}
                                    </div>
                                )}
                            </div>
                            <div className="hidden md:block mb-2">
                                <span className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border ${user?.role === 'admin' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-[#aeea00] text-[#0f5c35] border-[#aeea00]'}`}>
                                    {user?.role === 'admin' ? 'Administrator' : 'Anggota Aktif'}
                                </span>
                            </div>
                        </div>

                        {/* Nama & Info */}
                        <div className="mb-8">
                            <h2 className="text-2xl lg:text-4xl font-black text-slate-900 tracking-tight mb-1">{user?.full_name}</h2>
                            <div className="flex flex-wrap items-center gap-3 text-slate-500 text-sm font-bold">
                                <span>{user?.email}</span>
                                <span className="hidden sm:inline w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                <span>{user?.phone}</span>
                                <span className={`md:hidden ml-2 px-2 py-0.5 rounded text-[10px] font-black uppercase border ${user?.role === 'admin' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                                    {user?.role === 'admin' ? 'Admin' : 'Member'}
                                </span>
                            </div>
                        </div>

                        <div className="h-px bg-slate-100 mb-8"></div>

                        {/* Form Profil */}
                        <form onSubmit={handleUpdateProfile} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <Input label="Nama Lengkap" icon={<User size={18} />} value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} disabled={!isEditing || isLoading} className={isEditing ? "bg-white border-green-200 focus:ring-green-100" : "bg-slate-50 border-transparent"} />
                                <Input label="Nomor WhatsApp" icon={<Phone size={18} />} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} disabled={!isEditing || isLoading} className={isEditing ? "bg-white border-green-200 focus:ring-green-100" : "bg-slate-50 border-transparent"} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <Input label="Email Akun" icon={<Mail size={18} />} value={user?.email || ''} disabled={true} className="bg-slate-50/50 text-slate-400 border-slate-100 cursor-not-allowed" />
                                <Input label="Nomor Induk Anggota (NIAK)" icon={<Shield size={18} />} value={user?.member_id || 'Belum Diterbitkan'} disabled={true} className="bg-slate-50/50 text-slate-400 border-slate-100 cursor-not-allowed font-mono tracking-wider font-bold" />
                            </div>
                            
                            {/* Tombol Simpan / Batal */}
                            {isEditing && (
                                <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-50 animate-in fade-in slide-in-from-bottom-2">
                                    <Button type="button" variant="ghost" onClick={() => { setIsEditing(false); setFormData({ full_name: user?.full_name || '', phone: user?.phone || '' }); }} disabled={isLoading} className="text-slate-500 hover:text-rose-600 hover:bg-rose-50 font-bold">Batal</Button>
                                    <Button type="submit" isLoading={isLoading} className="bg-[#136f42] hover:bg-[#0f5c35] px-8 rounded-xl shadow-lg font-bold"> <Save size={18} className="mr-2" /> Simpan Perubahan </Button>
                                </div>
                            )}
                        </form>
                    </div>
                </div>

                {/* 2. KEAMANAN AKUN (PIN) */}
                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-green-900/5 border border-green-50 overflow-hidden relative p-8 lg:p-10 mb-8">
                    <div className="flex items-center gap-4 mb-8 border-b border-slate-50 pb-6">
                        <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-[#136f42]">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Keamanan Akun</h2>
                            <p className="text-sm font-medium text-slate-500">Atur PIN 6 digit untuk keamanan transaksi.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Kolom Kiri: Status PIN */}
                        <div>
                            <div className={`p-5 rounded-2xl border flex items-start gap-4 ${user?.pin ? 'bg-[#aeea00]/10 border-[#aeea00] text-[#0f5c35]' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                                <div className={`p-2.5 rounded-xl ${user?.pin ? 'bg-[#aeea00] text-[#0f5c35]' : 'bg-amber-100 text-amber-600'}`}>
                                    {user?.pin ? <ShieldCheck size={24} /> : <Lock size={24} />}
                                </div>
                                <div>
                                    <h3 className="font-black text-sm uppercase tracking-wide">{user?.pin ? 'PIN Transaksi Aktif' : 'PIN Belum Diatur'}</h3>
                                    <p className="text-xs mt-1 font-medium opacity-80 leading-relaxed">
                                        {user?.pin
                                            ? "Akun Anda terlindungi. PIN digunakan untuk verifikasi setiap transaksi keluar."
                                            : "Segera atur PIN untuk mengaktifkan fitur transfer dan penarikan saldo."}
                                    </p>
                                </div>
                            </div>

                            {user?.pin && (
                                <button
                                    onClick={handleForgotPin}
                                    className="mt-4 text-xs text-[#136f42] font-bold hover:underline flex items-center gap-2 ml-1"
                                >
                                    <HelpCircle size={14} /> Lupa PIN Saya?
                                </button>
                            )}
                        </div>

                        {/* Kolom Kanan: Form Ganti PIN */}
                        <div className="space-y-5">
                            {user?.pin && (
                                <div>
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">PIN Lama</label>
                                    <div className="relative group">
                                        <input
                                            type={showOldPin ? "text" : "password"} // 🔥 View PIN Logic
                                            maxLength={6}
                                            placeholder="******"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-lg font-black tracking-[0.5em] focus:ring-4 focus:ring-green-50 focus:border-[#136f42] outline-none transition-all"
                                            value={oldPin}
                                            onChange={(e) => setOldPin(e.target.value.replace(/[^0-9]/g, ''))}
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => setShowOldPin(!showOldPin)} 
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#136f42] p-2"
                                        >
                                            {showOldPin ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">
                                    {user?.pin ? 'PIN Baru' : 'Buat PIN Baru (6 Angka)'}
                                </label>
                                <div className="relative group">
                                    <input
                                        type={showNewPin ? "text" : "password"} // 🔥 View PIN Logic
                                        maxLength={6}
                                        placeholder="******"
                                        className={cn(
                                            "w-full bg-slate-50 border rounded-xl px-4 py-3.5 text-lg font-black tracking-[0.5em] focus:ring-4 outline-none transition-all",
                                            strength?.isWeak ? "border-rose-200 focus:ring-rose-50 focus:border-rose-500" : "border-slate-200 focus:ring-green-50 focus:border-[#136f42]"
                                        )}
                                        value={pin}
                                        onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setShowNewPin(!showNewPin)} 
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#136f42] p-2"
                                    >
                                        {showNewPin ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>

                                {/* 🔥 INFO KELEMAHAN PIN 🔥 */}
                                {strength && (
                                    <div className={cn("flex items-center gap-1.5 ml-1 animate-in fade-in slide-in-from-top-1", strength.color)}>
                                        {strength.isWeak ? <AlertCircle size={12} /> : <CheckCircle2 size={12} />}
                                        <span className="text-[10px] font-bold uppercase tracking-tight">{strength.label}</span>
                                    </div>
                                )}
                            </div>

                            <Button
                                onClick={handleSavePin}
                                isLoading={pinLoading}
                                disabled={pin.length < 6 || (!!user?.pin && oldPin.length < 6) || strength?.isWeak}
                                className="w-full bg-[#136f42] hover:bg-[#0f5c35] text-white py-4 rounded-xl font-bold shadow-lg shadow-green-900/20 disabled:opacity-50 active:scale-95 transition-all"
                            >
                                <KeyRound size={18} className="mr-2" />
                                {user?.pin ? "Ganti PIN" : "Simpan PIN"}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* 3. LOGOUT BUTTON */}
                <div className="flex flex-col items-center gap-4 mb-20">
                    <button 
                        onClick={handleLogout}
                        className="w-full md:w-auto md:min-w-[300px] bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
                    >
                        <LogOut size={20} strokeWidth={2.5} />
                        Keluar Aplikasi
                    </button>
                    <p className="text-center text-slate-300 text-[10px] font-black uppercase tracking-[0.3em]">
                        Koperasi KKJ App v1.0.2
                    </p>
                </div>

            </div>
        </div>
    );
};
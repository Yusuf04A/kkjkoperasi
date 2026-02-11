import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { User, Phone, Mail, Shield, Save, ArrowLeft, Camera, Trash2, ShieldCheck, Lock, HelpCircle, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export const Profile = () => {
    const { user, checkSession } = useAuthStore();
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
    const [pin, setPin] = useState(''); // PIN Baru
    const [oldPin, setOldPin] = useState(''); // PIN Lama (Untuk verifikasi)
    const [pinLoading, setPinLoading] = useState(false);

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

    // --- LOGIC GANTI/SET PIN (FIXED SECURITY) ---
    const handleSavePin = async () => {
        // 1. Validasi Input PIN Baru
        if (pin.length !== 6) {
            toast.error("PIN Baru harus 6 digit angka!");
            return;
        }

        // 2. Jika User SUDAH punya PIN, Wajib Masukkan PIN Lama
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

    // --- LUPA PIN (WHATSAPP) ---
    const handleForgotPin = () => {
        const message = `Halo Admin Koperasi KKJ, saya ${user?.full_name} (ID: ${user?.member_id}) lupa PIN transaksi saya. Mohon bantuannya untuk reset. Terimakasih.`;
        const whatsappUrl = `https://wa.me/6281234567890?text=${encodeURIComponent(message)}`; // Ganti No HP Admin
        window.open(whatsappUrl, '_blank');
    };

    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="max-w-7xl mx-auto p-4 lg:p-8 pb-32 lg:pb-12">

                {/* Breadcrumb */}
                <div className="hidden lg:flex items-center gap-2 mb-6 text-gray-500 hover:text-kkj-blue cursor-pointer w-fit transition-colors" onClick={() => navigate('/')}>
                    <ArrowLeft size={18} />
                    <span className="text-sm font-medium">Kembali ke Dashboard</span>
                </div>

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Profil Saya</h1>
                        <p className="text-gray-500 mt-1">Kelola informasi akun dan preferensi Anda.</p>
                    </div>
                    {!isEditing && (
                        <div className="hidden lg:block">
                            <Button onClick={() => setIsEditing(true)} variant="outline" className="border-kkj-blue text-kkj-blue hover:bg-blue-50">
                                Edit Profil
                            </Button>
                        </div>
                    )}
                </div>

                {/* 1. KARTU PROFIL UTAMA */}
                <div className="bg-white rounded-3xl shadow-lg shadow-gray-100 border border-gray-100 overflow-hidden relative mb-8">
                    <div className="h-40 bg-gradient-to-r from-kkj-blue to-[#003366] relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
                    </div>

                    <div className="px-6 lg:px-10 pb-10 relative">
                        {/* Avatar */}
                        <div className="flex justify-between items-end -mt-16 mb-6">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-full bg-white p-1.5 shadow-xl">
                                    <div className="w-full h-full rounded-full bg-blue-50 flex items-center justify-center text-kkj-blue text-4xl font-bold overflow-hidden border border-gray-100 relative">
                                        {user?.avatar_url ? (
                                            <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <span>{getInitials(user?.full_name || 'User')}</span>
                                        )}
                                        {uploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs">Loading...</div>}
                                    </div>
                                </div>
                                {isEditing && (
                                    <div className="absolute -bottom-2 -right-2 flex gap-2">
                                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                                        <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2.5 bg-kkj-blue text-white rounded-full shadow-lg hover:bg-blue-700 border-2 border-white"><Camera size={16} /></button>
                                        {user?.avatar_url && <button type="button" onClick={handleRemoveImage} className="p-2.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 border-2 border-white"><Trash2 size={16} /></button>}
                                    </div>
                                )}
                            </div>
                            <div className="hidden md:block">
                                <span className={`px-4 py-2 rounded-xl text-sm font-bold border ${user?.role === 'admin' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                    {user?.role === 'admin' ? 'ADMINISTRATOR' : 'ANGGOTA AKTIF'}
                                </span>
                            </div>
                        </div>

                        {/* Info Text */}
                        <div className="mb-8">
                            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">{user?.full_name}</h2>
                            <div className="flex flex-wrap items-center gap-3 text-gray-500 mt-1 text-sm font-medium">
                                <span>{user?.email}</span>
                                <span className="hidden sm:inline w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                                <span>{user?.phone}</span>
                                <span className={`md:hidden ml-2 px-2 py-0.5 rounded text-[10px] font-bold border ${user?.role === 'admin' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                    {user?.role === 'admin' ? 'ADMIN' : 'MEMBER'}
                                </span>
                            </div>
                        </div>

                        <div className="h-px bg-gray-100 mb-8"></div>

                        {/* Form Profil */}
                        <form onSubmit={handleUpdateProfile} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <Input label="Nama Lengkap" icon={<User size={18} />} value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} disabled={!isEditing || isLoading} className={isEditing ? "bg-white border-blue-200 focus:ring-blue-100" : "bg-gray-50 border-transparent"} />
                                <Input label="Nomor WhatsApp" icon={<Phone size={18} />} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} disabled={!isEditing || isLoading} className={isEditing ? "bg-white border-blue-200 focus:ring-blue-100" : "bg-gray-50 border-transparent"} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <Input label="Email Akun" icon={<Mail size={18} />} value={user?.email || ''} disabled={true} className="bg-gray-50/50 text-gray-400 border-gray-100 cursor-not-allowed" />
                                <Input label="Nomor Induk Anggota (NIAK)" icon={<Shield size={18} />} value={user?.member_id || 'Belum Diterbitkan'} disabled={true} className="bg-gray-50/50 text-gray-400 border-gray-100 cursor-not-allowed font-mono tracking-wider" />
                            </div>
                            {isEditing && (
                                <div className="hidden lg:flex items-center justify-end gap-4 pt-4 border-t border-gray-50 animate-in fade-in">
                                    <Button type="button" variant="ghost" onClick={() => { setIsEditing(false); setFormData({ full_name: user?.full_name || '', phone: user?.phone || '' }); }} disabled={isLoading} className="text-gray-500 hover:text-red-500 hover:bg-red-50">Batal</Button>
                                    <Button type="submit" isLoading={isLoading} className="bg-kkj-blue hover:bg-blue-800 px-8 rounded-xl shadow-lg"> <Save size={18} className="mr-2" /> Simpan Perubahan </Button>
                                </div>
                            )}
                        </form>
                    </div>
                </div>

                {/* 2. KEAMANAN AKUN (PIN) */}
                <div className="bg-white rounded-3xl shadow-lg shadow-gray-100 border border-gray-100 overflow-hidden relative p-6 lg:p-10">
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-kkj-blue">
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Keamanan Akun</h2>
                            <p className="text-sm text-gray-500">Atur PIN 6 digit untuk keamanan transaksi.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Kolom Kiri: Status PIN */}
                        <div>
                            <div className={`p-4 rounded-xl border flex items-start gap-3 ${user?.pin ? 'bg-green-50 border-green-200 text-green-800' : 'bg-orange-50 border-orange-200 text-orange-800'}`}>
                                <div className={`p-2 rounded-full ${user?.pin ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                                    {user?.pin ? <ShieldCheck size={20} /> : <Lock size={20} />}
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">{user?.pin ? 'PIN Transaksi Aktif' : 'PIN Belum Diatur'}</h3>
                                    <p className="text-xs mt-1 opacity-80">
                                        {user?.pin
                                            ? "Akun Anda terlindungi. PIN digunakan untuk verifikasi transfer dan penarikan."
                                            : "Segera atur PIN untuk mengaktifkan fitur transfer dan penarikan saldo."}
                                    </p>
                                </div>
                            </div>

                            {user?.pin && (
                                <button
                                    onClick={handleForgotPin}
                                    className="mt-4 text-sm text-blue-600 font-medium hover:underline flex items-center gap-2"
                                >
                                    <HelpCircle size={16} /> Lupa PIN Saya?
                                </button>
                            )}
                        </div>

                        {/* Kolom Kanan: Form Ganti PIN */}
                        <div className="space-y-4">
                            {/* Jika sudah punya PIN, minta PIN Lama */}
                            {user?.pin && (
                                <div>
                                    <label className="text-sm font-bold text-gray-700 mb-2 block">PIN Lama</label>
                                    <input
                                        type="password"
                                        maxLength={6}
                                        placeholder="******"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-lg font-bold tracking-widest focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                        value={oldPin}
                                        onChange={(e) => setOldPin(e.target.value.replace(/[^0-9]/g, ''))}
                                    />
                                </div>
                            )}

                            <div>
                                <label className="text-sm font-bold text-gray-700 mb-2 block">
                                    {user?.pin ? 'PIN Baru' : 'Buat PIN Baru (6 Angka)'}
                                </label>
                                <input
                                    type="password"
                                    maxLength={6}
                                    placeholder="******"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-lg font-bold tracking-widest focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                                />
                            </div>

                            <Button
                                onClick={handleSavePin}
                                isLoading={pinLoading}
                                disabled={pin.length < 6 || (!!user?.pin && oldPin.length < 6)}
                                className="w-full bg-kkj-blue hover:bg-blue-800 text-white py-3 rounded-xl font-bold shadow-lg disabled:opacity-50"
                            >
                                <KeyRound size={18} className="mr-2" />
                                {user?.pin ? "Ganti PIN" : "Simpan PIN"}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- MOBILE STICKY BOTTOM ACTIONS (Dikecilkan) --- */}
            <div className="lg:hidden mt-6 mb-24 px-4 sticky bottom-24 z-20">
                {!isEditing ? (
                    <Button
                        onClick={() => setIsEditing(true)}
                        className="w-full bg-white border border-kkj-blue text-kkj-blue hover:bg-blue-50 font-bold shadow-lg py-3 rounded-xl"
                    >
                        Edit Profil
                    </Button>
                ) : (
                    <div className="flex gap-3">
                        <Button
                            onClick={() => { setIsEditing(false); setFormData({ full_name: user?.full_name || '', phone: user?.phone || '' }); }}
                            variant="outline"
                            className="flex-1 border-gray-300 text-gray-600 py-3 rounded-xl bg-white"
                            disabled={isLoading}
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={handleUpdateProfile}
                            className="flex-1 bg-kkj-blue text-white py-3 rounded-xl shadow-lg"
                            isLoading={isLoading}
                        >
                            Simpan
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};
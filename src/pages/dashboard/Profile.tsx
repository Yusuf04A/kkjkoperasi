import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { User, Phone, Mail, Shield, Save, ArrowLeft, Camera, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export const Profile = () => {
    const { user, checkSession } = useAuthStore();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null); // Ref untuk input file tersembunyi

    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
    });

    useEffect(() => {
        if (user) {
            setFormData({
                full_name: user.full_name || '',
                phone: user.phone || '',
            });
        }
    }, [user]);

    // Helper Inisial
    const getInitials = (name: string) => {
        return name
            ? name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2)
            : 'US';
    };

    // --- LOGIC UPLOAD GAMBAR ---
    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            const toastId = toast.loading('Mengupload foto...');

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('Pilih gambar terlebih dahulu.');
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            // 1. Upload ke Supabase Storage (Bucket: avatars)
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Dapatkan URL Publik
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // 3. Simpan URL ke Tabel Profiles
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', user?.id);

            if (updateError) throw updateError;

            // 4. Refresh Session & Sukses
            await checkSession();
            toast.success('Foto profil diperbarui!', { id: toastId });

        } catch (error: any) {
            toast.error('Gagal upload: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    // --- LOGIC HAPUS GAMBAR ---
    const handleRemoveImage = async () => {
        const confirm = window.confirm("Hapus foto profil dan kembali ke inisial?");
        if (!confirm) return;

        const toastId = toast.loading('Menghapus foto...');
        try {
            // Update database set avatar_url jadi null
            const { error } = await supabase
                .from('profiles')
                .update({ avatar_url: null })
                .eq('id', user?.id);

            if (error) throw error;

            await checkSession();
            toast.success('Foto profil dihapus.', { id: toastId });
        } catch (error: any) {
            toast.error('Gagal hapus: ' + error.message, { id: toastId });
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const toastId = toast.loading('Menyimpan perubahan...');

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: formData.full_name,
                    phone: formData.phone,
                })
                .eq('id', user?.id);

            if (error) throw error;

            toast.success('Profil berhasil diperbarui!', { id: toastId });
            setIsEditing(false);
            await checkSession();

        } catch (error: any) {
            toast.error('Gagal update: ' + error.message, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* REVISI: Menggunakan max-w-7xl agar lebih LEBAR di desktop */}
            <div className="max-w-7xl mx-auto p-4 lg:p-8 pb-32 lg:pb-12">

                {/* Breadcrumb (Desktop) */}
                <div className="hidden lg:flex items-center gap-2 mb-6 text-gray-500 hover:text-kkj-blue cursor-pointer w-fit transition-colors" onClick={() => navigate('/')}>
                    <ArrowLeft size={18} />
                    <span className="text-sm font-medium">Kembali ke Dashboard</span>
                </div>

                {/* HEADER SECTION (Desktop: Tombol Edit di Kanan Atas) */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Profil Saya</h1>
                        <p className="text-gray-500 mt-1">Kelola informasi akun dan preferensi Anda.</p>
                    </div>

                    {/* Tombol Edit Desktop (Hidden di Mobile) */}
                    {!isEditing && (
                        <div className="hidden lg:block">
                            <Button onClick={() => setIsEditing(true)} variant="outline" className="border-kkj-blue text-kkj-blue hover:bg-blue-50">
                                Edit Profil
                            </Button>
                        </div>
                    )}
                </div>

                {/* KARTU PROFIL UTAMA */}
                <div className="bg-white rounded-3xl shadow-lg shadow-gray-100 border border-gray-100 overflow-hidden relative">

                    {/* Banner Background */}
                    <div className="h-40 bg-gradient-to-r from-kkj-blue to-[#003366] relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
                    </div>

                    <div className="px-6 lg:px-10 pb-10 relative">
                        {/* Avatar Wrapper */}
                        <div className="flex justify-between items-end -mt-16 mb-6">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-full bg-white p-1.5 shadow-xl">
                                    {/* Logic: Tampilkan Gambar jika ada, jika tidak tampilkan Inisial */}
                                    <div className="w-full h-full rounded-full bg-blue-50 flex items-center justify-center text-kkj-blue text-4xl font-bold overflow-hidden border border-gray-100 relative">
                                        {user?.avatar_url ? (
                                            <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <span>{getInitials(user?.full_name || 'User')}</span>
                                        )}

                                        {/* Loading Overlay */}
                                        {uploading && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs">
                                                Loading...
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Tombol Kamera (Upload) & Sampah (Hapus) - Muncul saat Edit Mode */}
                                {isEditing && (
                                    <div className="absolute -bottom-2 -right-2 flex gap-2">
                                        {/* Input File Tersembunyi */}
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleImageUpload}
                                            className="hidden"
                                            accept="image/*"
                                        />

                                        {/* Tombol Upload */}
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="p-2.5 bg-kkj-blue text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors border-2 border-white"
                                            title="Ganti Foto"
                                        >
                                            <Camera size={16} />
                                        </button>

                                        {/* Tombol Hapus (Hanya jika ada foto) */}
                                        {user?.avatar_url && (
                                            <button
                                                type="button"
                                                onClick={handleRemoveImage}
                                                className="p-2.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors border-2 border-white"
                                                title="Hapus Foto"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Badge Status */}
                            <div className="hidden md:block">
                                <span className={`px-4 py-2 rounded-xl text-sm font-bold border ${user?.role === 'admin' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                    {user?.role === 'admin' ? 'ADMINISTRATOR' : 'ANGGOTA AKTIF'}
                                </span>
                            </div>
                        </div>

                        {/* Nama & Email */}
                        <div className="mb-8">
                            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">{user?.full_name}</h2>
                            <div className="flex flex-wrap items-center gap-3 text-gray-500 mt-1 text-sm font-medium">
                                <span>{user?.email}</span>
                                <span className="hidden sm:inline w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                                <span>{user?.phone}</span>
                                {/* Badge Status Mobile */}
                                <span className={`md:hidden ml-2 px-2 py-0.5 rounded text-[10px] font-bold border ${user?.role === 'admin' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                    {user?.role === 'admin' ? 'ADMIN' : 'MEMBER'}
                                </span>
                            </div>
                        </div>

                        <div className="h-px bg-gray-100 mb-8"></div>

                        {/* FORM INPUT */}
                        <form onSubmit={handleUpdateProfile} className="space-y-8">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <Input
                                    label="Nama Lengkap"
                                    icon={<User size={18} />}
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    disabled={!isEditing || isLoading}
                                    className={isEditing ? "bg-white border-blue-200 focus:ring-blue-100" : "bg-gray-50 border-transparent"}
                                />
                                <Input
                                    label="Nomor WhatsApp"
                                    icon={<Phone size={18} />}
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    disabled={!isEditing || isLoading}
                                    className={isEditing ? "bg-white border-blue-200 focus:ring-blue-100" : "bg-gray-50 border-transparent"}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <Input
                                    label="Email Akun"
                                    icon={<Mail size={18} />}
                                    value={user?.email || ''}
                                    disabled={true}
                                    className="bg-gray-50/50 text-gray-400 border-gray-100 cursor-not-allowed"
                                />
                                <Input
                                    label="Nomor Induk Anggota (NIAK)"
                                    icon={<Shield size={18} />}
                                    value={user?.member_id || 'Belum Diterbitkan'}
                                    disabled={true}
                                    className="bg-gray-50/50 text-gray-400 border-gray-100 cursor-not-allowed font-mono tracking-wider"
                                />
                            </div>

                            {/* Tombol Save / Cancel (Desktop) */}
                            {isEditing && (
                                <div className="hidden lg:flex items-center justify-end gap-4 pt-4 border-t border-gray-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => {
                                            setIsEditing(false);
                                            setFormData({ full_name: user?.full_name || '', phone: user?.phone || '' });
                                        }}
                                        disabled={isLoading}
                                        className="text-gray-500 hover:text-red-500 hover:bg-red-50"
                                    >
                                        Batal
                                    </Button>
                                    <Button type="submit" isLoading={isLoading} className="bg-kkj-blue hover:bg-blue-800 px-8 rounded-xl shadow-lg shadow-blue-900/20">
                                        <Save size={18} className="mr-2" /> Simpan Perubahan
                                    </Button>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </div>

            {/* --- MOBILE STICKY BOTTOM ACTIONS --- */}
            {/* Tombol Edit / Simpan di HP Pindah ke Bawah (Fixed) sesuai request */}
            <div className="lg:hidden mt-6 mb-24 px-1">
                {!isEditing ? (
                    <Button
                        onClick={() => setIsEditing(true)}
                        className="w-full bg-white border border-kkj-blue text-kkj-blue hover:bg-blue-50 font-bold shadow-sm py-6 rounded-xl"
                    >
                        Edit Profil
                    </Button>
                ) : (
                    <div className="flex gap-3">
                        <Button
                            onClick={() => {
                                setIsEditing(false);
                                setFormData({ full_name: user?.full_name || '', phone: user?.phone || '' });
                            }}
                            variant="outline"
                            className="flex-1 border-gray-300 text-gray-600 py-6 rounded-xl"
                            disabled={isLoading}
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={handleUpdateProfile}
                            className="flex-1 bg-kkj-blue text-white py-6 rounded-xl shadow-lg shadow-blue-900/20"
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
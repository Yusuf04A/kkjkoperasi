import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase'; // Direct call
import { Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export const Login = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({ email: '', password: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // 1. CEK EMAIL & PASSWORD KE SUPABASE
            const { data, error } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password
            });

            if (error) throw error;

            if (data.user) {
                // 2. AMBIL DATA PROFILE (Role & Status)
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('role, status, full_name')
                    .eq('id', data.user.id)
                    .single();

                if (profileError) throw profileError;

                // === LOGIC PENGECEKAN STATUS ===

                // KASUS A: Status Masih Pending
                if (profile?.status === 'pending') {
                    // Tampilkan pesan
                    toast((t) => (
                        <div className="flex flex-col gap-1">
                            <span className="font-bold">Login Berhasil, Tapi...</span>
                            <span className="text-sm">Akun Kak <b>{profile.full_name}</b> masih menunggu verifikasi Admin. Mohon tunggu atau hubungi Admin via WA.</span>
                            <button onClick={() => toast.dismiss(t.id)} className="bg-gray-200 px-2 py-1 text-xs rounded mt-1">Tutup</button>
                        </div>
                    ), { icon: '⏳', duration: 6000 });

                    // PENTING: Langsung Logout lagi biar gak nyangkut
                    await supabase.auth.signOut();
                    return;
                }

                // KASUS B: Status Ditolak (Rejected)
                if (profile?.status === 'rejected') {
                    toast.error('Maaf, pendaftaran akun Anda ditolak oleh Admin.');
                    await supabase.auth.signOut();
                    return;
                }

                // KASUS C: Status Active (Boleh Masuk)
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
        <AuthLayout title="Selamat Datang Kembali" subtitle="Masuk untuk mengakses layanan">
            <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                    label="Email"
                    type="email"
                    placeholder="Masukkan email terdaftar"
                    icon={<Mail size={18} />}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                />
                <Input
                    label="Password"
                    type="password"
                    placeholder="Masukkan password"
                    icon={<Lock size={18} />}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                />

                <Button type="submit" isLoading={isLoading} className="w-full">
                    MASUK APLIKASI
                </Button>

                <p className="text-center text-sm text-gray-600 mt-8">
                    Belum menjadi anggota? <Link to="/register" className="font-semibold text-kkj-blue">Daftar Sekarang</Link>
                </p>
            </form>
        </AuthLayout>
    );
};
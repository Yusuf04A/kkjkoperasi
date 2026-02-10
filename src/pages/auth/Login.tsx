import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/useAuthStore';
import { Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export const Login = () => {
    const navigate = useNavigate();
    const { login, isLoading, user } = useAuthStore(); // Ambil user juga
    const [formData, setFormData] = useState({ email: '', password: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { error } = await login(formData.email, formData.password);

        if (error) {
            toast.error('Login Gagal: ' + error);
        } else {
            toast.success('Selamat Datang Kembali!');

            // --- LOGIC REDIRECT BARU ---
            // Kita ambil state user terbaru dari store setelah login sukses
            // Catatan: Kadang state butuh waktu update, jadi lebih aman cek role dari response login jika ada,
            // tapi karena login() di store kita void/error, kita bisa cek user via useAuthStore.getState()
            const currentUser = useAuthStore.getState().user;

            if (currentUser?.role === 'admin') {
                navigate('/admin/dashboard'); // Admin ke Dashboard Admin
            } else {
                navigate('/'); // Member ke Home
            }
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
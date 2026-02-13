import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase'; // Pakai direct supabase biar aman
import { User, Phone, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

export const Register = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    // State Form
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: ''
    });

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.email || !formData.phone || !formData.password) {
            toast.error('Mohon lengkapi semua data');
            return;
        }

        setIsLoading(true);

        try {
            // 1. DAFTAR KE SUPABASE AUTH
            const { data, error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    // DATA INI AKAN DITANGKAP OLEH SQL TRIGGER
                    data: {
                        full_name: formData.name,
                        phone_number: formData.phone, // Simpan No HP buat WA Fonnte
                        role: 'member'
                    }
                }
            });

            if (error) throw error;

            if (data.user) {
                toast.success('Pendaftaran Berhasil! Silakan Login.');
                navigate('/login');
            }

        } catch (err: any) {
            console.error(err);
            toast.error(err.message || 'Gagal mendaftar, coba ganti email.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout title="Daftar Anggota Baru" subtitle="Bergabunglah dengan Koperasi KKJ">
            <form onSubmit={handleRegister} className="space-y-4">
                <Input
                    label="Nama Lengkap (Sesuai KTP)"
                    placeholder="Nama Lengkap"
                    icon={<User size={18} />}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                />
                <Input
                    label="Email Aktif"
                    type="email"
                    placeholder="contoh@email.com"
                    icon={<Mail size={18} />}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                />
                <Input
                    label="Nomor WhatsApp"
                    type="tel"
                    placeholder="08123456789"
                    icon={<Phone size={18} />}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                />
                <Input
                    label="Password"
                    type="password"
                    placeholder="Minimal 6 karakter"
                    icon={<Lock size={18} />}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                />

                <Button type="submit" isLoading={isLoading} className="mt-4 w-full">
                    DAFTAR SEKARANG
                </Button>

                <p className="text-center text-sm text-gray-600 mt-4">
                    Sudah punya akun? <Link to="/login" className="font-semibold text-kkj-blue">Masuk</Link>
                </p>
            </form>
        </AuthLayout>
    );
};
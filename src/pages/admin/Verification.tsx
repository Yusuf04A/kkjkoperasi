import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Check, Loader2, RefreshCw, ArrowLeft, LayoutDashboard } from 'lucide-react'; // Tambah icon ArrowLeft, LayoutDashboard
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Link } from 'react-router-dom'; // Import Link

export const AdminVerification = () => {
    // ... (State dan fungsi fetchPendingUsers, handleApprove TETAP SAMA seperti sebelumnya) ...
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPendingUsers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetch:", error);
            toast.error("Gagal mengambil data");
        } else {
            setUsers(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchPendingUsers();
    }, []);

    const handleApprove = async (id: string, currentName: string) => {
        // ... (Isi fungsi ini tetap sama seperti sebelumnya) ...
        const date = new Date();
        const year = date.getFullYear();
        const random = Math.floor(1000 + Math.random() * 9000);
        const newMemberId = `KKJ-${year}-${random}`;
        const toastId = toast.loading('Sedang memproses...');
        try {
            const { error } = await supabase.from('profiles').update({ status: 'active', member_id: newMemberId, role: 'member' }).eq('id', id);
            if (error) throw error;
            toast.success(`Berhasil! ${currentName} kini Anggota Aktif.`, { id: toastId });
            setUsers((prev) => prev.filter(user => user.id !== id));
        } catch (err: any) {
            toast.error(`Gagal verifikasi: ${err.message}`, { id: toastId });
        }
    };


    return (
        <div className="p-6 max-w-7xl mx-auto">

            {/* --- TOMBOL KEMBALI (BARU) --- */}
            <div className="mb-6">
                <Link
                    to="/admin/dashboard"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-kkj-blue transition-colors font-medium group"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span>Kembali ke Dashboard</span>
                </Link>
            </div>

            {/* Header Halaman */}
            <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg text-kkj-blue">
                        <LayoutDashboard size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Verifikasi Anggota Baru</h1>
                        <p className="text-sm text-gray-500">Setujui pendaftaran anggota yang masuk</p>
                    </div>
                </div>
                <button onClick={fetchPendingUsers} className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-kkj-blue hover:text-white transition-all border border-gray-200" title="Refresh Data">
                    <RefreshCw size={20} />
                </button>
            </div>

            {/* Tabel (Tetap Sama) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama Lengkap</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email / Kontak</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal Daftar</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={4} className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-kkj-blue" size={32} /></td></tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="p-12 text-center flex flex-col items-center justify-center text-gray-500 gap-2">
                                    <Check size={40} className="text-green-500 bg-green-50 p-2 rounded-full" />
                                    <p className="font-medium">Tidak ada pendaftaran baru yang menunggu.</p>
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.id} className="hover:bg-blue-50/50 transition-colors">
                                    <td className="p-4">
                                        <span className="font-bold text-gray-900">{user.full_name || 'Tanpa Nama'}</span>
                                    </td>
                                    <td className="p-4 text-sm text-gray-600">
                                        <div className="font-medium text-gray-900">{user.email}</div>
                                        <div className="flex items-center gap-1 mt-0.5 text-xs">
                                            <span className="text-gray-400">Telp:</span> {user.phone}
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm text-gray-600">
                                        <span className="bg-gray-100 px-2 py-1 rounded-md text-xs font-medium">
                                            {format(new Date(user.created_at), 'dd MMM yyyy, HH:mm')}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex gap-2 justify-end">
                                            <button
                                                onClick={() => handleApprove(user.id, user.full_name)}
                                                className="flex items-center gap-2 px-4 py-2 bg-kkj-blue text-white rounded-lg hover:bg-blue-800 transition-colors shadow-sm text-sm font-bold"
                                                title="Setujui Anggota"
                                            >
                                                <Check size={18} /> Verifikasi Sekarang
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { Bell, ArrowLeft, CheckCircle, MailOpen, CheckSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { id as indonesia } from 'date-fns/locale';
import toast from 'react-hot-toast';

export const Notifications = () => {
    const { user, fetchUnreadCount } = useAuthStore();
    const navigate = useNavigate();
    const [notifs, setNotifs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) fetchNotifs();
    }, [user]);

    const fetchNotifs = async () => {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user?.id)
            .order('created_at', { ascending: false });

        if (!error) setNotifs(data || []);
        setLoading(false);

        // Sinkronkan badge navbar saat halaman dibuka
        fetchUnreadCount();
    };

    const markRead = async (id: string) => {
        // Optimistic Update (Ubah tampilan dulu biar cepat)
        setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));

        // Update Database
        const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);

        if (!error) {
            // Update Lonceng di Navbar
            fetchUnreadCount();
        }
    };

    // FITUR BARU: Tandai Semua Dibaca
    const markAllRead = async () => {
        const unreadIds = notifs.filter(n => !n.is_read).map(n => n.id);
        if (unreadIds.length === 0) return;

        // Optimistic Update UI
        setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .in('id', unreadIds); // Update banyak sekaligus

        if (error) {
            toast.error("Gagal update status");
        } else {
            toast.success("Semua ditandai sudah dibaca");
            fetchUnreadCount(); // Matikan lampu merah di navbar
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30 px-4 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-gray-700" />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900">Kotak Masuk</h1>
                </div>

                {/* Tombol Baca Semua */}
                {notifs.some(n => !n.is_read) && (
                    <button
                        onClick={markAllRead}
                        className="text-xs font-bold text-kkj-blue hover:bg-blue-50 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                    >
                        <CheckSquare size={14} /> Baca Semua
                    </button>
                )}
            </div>

            <div className="max-w-2xl mx-auto p-4 space-y-3">
                {loading ? (
                    <div className="text-center py-20 text-gray-400">Memuat notifikasi...</div>
                ) : notifs.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <MailOpen size={32} className="text-gray-300" />
                        </div>
                        <p>Belum ada notifikasi baru.</p>
                    </div>
                ) : (
                    notifs.map((n) => (
                        <div
                            key={n.id}
                            onClick={() => !n.is_read && markRead(n.id)}
                            className={`relative p-5 rounded-2xl border transition-all duration-200 cursor-pointer group ${n.is_read
                                    ? 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
                                    : 'bg-white border-blue-200 shadow-sm shadow-blue-50/50 hover:shadow-md hover:border-blue-300'
                                }`}
                        >
                            <div className="flex justify-between items-start gap-3">
                                <div className="flex gap-4">
                                    {/* Indikator Status */}
                                    <div className="mt-1 shrink-0">
                                        {n.is_read ? (
                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                                                <MailOpen size={14} />
                                            </div>
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 relative">
                                                <Bell size={14} />
                                                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <h3 className={`font-bold text-[15px] mb-1 ${!n.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                                            {n.title}
                                        </h3>
                                        <p className={`text-sm leading-relaxed ${!n.is_read ? 'text-gray-700' : 'text-gray-400'}`}>
                                            {n.message}
                                        </p>
                                        <p className="text-[10px] text-gray-400 mt-2 font-medium">
                                            {format(new Date(n.created_at), 'dd MMMM yyyy, HH:mm', { locale: indonesia })}
                                        </p>
                                    </div>
                                </div>

                                {/* Centang Hijau (Hanya muncul kalau sudah dibaca) */}
                                {n.is_read && (
                                    <CheckCircle size={16} className="text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
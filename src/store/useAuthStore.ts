import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface UserProfile {
    id: string;
    email?: string;
    full_name?: string;
    member_id?: string;
    role?: string;
    status?: string;
    phone?: string;
    tapro_balance?: number; // Tambahan biar TypeScipt ga marah soal saldo
    tamasa_balance?: number;
    inflip_balance?: number;
    simpok_balance?: number;
    simwa_balance?: number;
    simade_balance?: number;
    sipena_balance?: number;
    siwalima_balance?: number;
    siuji_balance?: number;
    siqurma_balance?: number;
    sihara_balance?: number;
    avatar_url?: string;
    pin?: string;
    created_at?: string;
}

interface AuthState {
    user: UserProfile | null;
    isLoading: boolean;
    unreadCount: number; // 🔥 BARU: Simpan jumlah notif

    login: (email: string, password: string) => Promise<{ error?: string }>;
    register: (email: string, password: string, fullName: string, phone: string) => Promise<{ error?: string }>;
    logout: () => Promise<void>;
    checkSession: () => Promise<void>;
    fetchUnreadCount: () => Promise<void>; // 🔥 BARU: Fungsi hitung notif
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    isLoading: true,
    unreadCount: 0, // Default 0

    // Cek session saat aplikasi dibuka
    checkSession: async () => {
        set({ isLoading: true });
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
            // Ambil detail profil tambahan dari tabel 'profiles'
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            set({ user: { ...session.user, ...profile }, isLoading: false });

            // 🔥 BARU: Cek notifikasi setelah session ketemu
            get().fetchUnreadCount();
        } else {
            // Cek localStorage jika user login menggunakan OTP Fonnte
            const localOtpSession = localStorage.getItem('kkj_otp_session');
            if (localOtpSession) {
                try {
                    const parsedProfile = JSON.parse(localOtpSession);
                    // Re-fetch fresh data dari Supabase agar perubahan (avatar, nama, dll) selalu ter-update
                    const { data: freshProfile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', parsedProfile.id)
                        .single();

                    if (freshProfile) {
                        // Update localStorage dengan data terbaru
                        localStorage.setItem('kkj_otp_session', JSON.stringify(freshProfile));
                        set({ user: freshProfile, isLoading: false });
                    } else {
                        set({ user: parsedProfile, isLoading: false });
                    }
                    get().fetchUnreadCount();
                } catch (e) {
                    set({ user: null, isLoading: false });
                }
            } else {
                set({ user: null, isLoading: false });
            }
        }
    },

    login: async (email, password) => {
        set({ isLoading: true });
        // INI YANG BENAR: Pakai signInWithPassword
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            set({ isLoading: false });
            return { error: error.message };
        }

        // Fetch profile setelah login sukses
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

        set({ user: { ...data.user, ...profile }, isLoading: false });

        // 🔥 BARU: Cek notifikasi setelah login
        get().fetchUnreadCount();

        return {};
    },

    register: async (email, password, fullName, phone) => {
        set({ isLoading: true });
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    phone: phone,
                }
            }
        });

        set({ isLoading: false });
        if (error) return { error: error.message };
        return {};
    },

    logout: async () => {
        await supabase.auth.signOut();
        localStorage.removeItem('kkj_otp_session'); // Hapus log sesi local jika pakai OTP
        set({ user: null, unreadCount: 0 }); // Reset notif jadi 0
    },

    // 🔥 FUNGSI BARU: HITUNG NOTIFIKASI BELUM DIBACA
    fetchUnreadCount: async () => {
        const { user } = get();
        if (!user) return;

        const { count } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_read', false); // Hitung yang belum dibaca saja

        set({ unreadCount: count || 0 });
    }
}));
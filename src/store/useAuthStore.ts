import { create } from 'zustand';
import API from '../api/api'; // Menggunakan jembatan API Laravel Anda

interface UserProfile {
    id: string;
    email?: string;
    name?: string; // Laravel default menggunakan 'name' bukan 'full_name'
    member_id?: string;
    role?: string;
    status?: string;
    phone?: string;
    tapro_balance?: number;
    avatar_url?: string;
    // Tambahkan kolom saldo lainnya sesuai kebutuhan UI Home Anda
    simpok_balance?: number;
    simwa_balance?: number;
}

interface AuthState {
    user: UserProfile | null;
    isLoading: boolean;
    unreadCount: number;

    setAuth: (user: UserProfile, token: string) => void; // Untuk sinkronisasi dari Login.tsx
    logout: () => void;
    checkSession: () => Promise<void>;
    fetchUnreadCount: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    isLoading: true,
    unreadCount: 0,

    // Sinkronisasi data user dan token ke storage
    setAuth: (user, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, isLoading: false });
        get().fetchUnreadCount();
    },

    // Cek session saat aplikasi dibuka (Ganti GetSession Supabase)
    checkSession: async () => {
        set({ isLoading: true });
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (token && savedUser) {
            try {
                // Opsional: Validasi token ke Laravel atau ambil data user terbaru
                const response = await API.get('/user-profile'); 
                const freshUser = response.data;
                
                set({ user: freshUser, isLoading: false });
                get().fetchUnreadCount();
            } catch (error) {
                // Jika token expired
                get().logout();
            }
        } else {
            set({ user: null, isLoading: false });
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, unreadCount: 0, isLoading: false });
    },

    // 🔥 HITUNG NOTIFIKASI DARI MYSQL (Via Laravel)
    fetchUnreadCount: async () => {
        const { user } = get();
        if (!user) return;

        try {
            const response = await API.get('/notifications/unread-count');
            set({ unreadCount: response.data.count || 0 });
        } catch (error) {
            console.error("Gagal mengambil jumlah notifikasi", error);
        }
    }
}));
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
}

interface AuthState {
    user: UserProfile | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ error?: string }>;
    register: (email: string, password: string, fullName: string, phone: string) => Promise<{ error?: string }>;
    logout: () => Promise<void>;
    checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoading: true,

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
        } else {
            set({ user: null, isLoading: false });
        }
    },

    login: async (email, password) => {
        set({ isLoading: true });
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
        return {};
    },

    register: async (email, password, fullName, phone) => {
        set({ isLoading: true });
        // Register ke Supabase Auth
        // Data fullName & phone dikirim ke metadata agar ditangkap Trigger SQL
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
        set({ user: null });
    },
}));
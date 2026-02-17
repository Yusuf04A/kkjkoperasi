/**
 * Kontrak data untuk aplikasi Koperasi KKJ.
 * Interface ini disinkronkan dengan tabel MySQL di phpMyAdmin.
 */

// 1. Interface untuk Data User (Tabel: users)
export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string | null;
    created_at?: string;
    updated_at?: string;
}

// 2. Interface untuk Transaksi Gadai (Tabel: pawn_transactions)
export interface PawnTransaction {
    id?: number;
    user_id: number;
    item_name: string;
    loan_amount: number;
    status: 'pending' | 'approved' | 'rejected';
    created_at?: string;
    updated_at?: string;
}

// 3. Interface untuk Transaksi Saldo (Tabel: balance_transactions)
export interface BalanceTransaction {
    id?: number;
    user_id: number;
    type: 'topup' | 'withdraw' | 'transfer';
    amount: number;
    status: 'success' | 'pending' | 'failed';
    created_at?: string;
    updated_at?: string;
}

// 4. Interface untuk Respon Login/Register dari Laravel Sanctum
export interface AuthResponse {
    user: User;
    token: string;
}

// 5. Interface untuk Error API (Menangani pesan error dari Laravel)
export interface ApiError {
    message: string;
    errors?: Record<string, string[]>;
}
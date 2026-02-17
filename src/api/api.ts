import axios from 'axios';
import { PawnTransaction, BalanceTransaction } from '../types';

const API = axios.create({
    baseURL: 'http://127.0.0.1:8000/api',
    headers: {
        'Content-Type': 'application/json',
    }
});

/**
 * Otomatis memasukkan Token ke setiap permintaan.
 * Ini penting agar Laravel mengenali siapa yang sedang login.
 */
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// --- DAFTAR FUNGSI API ---

// Menyimpan pengajuan gadai baru ke MySQL
export const ajukanGadai = (data: Partial<PawnTransaction>) => 
    API.post<{message: string, data: PawnTransaction}>('/pawn', data);

// Mengambil riwayat gadai dari database
export const getRiwayatGadai = () => 
    API.get<PawnTransaction[]>('/pawn');

// Mengirim transaksi saldo (Top Up / Withdraw)
export const updateSaldo = (data: Partial<BalanceTransaction>) => 
    API.post<{message: string, data: BalanceTransaction}>('/balance', data);

export default API;
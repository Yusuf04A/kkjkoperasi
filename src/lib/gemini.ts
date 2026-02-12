import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) console.error("⛔ FATAL: API Key Gemini hilang!");

const genAI = new GoogleGenerativeAI(API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

// Helper Format Rupiah
const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(angka);
};

// Helper Format Gram Emas
const formatGram = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 4 }).format(angka);
};

// SYSTEM PROMPT
const BASE_SYSTEM_PROMPT = `
Kamu adalah SILA, CS Virtual Koperasi KKJ yang Ramah dan Pintar.
Tugasmu: Menjawab pertanyaan anggota tentang saldo, tagihan, dan layanan koperasi.

DATABASE PRODUK:
1. TAMASA (Tabungan Emas): Saldo dalam gram. Bisa dicairkan fisik/uangkan.
2. INFLIP (Investasi Properti): Aset investasi jangka panjang.
3. PINJAMAN: Margin 1.5% flat.
4. JAM KERJA: Senin-Jumat 08:00 - 16:00 WIB.

ATURAN:
- Jika angka nol, katakan "belum ada saldo".
- Gunakan format bold (**teks**) untuk angka penting.
`;

export const askSila = async (message: string, history: any[], contextData: any) => {
    try {
        const { profile, loans, transactions, tamasa, inflipTotal } = contextData;

        // 1. DATA PINJAMAN
        let loanText = "Tidak ada pinjaman aktif.";
        if (loans && loans.length > 0) {
            loanText = loans.map((l: any, i: number) =>
                `${i + 1}. Pinjaman sisa tagihan **${formatRupiah(l.remaining_amount)}** (Jatuh Tempo: ${l.next_due_date}).`
            ).join("\n");
        }

        // 2. DATA TRANSAKSI
        let trxText = "Belum ada transaksi.";
        if (transactions && transactions.length > 0) {
            trxText = transactions.map((t: any) =>
                `- ${t.type.toUpperCase()}: ${formatRupiah(t.amount)} (${t.status})`
            ).join("\n");
        }

        // 3. KONTEKS DATA PRIBADI (DARI BERBAGAI TABEL)
        const USER_CONTEXT = `
        DATA RAHASIA ANGGOTA (HANYA UNTUKMU):
        - Nama: ${profile?.full_name}
        
        DOMPET & ASET:
        - Saldo Tapro (Utama): **${formatRupiah(profile?.tapro_balance || 0)}**
        - Saldo Simpanan Wajib: ${formatRupiah(profile?.simwa_balance || 0)}
        - Saldo Simpanan Pokok: ${formatRupiah(profile?.simpok_balance || 0)}
        
        INVESTASI KHUSUS (DARI TABEL TERPISAH):
        - Saldo Emas (TAMASA): **${formatGram(tamasa?.total_gram || 0)} gram**
        - Aset Properti (INFLIP): **${formatRupiah(inflipTotal || 0)}**

        TAGIHAN AKTIF:
        ${loanText}

        RIWAYAT TERAKHIR:
        ${trxText}
        `;

        const chat = model.startChat({
            history: [
                { role: "user", parts: [{ text: BASE_SYSTEM_PROMPT + "\n\n" + USER_CONTEXT }] },
                { role: "model", parts: [{ text: `Halo Kak ${profile?.full_name}, SILA siap bantu cek saldo Tamasa, Inflip, atau Tagihan!` }] },
                ...history.map(msg => ({ role: msg.role, parts: [{ text: msg.parts }] }))
            ],
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        return response.text();

    } catch (error) {
        console.error("Gemini Error:", error);
        return "Maaf Kak, SILA lagi gangguan koneksi. Coba lagi ya! 🙏";
    }
};
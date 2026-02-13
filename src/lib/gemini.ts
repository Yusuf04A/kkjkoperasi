import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) console.error("⛔ FATAL: API Key Gemini hilang!");

const genAI = new GoogleGenerativeAI(API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

// === HELPER FORMATTER ===
const formatRupiah = (angka: any) => {
    const value = Number(angka);
    if (isNaN(value) || value === 0) return "Rp 0";
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
};

const formatGram = (angka: any) => {
    const value = Number(angka);
    if (isNaN(value)) return "0";
    return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 4 }).format(value);
};

// HARGA EMAS (Simulasi)
const HARGA_EMAS_PER_GRAM = 2947000;

// === SYSTEM PROMPT: ENSIKLOPEDIA KOPERASI KKJ ===
// Data diambil dari Dokumen Draf Aplikasi Koperasi KKJ
const BASE_SYSTEM_PROMPT = `
Kamu adalah SILA (System Informasi Layanan Anggota), CS Virtual Koperasi KKJ yang Cerdas, Ramah, dan Solutif.

--- DATABASE PENGETAHUAN PRODUK (HAFALKAN INI) ---

A. 9 JENIS SIMPANAN YANG TERSEDIA:
1. Simpanan Pokok (Simpok)
2. Simpanan Wajib (Simwa)
3. Simpanan Masa Depan (Simade)
4. Tabungan Progresif (TaPro) -> Saldo utama untuk transaksi digital & PPOB.
5. Simpanan Pendidikan (Sipena)
6. Simpanan Walimah (Siwalim)
7. Simpanan Umroh & Haji (Simuha)
8. Simpanan Kurban (Sikurma)
9. Simpanan Hari Raya (Sahara)

B. 4 JENIS PEMBIAYAAN & MARGIN:
1. Kredit Barang (Margin: Setara 10% per tahun)
2. Modal Usaha (Margin: Setara 10% per tahun)
3. Biaya Pelatihan (Margin: 0.6% per bulan)
4. Biaya Pendidikan (Margin: 0.6% per bulan)

C. PROGRAM UNGGULAN:
- TAMASA (Tabungan Emas Anggota): Menabung emas mulai Rp 10.000, bisa dicetak fisik.
- INFLIP (Investasi Flipping Property): Investasi properti jangka panjang.
- Pegadaian Emas Syariah.

D. LAYANAN LAIN:
- PPOB (Pulsa, Listrik, PDAM).
- Belanja di Toko Koperasi.
- Pembagian SHU (Sisa Hasil Usaha).

--- ATURAN LOGIKA MENJAWAB ---
1. **BEDA PERTANYAAN = BEDA SUMBER DATA**:
   - Jika user tanya "Ada simpanan apa aja?", JAWABLAH DARI POIN A (9 Jenis). Jangan sebutkan saldo user.
   - Jika user tanya "Simpanan SAYA apa aja?", BARU cek data pribadi user (Context Data).

2. **LOGIKA HUTANG/PINJAMAN**:
   - Sisa Hutang = JUMLAHKAN semua angsuran (installments) yang statusnya BELUM LUNAS (unpaid/pending/overdue).
   - Jangan gunakan data Plafon Awal sebagai sisa hutang.

3. **FORMAT**:
   - Gunakan **bold** untuk angka uang dan nama produk penting.
   - Bersikaplah sopan dan membantu.
`;

export const askSila = async (message: string, history: any[], contextData: any) => {
    try {
        const { profile, loans, installments, transactions, tamasa, inflipTotal } = contextData;

        // --- 1. LOGIKA HITUNG SISA HUTANG (MATEMATIKA) ---
        let loanText = "Tidak ada pinjaman aktif. Keuangan Kakak sehat!";

        if (loans && loans.length > 0) {
            loanText = loans.map((l: any) => {
                // Cari angsuran milik pinjaman ini yang BELUM LUNAS (bukan 'paid')
                const tagihanBelumLunas = installments.filter((bill: any) =>
                    bill.loan_id === l.id && bill.status !== 'paid'
                );

                // Hitung Total Sisa Uang
                const totalSisaHitungan = tagihanBelumLunas.reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);

                // Cari Jatuh Tempo Terdekat
                const nextDue = tagihanBelumLunas.length > 0 ? tagihanBelumLunas[0].due_date : null;
                const nextDueDateStr = nextDue
                    ? new Date(nextDue).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                    : "Lunas";

                // Fallback jika tidak ada data installment
                const finalSisa = totalSisaHitungan > 0 ? totalSisaHitungan : Number(l.remaining_amount ?? l.amount ?? 0);

                return `- **${l.type || 'Pinjaman'}**:
                   • Sisa Kewajiban: **${formatRupiah(finalSisa)}**
                   • Jatuh Tempo Terdekat: **${nextDueDateStr}**`;
            }).join("\n\n");
        }

        // --- 2. DATA ASET ---
        const saldoEmas = Number(tamasa?.total_gram || 0);
        const valuasiEmas = saldoEmas * HARGA_EMAS_PER_GRAM;
        const totalInflip = Number(inflipTotal || 0);

        // --- 3. DATA TRANSAKSI ---
        let trxText = "Belum ada riwayat transaksi.";
        if (transactions && transactions.length > 0) {
            trxText = transactions.map((t: any) =>
                `- ${t.type.toUpperCase()} ${formatRupiah(t.amount)} (${t.status})`
            ).join("\n");
        }

        // --- 4. INJEKSI DATA USER KE PROMPT ---
        const USER_CONTEXT = `
        [DATA PRIBADI USER SAAT INI]
        Nama: ${profile?.full_name}
        
        [DOMPET & SIMPANAN USER]
        - Saldo TaPro (Utama): **${formatRupiah(profile?.tapro_balance)}**
        - Simpanan Wajib: **${formatRupiah(profile?.simwa_balance)}**
        - Simpanan Pokok: **${formatRupiah(profile?.simpok_balance)}**
        
        [INVESTASI USER]
        - Emas (TAMASA): **${formatGram(saldoEmas)} gr** (Setara Rp ${formatRupiah(valuasiEmas)})
        - Properti (INFLIP): **${formatRupiah(totalInflip)}**

        [STATUS PINJAMAN USER (REAL-TIME)]
        ${loanText}

        [RIWAYAT TRANSAKSI TERAKHIR]
        ${trxText}
        `;

        // --- 5. EKSEKUSI CHAT ---
        const chat = model.startChat({
            history: [
                { role: "user", parts: [{ text: BASE_SYSTEM_PROMPT + "\n\n" + USER_CONTEXT }] },
                { role: "model", parts: [{ text: `Halo Kak ${profile?.full_name}! SILA siap membantu dengan data lengkap dan akurat.` }] },
                ...history.map(msg => ({ role: msg.role, parts: [{ text: msg.parts }] }))
            ],
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        return response.text();

    } catch (error) {
        console.error("Gemini Error:", error);
        return "Maaf Kak, SILA lagi gangguan koneksi. Mohon tanya ulang ya! 🙏";
    }
};
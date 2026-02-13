// src/lib/fonnte.ts

export const sendWhatsApp = async (target: string, message: string) => {
    // Ambil token dari env
    const token = import.meta.env.VITE_FONNTE_TOKEN;

    if (!token) {
        console.error("❌ TOKEN FONNTE HILANG! Cek file .env kamu.");
        return false;
    }

    try {
        const formData = new FormData();
        formData.append('target', target);
        formData.append('message', message);
        formData.append('countryCode', '62');

        const response = await fetch('https://api.fonnte.com/send', {
            method: 'POST',
            headers: {
                'Authorization': token,
            },
            body: formData,
        });

        const result = await response.json();
        console.log("🔍 Respon Fonnte:", result);

        // PERBAIKAN: Cek status dari API Fonnte
        if (result.status === false) {
            console.error("❌ Gagal Kirim (API Error):", result.reason);
            return false; // Kembalikan false biar UI tau kalau gagal
        }

        return true; // Sukses beneran

    } catch (error) {
        console.error("❌ Gagal Kirim (Network Error):", error);
        return false;
    }
};
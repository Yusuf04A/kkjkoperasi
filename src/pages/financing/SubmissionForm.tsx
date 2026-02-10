import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { formatRupiah } from '../../lib/utils';
import { ArrowLeft, Calculator, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const SubmissionForm = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const type = searchParams.get('type') || 'barang';

    // State Form Dinamis
    const [formData, setFormData] = useState({
        itemName: '',           // Kredit Barang: Nama Barang
        price: '',              // Kredit Barang: Harga / Modal: Besar Modal / Pendidikan: Biaya
        dp: '',                 // Kredit Barang: DP
        tenor: '12',            // Default 12 bulan
        businessName: '',       // Modal Usaha
        income: '',             // Modal Usaha: Omset
        profit: '',             // Modal Usaha: Keuntungan
        institution: '',        // Pendidikan: Nama Sekolah/Lembaga
        beneficiary: '',        // Pendidikan: Nama Anak
        usage: '',              // Modal/Pendidikan: Peruntukan
    });

    const [calculation, setCalculation] = useState({
        principal: 0,
        margin: 0,
        total: 0,
        monthly: 0
    });

    // LOGIC KALKULATOR UTAMA [cite: 63, 64]
    useEffect(() => {
        const price = parseFloat(formData.price) || 0;
        const dp = parseFloat(formData.dp) || 0;
        const tenor = parseInt(formData.tenor) || 12;

        let principal = 0;
        let margin = 0;

        if (type === 'barang') {
            // Skema Barang: (Harga - DP) * 10% per tahun [cite: 63, 129]
            principal = price - dp;
            const marginRatePerYear = 0.10; // 10%
            // Rumus: Pokok * Rate * (Tenor/12)
            margin = principal * marginRatePerYear * (tenor / 12);

        } else if (type === 'modal') {
            // Skema Modal: (Jumlah Modal) * 10% per tahun [cite: 63, 140]
            principal = price; // Tidak ada DP
            const marginRatePerYear = 0.10;
            margin = principal * marginRatePerYear * (tenor / 12);

        } else {
            // Skema Pelatihan & Pendidikan: 0.6% per BULAN [cite: 64, 146, 153]
            principal = price;
            const marginRatePerMonth = 0.006; // 0.6%
            // Rumus: Pokok * Rate * Tenor
            margin = principal * marginRatePerMonth * tenor;
        }

        const total = principal + margin;
        const monthly = tenor > 0 ? total / tenor : 0;

        setCalculation({ principal, margin, total, monthly });
    }, [formData, type]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast.success('Pengajuan berhasil dikirim! Menunggu persetujuan.');
        navigate('/pembiayaan');
    };

    // Helper untuk update state
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Title berdasarkan Tipe [cite: 53]
    const titles: Record<string, string> = {
        barang: 'Pengajuan Kredit Barang',
        modal: 'Pengajuan Modal Usaha',
        pelatihan: 'Pengajuan Biaya Pelatihan',
        pendidikan: 'Pengajuan Biaya Pendidikan'
    };

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <Button variant="ghost" onClick={() => navigate('/pembiayaan')} className="mb-4 w-fit px-0">
                <ArrowLeft size={18} className="mr-2" /> Kembali
            </Button>

            <h1 className="text-2xl font-bold text-gray-900 mb-6">{titles[type]}</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* KOLOM KIRI: FORM INPUT [cite: 123-153] */}
                <div className="lg:col-span-2 space-y-6">
                    <form id="loanForm" onSubmit={handleSubmit} className="space-y-4">

                        {/* Field Khusus Kredit Barang */}
                        {type === 'barang' && (
                            <>
                                <Input name="itemName" label="Nama Barang" placeholder="Contoh: Laptop Asus ROG" onChange={handleChange} required />
                                <Input name="price" type="number" label="Estimasi Harga Barang" placeholder="0" onChange={handleChange} required />
                                <Input name="dp" type="number" label="Uang Muka (DP)" placeholder="0" onChange={handleChange} required />
                            </>
                        )}

                        {/* Field Khusus Modal Usaha */}
                        {type === 'modal' && (
                            <>
                                <Input name="businessName" label="Nama Usaha" placeholder="Contoh: Kedai Kopi" onChange={handleChange} required />
                                <Input name="price" type="number" label="Besar Modal yang Diajukan" placeholder="0" onChange={handleChange} required />
                                <Input name="usage" label="Peruntukan Modal" placeholder="Contoh: Beli alat giling kopi" onChange={handleChange} required />
                                <div className="grid grid-cols-2 gap-4">
                                    <Input name="income" type="number" label="Omset Harian (Rata-rata)" placeholder="0" onChange={handleChange} />
                                    <Input name="profit" type="number" label="Keuntungan Bersih Bulanan" placeholder="0" onChange={handleChange} />
                                </div>
                            </>
                        )}

                        {/* Field Khusus Pendidikan/Pelatihan */}
                        {(type === 'pendidikan' || type === 'pelatihan') && (
                            <>
                                <Input name="institution" label={type === 'pendidikan' ? 'Nama Sekolah/Kampus' : 'Lembaga Pelatihan'} onChange={handleChange} required />
                                {type === 'pendidikan' && <Input name="beneficiary" label="Nama Anak / Siswa" onChange={handleChange} required />}
                                <Input name="price" type="number" label="Biaya yang Dibutuhkan" placeholder="0" onChange={handleChange} required />
                            </>
                        )}

                        {/* Field Umum: Tenor */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-600 ml-1">Jangka Waktu (Bulan)</label>
                            <select
                                name="tenor"
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-kkj-blue outline-none"
                                value={formData.tenor}
                                onChange={handleChange}
                            >
                                <option value="6">6 Bulan</option>
                                <option value="12">12 Bulan</option>
                                <option value="18">18 Bulan</option>
                                <option value="24">24 Bulan</option>
                                <option value="36">36 Bulan</option>
                            </select>
                        </div>

                        <div className="pt-4 lg:hidden">
                            {/* Tombol submit mobile ditaruh di bawah summary nanti */}
                        </div>
                    </form>
                </div>

                {/* KOLOM KANAN: SIMULASI / KALKULATOR (Sticky di Desktop) */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 sticky top-6">
                        <div className="flex items-center gap-2 mb-4 text-kkj-blue">
                            <Calculator size={24} />
                            <h3 className="font-bold text-lg">Simulasi Angsuran</h3>
                        </div>

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between text-gray-500">
                                <span>Pokok Pembiayaan</span>
                                <span>{formatRupiah(calculation.principal)}</span>
                            </div>
                            <div className="flex justify-between text-gray-500">
                                <span>
                                    Margin/Jasa
                                    <span className="text-[10px] bg-blue-50 text-blue-600 px-1 ml-1 rounded">
                                        {type === 'barang' || type === 'modal' ? '10%/thn' : '0.6%/bln'}
                                    </span>
                                </span>
                                <span>{formatRupiah(calculation.margin)}</span>
                            </div>
                            <div className="h-px bg-gray-200 my-2"></div>
                            <div className="flex justify-between font-bold text-gray-900">
                                <span>Total Pembiayaan</span>
                                <span>{formatRupiah(calculation.total)}</span>
                            </div>
                        </div>

                        <div className="mt-6 bg-blue-50 p-4 rounded-xl border border-blue-100 text-center">
                            <p className="text-xs text-blue-600 font-medium mb-1">Angsuran per Bulan</p>
                            <p className="text-2xl font-bold text-kkj-blue">{formatRupiah(calculation.monthly)}</p>
                        </div>

                        <div className="mt-6">
                            <Button form="loanForm" type="submit" className="w-full font-bold py-4">
                                AJUKAN SEKARANG
                            </Button>
                            <p className="text-[10px] text-center text-gray-400 mt-2 flex items-center justify-center gap-1">
                                <AlertCircle size={10} /> Syarat & Ketentuan Berlaku
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
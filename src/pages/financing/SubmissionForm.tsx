import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, Calculator, ShoppingBag, Briefcase, BookOpen, GraduationCap, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatRupiah } from '../../lib/utils';

export const SubmissionForm = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);

    // Tipe Pembiayaan
    const [type, setType] = useState('Kredit Barang');

    // State Dinamis (Menampung semua inputan)
    const [formData, setFormData] = useState({
        // Kredit Barang
        namaBarang: '',
        estimasiHarga: '',
        dp: '',

        // Modal Usaha
        jenisUsaha: '',
        namaUsaha: '',
        lamaUsaha: '',
        omsetHarian: '',
        keuntunganBersih: '',
        besarModal: '', // Ini nanti jadi amount
        peruntukan: '',

        // Pelatihan
        jenisPelatihan: '',
        namaPelatihan: '',
        biayaPelatihan: '', // Ini nanti jadi amount

        // Pendidikan
        namaAnak: '',
        namaSekolah: '',
        biayaPendidikan: '', // Ini nanti jadi amount

        // Global
        tenor: '12' // Default 12 bulan
    });

    // Hasil Perhitungan
    const [simulation, setSimulation] = useState({
        pokok: 0,
        margin: 0,
        angsuran: 0
    });

    // --- LOGIC PERHITUNGAN BUNGA ---
    useEffect(() => {
        let pokok = 0;
        let ratePerBulan = 0;
        const tenor = parseInt(formData.tenor) || 0;

        // 1. Tentukan Pokok Pinjaman
        if (type === 'Kredit Barang') {
            const harga = parseInt(formData.estimasiHarga.replace(/\D/g, '')) || 0;
            const dp = parseInt(formData.dp.replace(/\D/g, '')) || 0;
            pokok = harga - dp;
        } else if (type === 'Modal Usaha') {
            pokok = parseInt(formData.besarModal.replace(/\D/g, '')) || 0;
        } else if (type === 'Biaya Pelatihan') {
            pokok = parseInt(formData.biayaPelatihan.replace(/\D/g, '')) || 0;
        } else if (type === 'Biaya Pendidikan') {
            pokok = parseInt(formData.biayaPendidikan.replace(/\D/g, '')) || 0;
        }

        // 2. Tentukan Rumus Bunga
        if (type === 'Kredit Barang' || type === 'Modal Usaha') {
            // Faedah 10% Per TAHUN
            // Rumus: (Pokok * 10% * (Tenor/12))
            ratePerBulan = (0.10 / 12);
        } else {
            // Faedah 0.6% Per BULAN
            ratePerBulan = 0.006;
        }

        // 3. Hitung Angsuran
        if (pokok > 0 && tenor > 0) {
            const totalJasa = pokok * ratePerBulan * tenor;
            const totalBayar = pokok + totalJasa;
            const angsuranPerBulan = totalBayar / tenor;

            setSimulation({
                pokok: pokok,
                margin: totalJasa,
                angsuran: Math.ceil(angsuranPerBulan)
            });
        } else {
            setSimulation({ pokok: 0, margin: 0, angsuran: 0 });
        }

    }, [formData, type]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (simulation.pokok < 100000) {
            toast.error('Nominal pembiayaan terlalu kecil.');
            return;
        }

        setIsLoading(true);
        const toastId = toast.loading('Mengirim pengajuan...');

        try {
            // Siapkan data detail untuk disimpan ke JSONB
            let detailData = {};
            if (type === 'Kredit Barang') {
                detailData = {
                    item: formData.namaBarang,
                    price: formData.estimasiHarga,
                    dp: formData.dp
                };
            } else if (type === 'Modal Usaha') {
                detailData = {
                    business_type: formData.jenisUsaha,
                    business_name: formData.namaUsaha,
                    business_age: formData.lamaUsaha,
                    daily_revenue: formData.omsetHarian,
                    net_profit: formData.keuntunganBersih,
                    purpose: formData.peruntukan
                };
            } else if (type === 'Biaya Pelatihan') {
                detailData = {
                    training_type: formData.jenisPelatihan,
                    training_name: formData.namaPelatihan
                };
            } else if (type === 'Biaya Pendidikan') {
                detailData = {
                    child_name: formData.namaAnak,
                    school_name: formData.namaSekolah,
                    purpose: formData.peruntukan
                };
            }

            const { error } = await supabase.from('loans').insert({
                user_id: user?.id,
                amount: simulation.pokok, // Nominal Pokok Pinjaman
                duration: parseInt(formData.tenor),
                type: type,
                margin_rate: (simulation.margin / simulation.pokok) * 100, // Simpan persentase total jasa
                monthly_payment: simulation.angsuran,
                details: detailData, // Simpan detail spesifik disini
                status: 'pending'
            });

            if (error) throw error;

            toast.success('Pengajuan berhasil!', { id: toastId });
            navigate('/pembiayaan');

        } catch (error: any) {
            toast.error('Gagal: ' + error.message, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    // --- RENDER FORM INPUT ---
    const renderFormInputs = () => {
        switch (type) {
            case 'Kredit Barang':
                return (
                    <>
                        <Input name="namaBarang" label="Nama Barang" placeholder="Contoh: Laptop Asus" onChange={handleChange} required />
                        <Input name="estimasiHarga" label="Estimasi Harga" type="number" placeholder="Rp" onChange={handleChange} required />
                        <Input name="dp" label="Uang Muka (DP)" type="number" placeholder="Rp" onChange={handleChange} required />
                        <p className="text-xs text-blue-600 -mt-2">*Pokok pinjaman = Harga - DP</p>
                    </>
                );
            case 'Modal Usaha':
                return (
                    <>
                        <Input name="jenisUsaha" label="Jenis Usaha" placeholder="Kuliner, Fashion, dll" onChange={handleChange} required />
                        <Input name="namaUsaha" label="Nama Usaha" onChange={handleChange} required />
                        <Input name="lamaUsaha" label="Lama Usaha Berjalan" placeholder="Contoh: 2 Tahun" onChange={handleChange} required />
                        <div className="grid grid-cols-2 gap-4">
                            <Input name="omsetHarian" label="Omset Harian" type="number" onChange={handleChange} required />
                            <Input name="keuntunganBersih" label="Profit Bersih/Bulan" type="number" onChange={handleChange} required />
                        </div>
                        <div className="border-t border-dashed my-2"></div>
                        <Input name="besarModal" label="Mengajukan Modal Sebesar" type="number" placeholder="Rp" onChange={handleChange} required />
                        <Input name="peruntukan" label="Peruntukan Permodalan" placeholder="Beli alat, stok barang..." onChange={handleChange} required />
                    </>
                );
            case 'Biaya Pelatihan':
                return (
                    <>
                        <Input name="jenisPelatihan" label="Jenis Pelatihan" placeholder="Sertifikasi, Workshop..." onChange={handleChange} required />
                        <Input name="namaPelatihan" label="Nama Pelatihan" onChange={handleChange} required />
                        <Input name="biayaPelatihan" label="Biaya yang Dibutuhkan" type="number" placeholder="Rp" onChange={handleChange} required />
                    </>
                );
            case 'Biaya Pendidikan':
                return (
                    <>
                        <Input name="namaAnak" label="Nama Anak" onChange={handleChange} required />
                        <Input name="namaSekolah" label="Nama Sekolah" onChange={handleChange} required />
                        <Input name="biayaPendidikan" label="Jumlah Pembiayaan" type="number" placeholder="Rp" onChange={handleChange} required />
                        <Input name="peruntukan" label="Peruntukan Dana" placeholder="Uang gedung, SPP..." onChange={handleChange} required />
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30 px-4 py-4 flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeft size={20} className="text-gray-700" />
                </button>
                <h1 className="text-lg font-bold text-gray-900">Formulir Pembiayaan</h1>
            </div>

            <div className="max-w-3xl mx-auto p-4 space-y-6">

                {/* PILIH JENIS */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { id: 'Kredit Barang', icon: <ShoppingBag size={18} /> },
                        { id: 'Modal Usaha', icon: <Briefcase size={18} /> },
                        { id: 'Biaya Pelatihan', icon: <BookOpen size={18} /> },
                        { id: 'Biaya Pendidikan', icon: <GraduationCap size={18} /> }
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setType(item.id)}
                            className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-2 transition-all ${type === item.id
                                    ? 'bg-kkj-blue text-white border-kkj-blue shadow-lg scale-105'
                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            {item.icon} {item.id}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* FORMULIR INPUT */}
                    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4 h-fit">
                        <h2 className="font-bold text-gray-800 border-b pb-3 mb-2">{type}</h2>

                        {renderFormInputs()}

                        {/* Tenor Selalu Ada */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Tenor (Bulan)</label>
                            <div className="grid grid-cols-4 gap-2">
                                {['3', '6', '12', '24'].map((bln) => (
                                    <button
                                        key={bln}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, tenor: bln })}
                                        className={`py-2 rounded-lg border text-sm font-bold transition-all ${formData.tenor === bln
                                                ? 'bg-orange-500 text-white border-orange-500'
                                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        {bln}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </form>

                    {/* SIMULASI */}
                    <div className="space-y-4">
                        <div className="bg-blue-900 text-white p-6 rounded-2xl shadow-lg">
                            <h3 className="font-bold text-blue-200 flex items-center gap-2 mb-4">
                                <Calculator size={18} /> Simulasi Angsuran
                            </h3>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="opacity-70">Pokok Pinjaman</span>
                                    <span className="font-bold">{formatRupiah(simulation.pokok)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="opacity-70">
                                        {type === 'Kredit Barang' || type === 'Modal Usaha'
                                            ? 'Jasa (10% / Tahun)'
                                            : 'Jasa (0.6% / Bulan)'}
                                    </span>
                                    <span className="font-bold text-orange-300">
                                        + {formatRupiah(simulation.margin)}
                                    </span>
                                </div>
                                <div className="h-px bg-white/20 my-2"></div>
                                <div className="flex justify-between items-center text-lg">
                                    <span className="font-bold">Angsuran / Bulan</span>
                                    <span className="font-bold text-yellow-400">
                                        {formatRupiah(simulation.angsuran)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-xl text-xs text-blue-800 flex gap-3 leading-relaxed border border-blue-100">
                            <Info size={16} className="shrink-0 mt-0.5" />
                            <p>
                                Perhitungan di atas adalah estimasi. Persetujuan akhir bergantung pada verifikasi Admin. Dana akan dicairkan ke saldo Tapro Anda.
                            </p>
                        </div>

                        <Button
                            onClick={handleSubmit}
                            isLoading={isLoading}
                            disabled={simulation.pokok === 0}
                            className="w-full bg-kkj-blue py-4 text-lg rounded-xl shadow-lg"
                        >
                            Ajukan Sekarang
                        </Button>
                    </div>

                </div>
            </div>
        </div>
    );
};
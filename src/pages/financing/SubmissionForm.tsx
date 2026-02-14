import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, Calculator, ShoppingBag, Briefcase, BookOpen, GraduationCap, Info, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatRupiah } from '../../lib/utils';

export const SubmissionForm = () => { // <--- Pastikan kurung kurawal pembuka ini ada!
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);

    // Tipe Pembiayaan
    const [type, setType] = useState('Kredit Barang');

    // --- STATE KATALOG (DATA DARI DATABASE) ---
    const [catalogItems, setCatalogItems] = useState<any[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);

    // Fetch Data Katalog saat komponen dimuat
    useEffect(() => {
        const fetchCatalog = async () => {
            const { data, error } = await supabase
                .from('credit_catalog')
                .select('*')
                .order('name', { ascending: true });

            if (error) {
                console.error("Error fetching catalog:", error);
                toast.error("Gagal memuat katalog barang");
            } else {
                setCatalogItems(data || []);
            }
        };

        fetchCatalog();
    }, []);

    // State Dinamis (Menampung input manual lainnya)
    const [formData, setFormData] = useState({
        // Modal Usaha
        jenisUsaha: '',
        namaUsaha: '',
        lamaUsaha: '',
        omsetHarian: '',
        keuntunganBersih: '',
        besarModal: '',
        peruntukan: '',

        // Pelatihan
        jenisPelatihan: '',
        namaPelatihan: '',
        biayaPelatihan: '',

        // Pendidikan
        namaAnak: '',
        namaSekolah: '',
        biayaPendidikan: '',

        // Global
        tenor: '12' // Default
    });

    // Hasil Perhitungan
    const [simulation, setSimulation] = useState({
        pokok: 0,
        margin: 0,
        angsuran: 0,
        pajak: 0
    });

    // --- LOGIC PERHITUNGAN ---
    useEffect(() => {
        let pokok = 0;
        let pajak = 0;
        let ratePerBulan = 0;
        let tenor = parseInt(formData.tenor) || 0;

        // 1. Tentukan Pokok Pinjaman & Pajak
        if (type === 'Kredit Barang') {
            if (selectedProduct) {
                // Logic Baru: Pokok = (Harga - DP) 
                pokok = (selectedProduct.price - selectedProduct.dp);
                pajak = selectedProduct.tax || 0;

                // Pastikan tenor mengikuti pilihan produk jika belum diset
                // Note: selectedProduct.tenors diambil dari JSONB database
                if (selectedProduct.tenors && Array.isArray(selectedProduct.tenors)) {
                    if (!selectedProduct.tenors.includes(tenor)) {
                        // Jika tenor saat ini tidak ada di opsi produk, set ke opsi pertama
                        tenor = selectedProduct.tenors[0];
                        // Kita update state tenor nanti via effect atau biarkan user memilih ulang
                        // Disini kita paksa perhitungan pakai tenor valid pertama dulu
                    }
                }
            }
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
            ratePerBulan = (0.10 / 12);
        } else {
            // Faedah 0.6% Per BULAN
            ratePerBulan = 0.006;
        }

        // 3. Hitung Angsuran
        if (pokok > 0 && tenor > 0) {
            // Pokok Pinjaman (Yang dihutangkan)
            const totalPokok = pokok + pajak;

            const totalJasa = pokok * ratePerBulan * tenor; // Bunga dihitung dari pokok murni
            const totalBayar = totalPokok + totalJasa;
            const angsuranPerBulan = totalBayar / tenor;

            setSimulation({
                pokok: pokok,
                margin: totalJasa,
                pajak: pajak,
                angsuran: Math.ceil(angsuranPerBulan)
            });
        } else {
            setSimulation({ pokok: 0, margin: 0, angsuran: 0, pajak: 0 });
        }

    }, [formData, type, selectedProduct]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Handler Khusus Ganti Produk Katalog
    const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const productId = parseInt(e.target.value);
        const product = catalogItems.find(item => item.id === productId);
        setSelectedProduct(product || null);

        // Reset tenor ke default produk tsb jika ada
        if (product && product.tenors && product.tenors.length > 0) {
            setFormData(prev => ({ ...prev, tenor: product.tenors[0].toString() }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (simulation.pokok < 100000) {
            toast.error('Nominal pembiayaan tidak valid.');
            return;
        }

        setIsLoading(true);
        const toastId = toast.loading('Mengirim pengajuan...');

        try {
            // Siapkan data detail
            let detailData = {};
            if (type === 'Kredit Barang') {
                if (!selectedProduct) throw new Error("Pilih barang terlebih dahulu");
                detailData = {
                    item: selectedProduct.name,
                    price: selectedProduct.price,
                    dp: selectedProduct.dp,
                    tax: selectedProduct.tax,
                    vendor_note: "Barang disediakan oleh Koperasi (Katalog)"
                };
            } else if (type === 'Modal Usaha') {
                detailData = {
                    business_type: formData.jenisUsaha,
                    business_name: formData.namaUsaha,
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
                amount: simulation.pokok + simulation.pajak, // Total hutang
                duration: parseInt(formData.tenor),
                type: type,
                margin_rate: 10,
                monthly_payment: simulation.angsuran,
                details: detailData,
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
                    <div className="space-y-4 animate-fade-in">
                        <div className="bg-blue-50 p-3 rounded-lg flex gap-2 text-sm text-blue-800 border border-blue-200">
                            <Info className="shrink-0 mt-0.5" size={16} />
                            <p>Pilih barang yang tersedia di katalog. DP dan Tenor sudah ditentukan oleh Admin.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Pilih Barang</label>
                            <select
                                className="w-full p-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-kkj-blue outline-none"
                                onChange={handleProductChange}
                                defaultValue=""
                            >
                                <option value="" disabled>-- Pilih Katalog Barang --</option>
                                {catalogItems.map(item => (
                                    <option key={item.id} value={item.id}>
                                        {item.name} - {formatRupiah(item.price)}
                                    </option>
                                ))}
                            </select>
                            {catalogItems.length === 0 && (
                                <p className="text-xs text-red-400 mt-1">Belum ada barang di katalog admin.</p>
                            )}
                        </div>

                        {selectedProduct && (
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Harga Barang</span>
                                    <span className="font-bold text-gray-800">{formatRupiah(selectedProduct.price)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Wajib DP (Dibayar Awal)</span>
                                    <span className="font-bold text-green-600">{formatRupiah(selectedProduct.dp)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Biaya Admin/Pajak</span>
                                    <span className="font-bold text-orange-600">{formatRupiah(selectedProduct.tax || 0)}</span>
                                </div>
                                <div className="border-t border-dashed pt-2 flex justify-between text-sm font-bold">
                                    <span>Sisa Pokok Hutang</span>
                                    <span className="text-blue-600">{formatRupiah((selectedProduct.price - selectedProduct.dp) + (selectedProduct.tax || 0))}</span>
                                </div>
                            </div>
                        )}
                    </div>
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
                            onClick={() => {
                                setType(item.id);
                                setSelectedProduct(null); // Reset product jika ganti tab
                                setSimulation({ pokok: 0, margin: 0, angsuran: 0, pajak: 0 });
                            }}
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
                        <h2 className="font-bold text-gray-800 border-b pb-3 mb-2 flex items-center gap-2">
                            {type === 'Kredit Barang' && <ShoppingBag size={18} className="text-kkj-blue" />}
                            {type}
                        </h2>

                        {renderFormInputs()}

                        {/* Tenor Selection */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Tenor (Bulan)
                                {type === 'Kredit Barang' && <span className="font-normal text-gray-400 text-xs ml-1">(Sesuai ketentuan barang)</span>}
                            </label>

                            <div className="grid grid-cols-4 gap-2">
                                {/* JIKA KREDIT BARANG: Ambil tenor dari produk database. JIKA LAIN: Ambil standar */}
                                {(type === 'Kredit Barang' && selectedProduct && selectedProduct.tenors
                                    ? selectedProduct.tenors
                                    : [3, 6, 12, 24]
                                ).map((bln: any) => (
                                    <button
                                        key={bln}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, tenor: bln.toString() })}
                                        className={`py-2 rounded-lg border text-sm font-bold transition-all ${formData.tenor === bln.toString()
                                            ? 'bg-orange-500 text-white border-orange-500'
                                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        {bln}
                                    </button>
                                ))}
                            </div>
                            {type === 'Kredit Barang' && !selectedProduct && (
                                <p className="text-xs text-red-400 mt-1 italic">Pilih barang dulu untuk melihat tenor.</p>
                            )}
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
                                    <span className="opacity-70">Pokok (Setelah DP)</span>
                                    <span className="font-bold">{formatRupiah(simulation.pokok)}</span>
                                </div>

                                {simulation.pajak > 0 && (
                                    <div className="flex justify-between">
                                        <span className="opacity-70">Admin/Pajak</span>
                                        <span className="font-bold text-orange-300">+ {formatRupiah(simulation.pajak)}</span>
                                    </div>
                                )}

                                <div className="flex justify-between">
                                    <span className="opacity-70">
                                        {type === 'Kredit Barang' || type === 'Modal Usaha'
                                            ? 'Jasa (10% / Tahun)'
                                            : 'Jasa (0.6% / Bulan)'}
                                    </span>
                                    <span className="font-bold text-green-300">
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
                                <div className="text-right text-[10px] opacity-60 mt-1">
                                    x {formData.tenor} Bulan
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-xl text-xs text-blue-800 flex gap-3 leading-relaxed border border-blue-100">
                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                            <p>
                                <strong>Catatan Penting:</strong> <br />
                                {type === 'Kredit Barang'
                                    ? "Barang akan dipesan setelah Admin memverifikasi pengajuan dan Anda membayarkan DP. "
                                    : "Dana akan dicairkan ke saldo Tapro setelah disetujui Admin."}
                            </p>
                        </div>

                        <Button
                            onClick={handleSubmit}
                            isLoading={isLoading}
                            disabled={simulation.pokok === 0 || (type === 'Kredit Barang' && !selectedProduct)}
                            className="w-full bg-kkj-blue py-4 text-lg rounded-xl shadow-lg"
                        >
                            Ajukan Sekarang
                        </Button>
                    </div>

                </div>
            </div>
        </div>
    );
}; // <--- KURUNG TUTUP FUNGSI UTAMA
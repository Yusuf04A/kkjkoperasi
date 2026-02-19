import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, Calculator, ShoppingBag, Briefcase, BookOpen, GraduationCap, Info, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatRupiah } from '../../lib/utils';

export const SubmissionForm = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);

    // Tipe Pembiayaan
    const [type, setType] = useState('Kredit Barang');

    // --- STATE KATALOG ---
    const [catalogItems, setCatalogItems] = useState<any[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);

    // --- REVISI: STATE UNTUK BARANG KUSTOM ---
    const [kreditSource, setKreditSource] = useState<'catalog' | 'custom'>('catalog');
    const [customItemName, setCustomItemName] = useState(''); // Cuma butuh nama barang

    // Fetch Data Katalog
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

    // State Dinamis
    const [formData, setFormData] = useState({
        jenisUsaha: '', namaUsaha: '', lamaUsaha: '', omsetHarian: '', keuntunganBersih: '', besarModal: '', peruntukan: '',
        jenisPelatihan: '', namaPelatihan: '', biayaPelatihan: '',
        namaAnak: '', namaSekolah: '', biayaPendidikan: '',
        tenor: '12'
    });

    // Hasil Perhitungan
    const [simulation, setSimulation] = useState({
        pokok: 0, margin: 0, angsuran: 0, pajak: 0
    });

    // --- LOGIC PERHITUNGAN ---
    useEffect(() => {
        let pokok = 0;
        let pajak = 0;
        let ratePerBulan = 0;
        let tenor = parseInt(formData.tenor) || 12; // Default 12 bulan jika kosong

        if (type === 'Kredit Barang') {
            if (kreditSource === 'catalog' && selectedProduct) {
                pokok = (selectedProduct.price - selectedProduct.dp);
                pajak = selectedProduct.tax || 0;
                if (selectedProduct.tenors && Array.isArray(selectedProduct.tenors) && !selectedProduct.tenors.includes(tenor)) {
                    tenor = selectedProduct.tenors[0];
                }
            }
            // Jika Kustom, pokok tetap 0 karena harga akan diisi admin nanti.
        } else if (type === 'Modal Usaha') {
            pokok = parseInt(formData.besarModal.replace(/\D/g, '')) || 0;
        } else if (type === 'Biaya Pelatihan') {
            pokok = parseInt(formData.biayaPelatihan.replace(/\D/g, '')) || 0;
        } else if (type === 'Biaya Pendidikan') {
            pokok = parseInt(formData.biayaPendidikan.replace(/\D/g, '')) || 0;
        }

        if (type === 'Kredit Barang' || type === 'Modal Usaha') {
            ratePerBulan = (0.10 / 12);
        } else {
            ratePerBulan = 0.006;
        }

        if (pokok > 0 && tenor > 0) {
            const totalPokok = pokok + pajak;
            const totalJasa = pokok * ratePerBulan * tenor;
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
    }, [formData, type, selectedProduct, kreditSource]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const productId = parseInt(e.target.value);
        const product = catalogItems.find(item => item.id === productId);
        setSelectedProduct(product || null);

        if (product && product.tenors && product.tenors.length > 0) {
            setFormData(prev => ({ ...prev, tenor: product.tenors[0].toString() }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const isCustomSubmission = type === 'Kredit Barang' && kreditSource === 'custom';

        // Validasi
        if (!isCustomSubmission && simulation.pokok < 50000) {
            toast.error('Nominal pembiayaan tidak valid.');
            return;
        }

        if (isCustomSubmission && !customItemName.trim()) {
            toast.error('Nama barang wajib diisi!');
            return;
        }

        setIsLoading(true);
        const toastId = toast.loading('Mengirim pengajuan...');

        try {
            let detailData = {};
            let finalAmount = simulation.pokok + simulation.pajak;
            let finalDuration = parseInt(formData.tenor) || 0;

            if (type === 'Kredit Barang') {
                if (kreditSource === 'catalog') {
                    if (!selectedProduct) throw new Error("Pilih barang terlebih dahulu");
                    detailData = {
                        item: selectedProduct.name,
                        price: selectedProduct.price,
                        dp: selectedProduct.dp,
                        tax: selectedProduct.tax,
                        is_custom: false,
                        vendor_note: "Barang dari Katalog Koperasi"
                    };
                } else {
                    // KUSTOM: Hanya kirim nama barang. Sisanya 0.
                    detailData = {
                        item: customItemName,
                        is_custom: true,
                        vendor_note: "Pengajuan Penambahan Katalog Baru"
                    };
                    finalAmount = 0;
                    finalDuration = 0; 
                }
            } else if (type === 'Modal Usaha') {
                detailData = { business_type: formData.jenisUsaha, business_name: formData.namaUsaha, purpose: formData.peruntukan };
            } else if (type === 'Biaya Pelatihan') {
                detailData = { training_type: formData.jenisPelatihan, training_name: formData.namaPelatihan };
            } else if (type === 'Biaya Pendidikan') {
                detailData = { child_name: formData.namaAnak, school_name: formData.namaSekolah, purpose: formData.peruntukan };
            }

            const { error } = await supabase.from('loans').insert({
                user_id: user?.id,
                amount: finalAmount,
                duration: finalDuration,
                type: type,
                margin_rate: 10,
                monthly_payment: simulation.angsuran, // Jika kustom, ini nilainya 0
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

    const renderFormInputs = () => {
        switch (type) {
            case 'Kredit Barang':
                return (
                    <div className="space-y-4 animate-fade-in">
                        {/* TOGGLE KATALOG VS KUSTOM */}
                        <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
                            <button
                                type="button"
                                onClick={() => setKreditSource('catalog')}
                                className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${kreditSource === 'catalog' ? 'bg-white text-[#136f42] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Pilih Katalog
                            </button>
                            <button
                                type="button"
                                onClick={() => setKreditSource('custom')}
                                className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${kreditSource === 'custom' ? 'bg-white text-[#136f42] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Ajukan Barang Lain
                            </button>
                        </div>

                        {kreditSource === 'catalog' ? (
                            <>
                                <div className="bg-green-50 p-3 rounded-lg flex gap-2 text-sm text-green-800 border border-green-200">
                                    <Info className="shrink-0 mt-0.5" size={16} />
                                    <p>Pilih barang yang tersedia di katalog. DP dan Tenor sudah ditentukan oleh Admin.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Pilih Barang</label>
                                    <select
                                        className="w-full p-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-[#136f42] outline-none"
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
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <div className="bg-blue-50 p-3 rounded-lg flex gap-2 text-sm text-blue-800 border border-blue-200">
                                    <Info className="shrink-0 mt-0.5" size={16} />
                                    <p>Ajukan barang yang belum ada di katalog. Admin akan mengecek harga dan memasukkannya ke katalog agar bisa Anda pesan.</p>
                                </div>
                                <Input
                                    name="customItemName"
                                    label="Nama Barang Lengkap (Merk, Tipe)"
                                    placeholder="Cth: Kulkas Sharp 2 Pintu SJ-195"
                                    value={customItemName}
                                    onChange={(e) => setCustomItemName(e.target.value)}
                                    required
                                />
                            </>
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
        <div className="min-h-screen bg-gray-50 pb-20 font-sans">
            <div className="bg-white border-b border-green-100 sticky top-0 z-30 px-4 py-4 flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-green-50 rounded-full transition-colors">
                    <ArrowLeft size={20} className="text-[#136f42]" />
                </button>
                <h1 className="text-lg font-bold text-gray-900">Formulir Pembiayaan</h1>
            </div>

            <div className="max-w-3xl mx-auto p-4 space-y-6">
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
                                setSelectedProduct(null);
                                setSimulation({ pokok: 0, margin: 0, angsuran: 0, pajak: 0 });
                            }}
                            className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-2 transition-all ${type === item.id
                                ? 'bg-[#136f42] text-white border-[#136f42] shadow-lg scale-105'
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-green-50 hover:border-green-200'
                                }`}
                        >
                            {item.icon} {item.id}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4 h-fit">
                        <h2 className="font-bold text-gray-800 border-b border-gray-100 pb-3 mb-2 flex items-center gap-2">
                            {type === 'Kredit Barang' && <ShoppingBag size={18} className="text-[#136f42]" />}
                            {type}
                        </h2>

                        {renderFormInputs()}

                        {/* Tampilkan Pilihan Tenor HANYA JIKA BUKAN BARANG KUSTOM */}
                        {!(type === 'Kredit Barang' && kreditSource === 'custom') && (
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Tenor (Bulan)</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {(type === 'Kredit Barang' && kreditSource === 'catalog' && selectedProduct && selectedProduct.tenors
                                        ? selectedProduct.tenors
                                        : [3, 6, 12, 24]
                                    ).map((bln: any) => (
                                        <button
                                            key={bln}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, tenor: bln.toString() })}
                                            className={`py-2 rounded-lg border text-sm font-bold transition-all ${formData.tenor === bln.toString()
                                                ? 'bg-[#aeea00] text-[#0f5c35] border-[#aeea00] shadow-sm'
                                                : 'bg-white text-gray-600 border-gray-200 hover:bg-green-50'
                                                }`}
                                        >
                                            {bln}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </form>

                    {/* SIMULASI */}
                    <div className="space-y-4">
                        {/* Tampilkan Simulasi HANYA JIKA BUKAN BARANG KUSTOM */}
                        {!(type === 'Kredit Barang' && kreditSource === 'custom') && (
                            <div className="bg-[#136f42] text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                                <h3 className="font-bold text-[#aeea00] flex items-center gap-2 mb-4 relative z-10">
                                    <Calculator size={18} /> Simulasi Angsuran
                                </h3>

                                <div className="space-y-3 text-sm relative z-10">
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
                                            {type === 'Kredit Barang' || type === 'Modal Usaha' ? 'Jasa (10% / Tahun)' : 'Jasa (0.6% / Bulan)'}
                                        </span>
                                        <span className="font-bold text-[#aeea00]">
                                            + {formatRupiah(simulation.margin)}
                                        </span>
                                    </div>

                                    <div className="h-px bg-white/20 my-2"></div>

                                    <div className="flex justify-between items-center text-lg">
                                        <span className="font-bold">Angsuran / Bulan</span>
                                        <span className="font-bold text-[#aeea00] drop-shadow-sm">
                                            {formatRupiah(simulation.angsuran)}
                                        </span>
                                    </div>
                                    <div className="text-right text-[10px] opacity-60 mt-1 uppercase tracking-widest font-bold">
                                        x {formData.tenor} Bulan
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="bg-amber-50 p-4 rounded-xl text-xs text-amber-800 flex gap-3 leading-relaxed border border-amber-100">
                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                            <p>
                                <strong>Catatan Penting:</strong> <br />
                                {type === 'Kredit Barang'
                                    ? kreditSource === 'custom'
                                        ? "Pengajuan Anda akan diproses Admin. Jika disetujui, Admin akan mencari harga barang tersebut dan memasukkannya ke Katalog. Anda bisa memesannya nanti dari Katalog."
                                        : "Barang akan dipesan setelah Admin memverifikasi pengajuan dan Anda membayarkan DP. Dana KREDIT BARANG TIDAK AKAN masuk ke saldo Tapro."
                                    : "Dana akan dicairkan ke saldo Tapro setelah disetujui Admin."}
                            </p>
                        </div>

                        <Button
                            onClick={handleSubmit}
                            isLoading={isLoading}
                            disabled={!(type === 'Kredit Barang' && kreditSource === 'custom') && (simulation.pokok === 0 || (type === 'Kredit Barang' && kreditSource === 'catalog' && !selectedProduct))}
                            className="w-full bg-[#136f42] hover:bg-[#0f5c35] py-4 text-lg rounded-xl shadow-lg shadow-green-900/20 active:scale-95 transition-all font-bold"
                        >
                            Ajukan Sekarang
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Plus, Package, Edit, Trash2, Search, X, Check, Save } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { formatRupiah } from '../../lib/utils';
import toast from 'react-hot-toast';

export const CreditWarehouse = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [items, setItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // State untuk Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editMode, setEditMode] = useState(false); // false = tambah, true = edit

    // Form State
    const [formData, setFormData] = useState({
        id: null,
        name: '',
        price: '',
        dp: '',
        tax: '',
        tenors: [] as number[] // Array angka [3, 6, 12]
    });

    // --- 1. FETCH DATA (READ) ---
    const fetchCatalog = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('credit_catalog')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) toast.error("Gagal memuat katalog");
        else setItems(data || []);
        setIsLoading(false);
    };

    useEffect(() => { fetchCatalog(); }, []);

    // --- 2. HANDLE BUKA MODAL ---
    const openModalAdd = () => {
        setFormData({ id: null, name: '', price: '', dp: '', tax: '', tenors: [3, 6, 12] });
        setEditMode(false);
        setIsModalOpen(true);
    };

    const openModalEdit = (item: any) => {
        setFormData({
            id: item.id,
            name: item.name,
            price: item.price,
            dp: item.dp,
            tax: item.tax,
            tenors: item.tenors || []
        });
        setEditMode(true);
        setIsModalOpen(true);
    };

    // --- 3. HANDLE SIMPAN (CREATE & UPDATE) ---
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const payload = {
                name: formData.name,
                price: parseInt(String(formData.price).replace(/\D/g, '')),
                dp: parseInt(String(formData.dp).replace(/\D/g, '')),
                tax: parseInt(String(formData.tax).replace(/\D/g, '')) || 0,
                tenors: formData.tenors
            };

            if (editMode && formData.id) {
                // UPDATE
                const { error } = await supabase.from('credit_catalog').update(payload).eq('id', formData.id);
                if (error) throw error;
                toast.success("Barang berhasil diperbarui!");
            } else {
                // INSERT
                const { error } = await supabase.from('credit_catalog').insert(payload);
                if (error) throw error;
                toast.success("Barang baru ditambahkan!");
            }

            setIsModalOpen(false);
            fetchCatalog(); // Refresh tabel

        } catch (error: any) {
            toast.error("Gagal menyimpan: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    // --- 4. HANDLE HAPUS (DELETE) ---
    const handleDelete = async (id: number) => {
        if (!window.confirm("Yakin ingin menghapus barang ini?")) return;

        const toastId = toast.loading("Menghapus...");
        const { error } = await supabase.from('credit_catalog').delete().eq('id', id);

        if (error) {
            toast.error("Gagal menghapus", { id: toastId });
        } else {
            toast.success("Barang dihapus", { id: toastId });
            setItems(items.filter(i => i.id !== id));
        }
    };

    // Helper Tenor Checkbox
    const toggleTenor = (val: number) => {
        if (formData.tenors.includes(val)) {
            setFormData({ ...formData, tenors: formData.tenors.filter(t => t !== val) });
        } else {
            setFormData({ ...formData, tenors: [...formData.tenors, val].sort((a, b) => a - b) });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* HEADER */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/admin/dashboard')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Gudang Kredit</h1>
                        <p className="text-xs text-gray-500">Manajemen Katalog Barang & Skema Cicilan</p>
                    </div>
                </div>
                <Button onClick={openModalAdd} className="bg-[#003366] text-white flex items-center gap-2">
                    <Plus size={18} /> Tambah Barang
                </Button>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-8">

                {/* SEARCH */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6 flex gap-4 shadow-sm">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                        <Input
                            placeholder="Cari nama barang..."
                            className="pl-10 border-gray-200"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* TABEL */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold tracking-wider">
                            <tr>
                                <th className="p-4 border-b">Nama Barang</th>
                                <th className="p-4 border-b">Harga Cash</th>
                                <th className="p-4 border-b">Wajib DP</th>
                                <th className="p-4 border-b">Admin/Pajak</th>
                                <th className="p-4 border-b">Opsi Tenor</th>
                                <th className="p-4 border-b text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr><td colSpan={6} className="p-10 text-center">Memuat data...</td></tr>
                            ) : items.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase())).map((item) => (
                                <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                                                <Package size={20} />
                                            </div>
                                            <span className="font-bold text-gray-800">{item.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 font-medium text-gray-600">{formatRupiah(item.price)}</td>
                                    <td className="p-4 font-bold text-green-600">{formatRupiah(item.dp)}</td>
                                    <td className="p-4 text-orange-600">{formatRupiah(item.tax)}</td>
                                    <td className="p-4">
                                        <div className="flex gap-1 flex-wrap">
                                            {item.tenors?.map((t: any) => (
                                                <span key={t} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-[10px] font-bold">
                                                    {t} Bln
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => openModalEdit(item)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                <Edit size={18} />
                                            </button>
                                            <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {!isLoading && items.length === 0 && (
                        <div className="p-10 text-center text-gray-400">Belum ada barang di katalog.</div>
                    )}
                </div>
            </div>

            {/* === MODAL FORM ADD/EDIT === */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg text-gray-800">{editMode ? 'Edit Barang' : 'Tambah Barang Baru'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <Input
                                label="Nama Barang"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Contoh: iPhone 15 Pro"
                                required
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Harga Cash (Rp)"
                                    type="number"
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    required
                                />
                                <Input
                                    label="Wajib DP (Rp)"
                                    type="number"
                                    value={formData.dp}
                                    onChange={e => setFormData({ ...formData, dp: e.target.value })}
                                    required
                                />
                            </div>

                            <Input
                                label="Biaya Admin / Pajak (Rp)"
                                type="number"
                                value={formData.tax}
                                onChange={e => setFormData({ ...formData, tax: e.target.value })}
                                placeholder="0"
                            />

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Opsi Tenor (Bulan)</label>
                                <div className="flex gap-3">
                                    {[3, 6, 12, 18, 24, 36].map((t) => (
                                        <label key={t} className={`cursor-pointer px-3 py-2 rounded-lg border text-xs font-bold flex items-center gap-2 transition-all ${formData.tenors.includes(t) ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={formData.tenors.includes(t)}
                                                onChange={() => toggleTenor(t)}
                                            />
                                            {t} Bln
                                        </label>
                                    ))}
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1">*Pilih minimal satu tenor</p>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>Batal</Button>
                                <Button type="submit" className="flex-1 bg-[#003366]" isLoading={isSaving}>
                                    <Save size={18} className="mr-2" /> Simpan Barang
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/api'; // Menggunakan Axios
import { ArrowLeft, Plus, Package, Edit, Trash2, Search, X, Save, Loader2 } from 'lucide-react';
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
        id: null as number | null,
        name: '',
        price: '' as string | number,
        dp: '' as string | number,
        tax: '' as string | number,
        tenors: [] as number[] 
    });

    // --- 1. FETCH DATA (READ) ---
    const fetchCatalog = async () => {
        setIsLoading(true);
        try {
            // Endpoint Laravel: GET /admin/financing/catalog
            const response = await API.get('/admin/financing/catalog');
            setItems(response.data || []);
        } catch (error) {
            toast.error("Gagal memuat katalog");
        } finally {
            setIsLoading(false);
        }
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
            tenors: Array.isArray(item.tenors) ? item.tenors : JSON.parse(item.tenors || '[]')
        });
        setEditMode(true);
        setIsModalOpen(true);
    };

    // --- 3. HANDLE SIMPAN (CREATE & UPDATE) ---
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.tenors.length === 0) return toast.error("Pilih minimal satu tenor");
        
        setIsSaving(true);
        const toastId = toast.loading("Menyimpan data...");

        try {
            const payload = {
                name: formData.name,
                price: parseInt(String(formData.price).replace(/\D/g, '')),
                dp: parseInt(String(formData.dp).replace(/\D/g, '')),
                tax: parseInt(String(formData.tax).replace(/\D/g, '')) || 0,
                tenors: formData.tenors
            };

            if (editMode && formData.id) {
                // UPDATE: PUT /admin/financing/catalog/{id}
                await API.put(`/admin/financing/catalog/${formData.id}`, payload);
                toast.success("Barang berhasil diperbarui!", { id: toastId });
            } else {
                // INSERT: POST /admin/financing/catalog
                await API.post('/admin/financing/catalog', payload);
                toast.success("Barang baru ditambahkan!", { id: toastId });
            }

            setIsModalOpen(false);
            fetchCatalog(); 

        } catch (error: any) {
            const msg = error.response?.data?.message || "Gagal menyimpan";
            toast.error(msg, { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    // --- 4. HANDLE HAPUS (DELETE) ---
    const handleDelete = async (id: number) => {
        if (!window.confirm("Yakin ingin menghapus barang ini?")) return;

        const toastId = toast.loading("Menghapus...");
        try {
            // DELETE: DELETE /admin/financing/catalog/{id}
            await API.delete(`/admin/financing/catalog/${id}`);
            toast.success("Barang dihapus", { id: toastId });
            setItems(items.filter(i => i.id !== id));
        } catch (error) {
            toast.error("Gagal menghapus", { id: toastId });
        }
    };

    const toggleTenor = (val: number) => {
        if (formData.tenors.includes(val)) {
            setFormData({ ...formData, tenors: formData.tenors.filter(t => t !== val) });
        } else {
            setFormData({ ...formData, tenors: [...formData.tenors, val].sort((a, b) => a - b) });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-12 font-sans">
            {/* HEADER */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/admin/dashboard')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Gudang Kredit</h1>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Manajemen Katalog Barang</p>
                    </div>
                </div>
                <Button onClick={openModalAdd} className="bg-[#136f42] hover:bg-[#0f5c35] text-white flex items-center gap-2 shadow-lg shadow-green-900/20">
                    <Plus size={18} strokeWidth={3} /> Tambah Barang
                </Button>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-8">
                {/* SEARCH */}
                <div className="bg-white p-4 rounded-2xl border border-gray-200 mb-6 flex gap-4 shadow-sm">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <Input
                            placeholder="Cari nama barang..."
                            className="pl-10 border-gray-200 focus:border-[#136f42] focus:ring-[#136f42]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* TABEL */}
                <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50/80 text-gray-500 text-[10px] uppercase font-black tracking-[0.2em]">
                                <tr>
                                    <th className="p-4 border-b">Barang</th>
                                    <th className="p-4 border-b">Harga Cash</th>
                                    <th className="p-4 border-b text-green-700">Wajib DP</th>
                                    <th className="p-4 border-b text-orange-700">Pajak/Adm</th>
                                    <th className="p-4 border-b">Tenor</th>
                                    <th className="p-4 border-b text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {isLoading ? (
                                    <tr><td colSpan={6} className="p-10 text-center"><Loader2 className="animate-spin inline text-[#136f42] mr-2" /> Memuat data...</td></tr>
                                ) : items.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase())).map((item) => (
                                    <tr key={item.id} className="hover:bg-green-50/30 transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
                                                    <Package size={20} />
                                                </div>
                                                <span className="font-bold text-gray-800 text-sm">{item.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 font-mono font-bold text-gray-600 text-xs">{formatRupiah(item.price)}</td>
                                        <td className="p-4 font-mono font-black text-green-600 text-xs">{formatRupiah(item.dp)}</td>
                                        <td className="p-4 font-mono font-bold text-orange-600 text-xs">{formatRupiah(item.tax)}</td>
                                        <td className="p-4">
                                            <div className="flex gap-1 flex-wrap">
                                                {(Array.isArray(item.tenors) ? item.tenors : JSON.parse(item.tenors || '[]')).map((t: any) => (
                                                    <span key={t} className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[9px] font-black uppercase">
                                                        {t} bln
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => openModalEdit(item)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                                                    <Edit size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* MODAL FORM */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
                        <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-black text-lg text-gray-900 uppercase tracking-tight">{editMode ? 'Edit Barang' : 'Tambah Katalog'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 bg-white rounded-full text-gray-400 hover:text-gray-900 shadow-sm border border-gray-100 transition-all"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSave} className="p-8 space-y-6">
                            <Input
                                label="Nama Barang / Jasa"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Masukkan nama barang"
                                required
                            />

                            <div className="grid grid-cols-2 gap-5">
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

                            <div className="space-y-3">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Opsi Tenor (Cicilan Bulan)</label>
                                <div className="flex flex-wrap gap-3">
                                    {[3, 6, 12, 18, 24, 36].map((t) => (
                                        <label key={t} className={`cursor-pointer px-4 py-2.5 rounded-xl border text-xs font-black transition-all flex items-center gap-2 ${formData.tenors.includes(t) ? 'bg-[#136f42] text-white border-[#136f42] shadow-lg shadow-green-900/20' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-green-200'}`}>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={formData.tenors.includes(t)}
                                                onChange={() => toggleTenor(t)}
                                            />
                                            {t} BLN
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button type="button" className="flex-1 py-4 text-sm font-bold text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-widest" onClick={() => setIsModalOpen(false)}>Batal</button>
                                <button type="submit" disabled={isSaving} className="flex-2 w-full bg-[#136f42] text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-green-900/20 hover:bg-[#0f5c35] active:scale-95 transition-all flex items-center justify-center gap-2">
                                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> Simpan Katalog</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
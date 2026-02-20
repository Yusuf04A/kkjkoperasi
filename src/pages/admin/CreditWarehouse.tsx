import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  ArrowLeft, Plus, Package, Edit, Trash2, 
  Search, X, Check, Save, RefreshCw 
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { formatRupiah, cn } from '../../lib/utils';
import toast from 'react-hot-toast';

export const CreditWarehouse = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [items, setItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        id: null,
        name: '',
        price: '',
        dp: '',
        tax: '',
        tenors: [] as number[]
    });

    const fetchCatalog = async () => {
        setIsLoading(true);
        const { data } = await supabase
            .from('credit_catalog')
            .select('*')
            .order('created_at', { ascending: false });
        setItems(data || []);
        setIsLoading(false);
    };

    useEffect(() => { fetchCatalog(); }, []);

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
                await supabase.from('credit_catalog').update(payload).eq('id', formData.id);
                toast.success("Barang diperbarui");
            } else {
                await supabase.from('credit_catalog').insert(payload);
                toast.success("Barang ditambahkan");
            }
            setIsModalOpen(false);
            fetchCatalog();
        } catch (error) {
            toast.error("Gagal menyimpan");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Hapus barang ini?")) return;
        await supabase.from('credit_catalog').delete().eq('id', id);
        toast.success("Terhapus");
        setItems(items.filter(i => i.id !== id));
    };

    const toggleTenor = (val: number) => {
        setFormData(prev => ({
            ...prev,
            tenors: prev.tenors.includes(val) 
                ? prev.tenors.filter(t => t !== val) 
                : [...prev.tenors, val].sort((a, b) => a - b)
        }));
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans">
            {/* HEADER - IDENTIK DENGAN ADMIN KABAR */}
            <div className="bg-white border-b sticky top-0 z-30 px-6 py-6 shadow-sm">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex flex-col gap-2">
                        <Link 
                            to="/admin/dashboard" 
                            className="flex items-center gap-2 text-gray-400 hover:text-[#136f42] transition-all group w-fit"
                        >
                            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="text-sm font-medium">Kembali</span>
                        </Link>

                        <div className="flex flex-col mt-1">
                            {/* Ukuran Font 2xl font-bold seperti contoh Kabar */}
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">Gudang Kredit</h1>
                            <p className="text-sm text-gray-500 font-medium mt-1">Manajemen katalog barang & cicilan</p>
                        </div>
                    </div>
                    
                    <button
                        onClick={openModalAdd}
                        className="bg-[#136f42] text-white text-xs font-black uppercase tracking-widest px-6 py-3.5 rounded-xl hover:bg-[#0f5c35] transition shadow-lg shadow-green-900/20 flex items-center justify-center gap-2 active:scale-95"
                    >
                        <Plus size={18} strokeWidth={3} /> Tambah Barang
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6">
                {/* SEARCH BAR */}
                <div className="relative mb-8 group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#136f42] transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Cari nama barang..."
                        className="w-full pl-14 pr-6 py-5 rounded-[1.5rem] border border-slate-200 focus:border-[#136f42] focus:ring-1 focus:ring-[#136f42] outline-none transition-all shadow-sm bg-white font-medium text-slate-600 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* TABLE SECTION */}
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50/50 text-gray-400 text-[11px] font-bold border-b border-gray-100 uppercase tracking-widest">
                                <tr>
                                    <th className="p-6">Nama Barang</th>
                                    <th className="p-6 text-center">Harga Cash</th>
                                    <th className="p-6 text-center">Wajib DP</th>
                                    <th className="p-6 text-center">Admin/Pajak</th>
                                    <th className="p-6 text-center">Opsi Tenor</th>
                                    <th className="p-6 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="p-24 text-center">
                                            <RefreshCw size={32} className="animate-spin text-[#136f42] mx-auto mb-3" />
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sinkronisasi Data...</span>
                                        </td>
                                    </tr>
                                ) : items.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase())).map((item) => (
                                    <tr key={item.id} className="hover:bg-green-50/30 transition-colors group">
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-[#136f42] border border-gray-100 shadow-sm group-hover:bg-white transition-all">
                                                    <Package size={20} />
                                                </div>
                                                {/* Font item name bold tapi ukuran proporsional */}
                                                <span className="font-bold text-slate-800 text-sm">{item.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-6 text-center font-bold text-slate-900 text-sm">{formatRupiah(item.price)}</td>
                                        <td className="p-6 text-center font-bold text-[#136f42] text-sm">{formatRupiah(item.dp)}</td>
                                        <td className="p-6 text-center font-bold text-orange-600 text-sm">{formatRupiah(item.tax)}</td>
                                        <td className="p-6 text-center">
                                            <div className="flex gap-1.5 flex-wrap justify-center">
                                                {item.tenors?.map((t: any) => (
                                                    <span key={t} className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold border border-blue-100 shadow-sm">
                                                        {t} Bln
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="flex justify-end gap-1.5">
                                                <button onClick={() => openModalEdit(item)} className="p-2.5 hover:bg-green-50 text-gray-400 hover:text-[#136f42] rounded-xl transition-all active:scale-90 border border-transparent hover:border-[#136f42]/20">
                                                    <Edit size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(item.id)} className="p-2.5 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-xl transition-all active:scale-90 border border-transparent hover:border-rose-100/20">
                                                    <Trash2 size={16} />
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
                <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white">
                            <div>
                                <h3 className="font-bold text-xl text-slate-900 tracking-tight">{editMode ? 'Edit Barang' : 'Tambah Katalog'}</h3>
                                <p className="text-xs text-gray-400 font-medium mt-1">Input data inventaris kredit</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-300"><X size={24} /></button>
                        </div>

                        <form onSubmit={handleSave} className="p-8 space-y-6">
                            <Input
                                label="Nama Barang"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Contoh: Sepeda Listrik"
                                required
                                className="rounded-xl border-gray-200 focus:border-[#136f42] focus:ring-[#136f42] font-bold text-sm"
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Harga Cash" type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} required className="rounded-xl text-sm" />
                                <Input label="Wajib DP" type="number" value={formData.dp} onChange={e => setFormData({ ...formData, dp: e.target.value })} required className="rounded-xl text-sm" />
                            </div>
                            <Input label="Biaya Admin/Pajak" type="number" value={formData.tax} onChange={e => setFormData({ ...formData, tax: e.target.value })} placeholder="0" className="rounded-xl text-sm" />

                            <div>
                                <label className="block text-[11px] font-bold text-gray-400 mb-3 uppercase tracking-wider">Opsi Tenor Tersedia</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[3, 6, 12, 18, 24, 36].map((t) => (
                                        <label key={t} className={`cursor-pointer px-4 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 ${formData.tenors.includes(t) ? 'bg-[#136f42] text-white border-[#136f42] shadow-lg shadow-green-900/20' : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-[#136f42]/30'}`}>
                                            <input type="checkbox" className="hidden" checked={formData.tenors.includes(t)} onChange={() => toggleTenor(t)} />
                                            {formData.tenors.includes(t) && <Check size={12} strokeWidth={4} />}
                                            {t} Bulan
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-6 flex gap-3">
                                <Button type="button" variant="outline" className="flex-1 rounded-xl font-bold border-gray-200 text-gray-400 text-xs" onClick={() => setIsModalOpen(false)}>Batal</Button>
                                <Button 
                                    type="submit" 
                                    className="flex-1 bg-[#136f42] hover:bg-[#0f5c35] text-white rounded-xl shadow-xl shadow-green-900/20 font-bold py-4 text-xs uppercase tracking-widest" 
                                    isLoading={isSaving}
                                >
                                    {!isSaving && <Save size={16} className="mr-2" />} {editMode ? 'Simpan' : 'Tambahkan'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <p className="text-center text-slate-300 text-[10px] font-medium mt-16 mb-8 uppercase tracking-[0.3em]">
                © 2026 Koperasi Pemasaran Karya Kita Jaya
            </p>
        </div>
    );
};
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { formatRupiah, cn } from '../../lib/utils';
import { 
    Plus, Pencil, ArrowLeft, Package, 
    Save, X, RefreshCw, Image as ImageIcon, 
    Loader2, Clock, Check, Archive, CheckCircle, Calendar, Eye, EyeOff
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { format } from "date-fns";
import { id as indonesia } from "date-fns/locale";

export const AdminTokoKatalog = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'katalog' | 'pesanan'>('pesanan');
    const [products, setProducts] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const [formData, setFormData] = useState<any>({
        name: '', price: 0, stock: 0, image_url: '', category: 'Sembako', is_active: true
    });
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        if (activeTab === 'katalog') fetchProducts();
        else fetchOrders();
    }, [activeTab]);

    const fetchProducts = async () => {
        setLoading(true);
        const { data } = await supabase.from('shop_products').select('*').order('name');
        setProducts(data || []);
        setLoading(false);
    };

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const { data: ordersData, error: ordersError } = await supabase
                .from('shop_orders')
                .select('*, shop_order_items(*)')
                .order('created_at', { ascending: false });

            if (ordersError) throw ordersError;

            const { data: profilesData } = await supabase
                .from('profiles')
                .select('id, full_name, member_id, tapro_balance');

            const combinedData = ordersData?.map(order => ({
                ...order,
                profiles: profilesData?.find(p => p.id === order.user_id)
            }));

            setOrders(combinedData || []);
        } catch (err: any) {
            toast.error("Gagal sinkronisasi antrean");
        } finally {
            setLoading(false);
        }
    };

    // --- LOGIC FORMAT HARGA (BARU) ---
    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Hapus semua karakter kecuali angka
        const rawValue = e.target.value.replace(/\D/g, '');
        setFormData({ ...formData, price: Number(rawValue) });
    };

    const toggleProductStatus = async (id: string, currentStatus: boolean) => {
        const toastId = toast.loading('Memperbarui status produk...');
        try {
            const { error } = await supabase
                .from('shop_products')
                .update({ is_active: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            toast.success(`Produk berhasil ${!currentStatus ? 'diaktifkan' : 'dinonaktifkan'}`, { id: toastId });
            fetchProducts();
        } catch (err: any) {
            toast.error("Gagal memperbarui status", { id: toastId });
        }
    };

    const handleUpdateOrderStatus = async (order: any, newStatus: string) => {
        const confirm = window.confirm(`Update status pesanan ini menjadi ${newStatus.replace('_', ' ')}?`);
        if (!confirm) return;
        const toastId = toast.loading(`Memproses...`);

        try {
            if (newStatus === 'siap_diambil') {
                const currentBalance = order.profiles?.tapro_balance || 0;
                if (currentBalance < order.total_amount) throw new Error("Saldo anggota tidak cukup");

                await supabase.from('profiles').update({ tapro_balance: currentBalance - order.total_amount }).eq('id', order.user_id);

                const { data: items } = await supabase.from('shop_order_items').select('product_id, quantity').eq('order_id', order.id);
                if (items) {
                    for (const item of items) {
                        const { data: p } = await supabase.from('shop_products').select('stock').eq('id', item.product_id).single();
                        if (p) await supabase.from('shop_products').update({ stock: Math.max(0, p.stock - item.quantity) }).eq('id', item.product_id);
                    }
                }
                await supabase.from('transactions').update({ status: 'success' }).eq('user_id', order.user_id).ilike('description', `%${order.id.slice(0,8)}%`);
            }
            if (newStatus === 'ditolak') {
                await supabase.from('transactions').update({ status: 'failed' }).eq('user_id', order.user_id).ilike('description', `%${order.id.slice(0,8)}%`);
            }
            const { error } = await supabase.from('shop_orders').update({ status: newStatus }).eq('id', order.id);
            if (error) throw error;
            toast.success(`Pesanan diperbarui`, { id: toastId });
            fetchOrders();
        } catch (err: any) { toast.error(err.message, { id: toastId }); }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        const filePath = `${Math.random()}.${file.name.split('.').pop()}`;
        const { error } = await supabase.storage.from('shop_products').upload(filePath, file);
        if (!error) {
            const { data } = supabase.storage.from('shop_products').getPublicUrl(filePath);
            setFormData({ ...formData, image_url: data.publicUrl });
        }
        setUploading(false);
    };

    const handleSaveProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        const toastId = toast.loading("Menyimpan...");
        try {
            if (editingId) await supabase.from('shop_products').update(formData).eq('id', editingId);
            else await supabase.from('shop_products').insert([formData]);
            setIsModalOpen(false);
            fetchProducts();
            toast.success('Katalog diperbarui', { id: toastId });
        } catch (err) { toast.error("Gagal simpan", { id: toastId }); }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50 font-sans text-slate-900">
            {/* Header Konsisten Admin */}
            <div className="mb-6">
                <Link to="/admin/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-kkj-blue mb-4 w-fit transition-colors text-sm font-medium">
                    <ArrowLeft size={18} /> Kembali
                </Link>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">Manajemen Toko</h1>
                        <p className="text-sm text-gray-500">Verifikasi Belanja & Kontrol Inventaris Anggota</p>
                    </div>
                    <button 
                        onClick={() => activeTab === 'pesanan' ? fetchOrders() : fetchProducts()} 
                        className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-all active:scale-95"
                    >
                        <RefreshCw size={20} className={cn(loading && "animate-spin text-kkj-blue")} />
                    </button>
                </div>
            </div>

            {/* Tab Navigation Konsisten */}
            <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto no-scrollbar">
                <button
                    onClick={() => setActiveTab('pesanan')}
                    className={`pb-3 px-4 font-bold text-sm transition-colors whitespace-nowrap relative flex items-center gap-2 ${activeTab === 'pesanan' ? 'text-kkj-blue' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <Clock size={16} /> Menunggu Konfirmasi
                    {activeTab === 'pesanan' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-kkj-blue rounded-t-full"></div>}
                </button>

                <button
                    onClick={() => setActiveTab('katalog')}
                    className={`pb-3 px-4 font-bold text-sm transition-colors whitespace-nowrap relative flex items-center gap-2 ${activeTab === 'katalog' ? 'text-kkj-blue' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <Archive size={16} /> Gudang Stok
                    {activeTab === 'katalog' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-kkj-blue rounded-t-full"></div>}
                </button>
            </div>

            {/* Content Section */}
            <div className="space-y-4">
                {loading ? (
                    <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-kkj-blue" /></div>
                ) : activeTab === 'pesanan' ? (
                    /* VIEW ANTREAN PESANAN */
                    <div className="grid grid-cols-1 gap-4">
                        {orders.length === 0 ? (
                            <div className="bg-white p-12 rounded-xl border border-dashed border-gray-300 text-center text-gray-500 flex flex-col items-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3 text-gray-300">
                                    <Clock size={32} />
                                </div>
                                <p>Tidak ada data pesanan di antrean.</p>
                            </div>
                        ) : (
                            orders.map((o) => (
                                <div key={o.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-6 hover:shadow-md transition-all duration-300">
                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-blue-50 text-kkj-blue rounded-full flex items-center justify-center shadow-inner">
                                                    <Package size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold">{o.profiles?.full_name || 'Member'}</h3>
                                                    <p className="text-xs text-gray-500 font-mono tracking-wider uppercase">{o.profiles?.member_id}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", 
                                                    o.status === 'diproses' ? 'bg-orange-100 text-orange-700' : 
                                                    o.status === 'siap_diambil' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700')}>
                                                    {o.status.replace('_', ' ')}
                                                </span>
                                                <p className="text-[10px] text-gray-400 mt-1 flex items-center justify-end gap-1">
                                                    <Calendar size={10} /> {format(new Date(o.created_at), 'dd MMM yyyy, HH:mm', { locale: indonesia })}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                            <div>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Tagihan Saldo Tapro</p>
                                                <p className="text-xl font-bold text-kkj-blue">{formatRupiah(o.total_amount)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Metode Pickup</p>
                                                <p className="text-sm font-bold text-gray-700 flex items-center gap-1.5 mt-1">
                                                    <CheckCircle size={14} className="text-green-500" /> Self Pickup (Tapro Pay)
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col justify-center gap-3 md:border-l md:pl-6 border-gray-100 min-w-[200px]">
                                            {o.status === 'diproses' ? (
                                                <>
                                                    <button onClick={() => handleUpdateOrderStatus(o, 'siap_diambil')} className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95">
                                                        <Check size={18} /> Setujui
                                                    </button>
                                                    <button onClick={() => handleUpdateOrderStatus(o, 'ditolak')} className="w-full py-3 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95">
                                                        <X size={18} /> Tolak
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex flex-col items-center justify-center text-center">
                                                    <CheckCircle size={24} className="text-green-500 mb-2" />
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">Pesanan<br/>{o.status.replace('_', ' ')}</p>
                                                </div>
                                            )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    /* VIEW KATALOG GUDANG STOK */
                    <div className="space-y-6">
                        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                                <Archive size={18} className="text-kkj-blue" /> Ketersediaan Stok Barang
                            </h3>
                            <button onClick={() => { setEditingId(null); setFormData({name:'', price:0, stock:0, image_url:'', category:'Sembako', is_active:true}); setIsModalOpen(true); }} className="bg-kkj-blue text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-opacity-90 shadow-md transition-all active:scale-95">
                                <Plus size={16} /> Tambah Stok
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {products.map((p) => (
                                <div key={p.id} className={cn("bg-white rounded-xl p-5 border shadow-sm flex gap-4 transition-all duration-300", !p.is_active ? "opacity-60 grayscale border-dashed" : "hover:border-kkj-blue/50")}>
                                    <div className="relative shrink-0">
                                        <img src={p.image_url} className="w-20 h-20 rounded-lg object-cover border border-gray-100 shadow-inner" />
                                        {(!p.is_active || p.stock === 0) && (
                                            <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center">
                                                <span className="text-[8px] text-white font-black uppercase tracking-tighter">
                                                    {!p.is_active ? 'Nonaktif' : 'Habis'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between py-0.5">
                                            <div>
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-[9px] font-bold text-kkj-blue bg-blue-50 px-2 py-0.5 rounded uppercase">{p.category}</span>
                                                    <span className={cn("text-[9px] font-bold uppercase", p.stock < 5 && p.is_active ? "text-red-500 animate-pulse" : "text-green-600")}>Stok: {p.stock}</span>
                                                </div>
                                                <h3 className="text-sm font-bold leading-tight line-clamp-1">{p.name}</h3>
                                                <p className="text-xs font-medium text-gray-500 mt-1">{formatRupiah(p.price)}</p>
                                            </div>
                                            <div className="flex gap-1.5 mt-3">
                                                <button 
                                                    onClick={() => { setFormData(p); setEditingId(p.id); setIsModalOpen(true); }} 
                                                    className="flex-1 bg-gray-50 py-2 rounded-lg text-[10px] font-bold text-gray-500 hover:bg-kkj-blue hover:text-white transition-all flex items-center justify-center gap-1 border border-gray-100"
                                                >
                                                    <Pencil size={12}/> Edit
                                                </button>
                                                <button 
                                                    onClick={() => toggleProductStatus(p.id, p.is_active)}
                                                    className={cn("px-3 py-2 rounded-lg transition-all border", 
                                                        p.is_active ? "bg-white text-rose-500 border-rose-100 hover:bg-rose-50" : "bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600")}
                                                    title={p.is_active ? "Nonaktifkan Produk" : "Aktifkan Produk"}
                                                >
                                                    {p.is_active ? <EyeOff size={14}/> : <Eye size={14}/>}
                                                </button>
                                            </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* --- MODAL EDIT/TAMBAH DENGAN LABEL & FORMAT RUPIAH --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <form onSubmit={handleSaveProduct} className="bg-white w-full max-w-lg rounded-2xl p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-300 border border-gray-200">
                        <div className="flex justify-between items-center border-b pb-4">
                            <h2 className="text-xl font-bold text-gray-900">{editingId ? 'Edit Stok Barang' : 'Tambah Produk Baru'}</h2>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-red-500 transition-colors"><X size={20}/></button>
                        </div>
                        
                        <div className="space-y-5">
                            {/* Upload Gambar */}
                            <label className="block w-full h-40 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors group relative overflow-hidden">
                                <input type="file" className="hidden" onChange={handleFileUpload} />
                                {formData.image_url ? (
                                    <>
                                        <img src={formData.image_url} className="w-full h-full object-contain p-2" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold">Ubah Foto</div>
                                    </>
                                ) : (
                                    <div className="text-center group-hover:scale-105 transition-transform">
                                        <ImageIcon className="mx-auto text-gray-300 mb-2" size={32}/>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pilih Foto Produk</p>
                                    </div>
                                )}
                            </label>

                            {/* Input Nama */}
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1.5 block">Nama Produk</label>
                                <input 
                                    type="text" 
                                    required 
                                    placeholder="Contoh: Beras 5kg" 
                                    value={formData.name} 
                                    onChange={e => setFormData({...formData, name: e.target.value})} 
                                    className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-lg font-medium outline-none focus:bg-white focus:ring-2 focus:ring-kkj-blue/20 transition-all text-slate-800" 
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Input Harga */}
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1.5 block">Harga Produk</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Rp</span>
                                        <input 
                                            type="text" 
                                            required 
                                            placeholder="0" 
                                            value={formData.price ? formData.price.toLocaleString('id-ID') : ''} 
                                            onChange={handlePriceChange} 
                                            className="w-full bg-gray-50 border border-gray-200 pl-12 pr-4 py-3.5 rounded-lg font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-kkj-blue/20 transition-all" 
                                        />
                                    </div>
                                </div>

                                {/* Input Stok */}
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1.5 block">Stok</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Package size={16}/></span>
                                        <input 
                                            type="number" 
                                            required 
                                            placeholder="0" 
                                            value={formData.stock || ''} 
                                            onChange={e => setFormData({...formData, stock: Number(e.target.value)})} 
                                            className="w-full bg-gray-50 border border-gray-200 pl-10 pr-4 py-3.5 rounded-lg font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-kkj-blue/20 transition-all" 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button type="submit" className="flex-1 bg-kkj-blue text-white py-3.5 rounded-xl font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
                                <Save size={18} /> Simpan Data
                            </button>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 border border-gray-200 rounded-xl font-bold text-gray-400 hover:bg-gray-50 transition-all text-xs uppercase">
                                Batal
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};
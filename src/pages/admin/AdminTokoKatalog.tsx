import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { formatRupiah, cn } from '../../lib/utils';
import { 
    Plus, Pencil, ArrowLeft, Package, 
    Save, X, RefreshCw, Image as ImageIcon, 
    Loader2, Clock, Check, Archive, CheckCircle, Calendar, Eye, EyeOff, ListOrdered, ShoppingBag, Search, History, Phone, MapPin, AlertTriangle, Info
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { format } from "date-fns";
import { id as indonesia } from "date-fns/locale";
// 🔥 IMPORT LIBRARY KOMPRESI
import imageCompression from 'browser-image-compression'; 

export const AdminTokoKatalog = () => {
    const navigate = useNavigate();
    
    // TAB: 3 Opsi (Pesanan, Riwayat, Katalog)
    const [activeTab, setActiveTab] = useState<'pesanan' | 'riwayat' | 'katalog'>('pesanan');
    
    const [products, setProducts] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // --- STATE UNTUK CUSTOM MODAL CONFIRMATION ---
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        type: 'approve' | 'reject';
        order: any;
    }>({
        isOpen: false,
        type: 'approve',
        order: null
    });
    
    const [formData, setFormData] = useState<any>({
        name: '', price: 0, stock: 0, image_url: '', category: '', is_active: true
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

            const { data: productsData } = await supabase
                .from('shop_products')
                .select('id, name');

            const combinedData = ordersData?.map(order => ({
                ...order,
                profiles: profilesData?.find(p => p.id === order.user_id),
                shop_order_items: order.shop_order_items?.map((item: any) => ({
                    ...item,
                    product_name: productsData?.find(p => p.id === item.product_id)?.name || 'Produk dihapus'
                }))
            }));

            setOrders(combinedData || []);
        } catch (err: any) {
            toast.error("Gagal sinkronisasi antrean");
        } finally {
            setLoading(false);
        }
    };

    const pendingOrders = orders.filter(o => o.status === 'diproses' || o.status === 'pending');
    const historyOrders = orders.filter(o => o.status !== 'diproses' && o.status !== 'pending');

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/\D/g, '');
        setFormData({ ...formData, price: Number(rawValue) });
    };

    const toggleProductStatus = async (id: string, currentStatus: boolean) => {
        const toastId = toast.loading('Memperbarui status...');
        try {
            const { error } = await supabase.from('shop_products').update({ is_active: !currentStatus }).eq('id', id);
            if (error) throw error;
            toast.success(`Status produk diperbarui`, { id: toastId });
            fetchProducts();
        } catch (err: any) { toast.error("Gagal memperbarui status", { id: toastId }); }
    };

    const handleConfirmAction = async () => {
        const { order, type } = confirmModal;
        if (!order) return;

        const newStatus = type === 'approve' ? 'siap_diambil' : 'ditolak';
        const toastId = toast.loading(`Memproses ${type === 'approve' ? 'persetujuan' : 'pembatalan'}...`);

        try {
            if (newStatus === 'siap_diambil') {
                const { data: items } = await supabase.from('shop_order_items').select('product_id, quantity').eq('order_id', order.id);
                if (items) {
                    for (const item of items) {
                        const { data: p } = await supabase.from('shop_products').select('stock').eq('id', item.product_id).single();
                        if (p) await supabase.from('shop_products').update({ stock: Math.max(0, p.stock - item.quantity) }).eq('id', item.product_id);
                    }
                }
                await supabase.from('transactions').update({ status: 'success' }).eq(
                    'user_id', order.user_id).ilike('description', `%${order.id.slice(0,8)}%`
                );
            }
            
            if (newStatus === 'ditolak') {
                const currentBalance = order.profiles?.tapro_balance || 0;
                await supabase.from('profiles').update({ tapro_balance: currentBalance + order.total_amount }).eq('id', order.user_id);
                await supabase.from('transactions').update({ status: 'failed' }).eq(
                    'user_id', order.user_id).ilike('description', `%${order.id.slice(0,8)}%`
                );
            }
            
            const { error } = await supabase.from('shop_orders').update({ status: newStatus }).eq('id', order.id);
            if (error) throw error;
            
            toast.success(`Pesanan berhasil diperbarui`, { id: toastId });
            setConfirmModal({ isOpen: false, type: 'approve', order: null });
            fetchOrders();
        } catch (err: any) { 
            toast.error(err.message, { id: toastId }); 
        }
    };

    // --- 🔥 FUNGSI UPLOAD DENGAN KOMPRESI OTOMATIS 🔥 ---
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const toastId = toast.loading("Mengompres & Mengunggah...");

        try {
            // Konfigurasi Kompresi
            const options = {
                maxSizeMB: 1,           
                maxWidthOrHeight: 1024, 
                useWebWorker: true,
            };

            const compressedFile = await imageCompression(file, options);

            const filePath = `products/${Date.now()}.${file.name.split('.').pop()}`;
            const { error: uploadError } = await supabase.storage
                .from('shop_products')
                .upload(filePath, compressedFile);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('shop_products').getPublicUrl(filePath);
            setFormData({ ...formData, image_url: data.publicUrl });
            toast.success("Foto produk berhasil diproses", { id: toastId });

        } catch (err: any) {
            toast.error("Gagal memproses gambar: " + err.message, { id: toastId });
        } finally {
            setUploading(false);
        }
    };

    const handleSaveProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        const toastId = toast.loading("Menyimpan...");
        try {
            if (editingId) await supabase.from('shop_products').update(formData).eq('id', editingId);
            else await supabase.from('shop_products').insert([formData]);
            setIsModalOpen(false);
            fetchProducts();
            toast.success('Berhasil menyimpan data', { id: toastId });
        } catch (err) { toast.error("Gagal menyimpan data", { id: toastId }); }
    };

    const renderOrderCard = (o: any, isHistory: boolean) => (
        <div key={o.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-6 hover:shadow-md transition-all duration-300">
            <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-50 text-[#136f42] rounded-full flex items-center justify-center shadow-inner">
                            <ShoppingBag size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">{o.profiles?.full_name || 'Anggota'}</h3>
                            <p className="text-xs text-gray-500 font-mono tracking-wider">{o.profiles?.member_id}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", 
                            o.status === 'diproses' ? 'bg-orange-100 text-orange-700' : 
                            o.status === 'ditolak' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700')}>
                            {o.status.replace('_', ' ')}
                        </span>
                        <p className="text-[10px] text-gray-400 mt-1 flex items-center justify-end gap-1">
                            <Calendar size={10} /> {format(new Date(o.created_at), 'dd MMM yyyy, HH:mm', { locale: indonesia })}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Tagihan Belanja</p>
                        <p className="text-xl font-bold text-[#136f42]">{formatRupiah(o.total_amount)}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Metode Pengiriman</p>
                        <p className="text-sm font-bold text-gray-700 flex items-center gap-1.5 mt-1">
                            {o.delivery_method?.includes('Diantar') ? <><Package size={14} className="text-[#136f42]" /> Diantar Ekspedisi</> : <><CheckCircle size={14} className="text-green-500" /> Diambil di Toko</>}
                        </p>
                    </div>
                </div>

                {o.delivery_method?.includes('Diantar') && (
                    <div className="bg-green-50/30 p-4 rounded-xl border border-green-100 space-y-3">
                        <div className="flex items-start gap-2">
                            <Phone size={14} className="text-[#136f42] mt-0.5 shrink-0" />
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase">Nomor WA Pengiriman</p>
                                <p className="text-sm font-semibold text-slate-800">{o.delivery_phone || 'Tidak dicantumkan'}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <MapPin size={14} className="text-[#136f42] mt-0.5 shrink-0" />
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase">Alamat Pengiriman</p>
                                <p className="text-sm font-medium text-slate-800 leading-snug">{o.delivery_address || 'Tidak dicantumkan'}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white border border-gray-100 p-4 rounded-xl">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <ListOrdered size={12}/> Daftar Barang Dipesan
                    </h4>
                    <div className="space-y-2">
                        {o.shop_order_items?.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-black text-[#136f42] bg-green-50 px-2 py-0.5 rounded">{item.quantity}x</span>
                                    <span className="font-medium text-gray-700">{item.product_name}</span>
                                </div>
                                <span className="font-bold text-gray-500">{formatRupiah((item.price_at_purchase || 0) * item.quantity)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {!isHistory && (
                <div className="flex flex-col justify-center gap-3 md:border-l md:pl-6 border-gray-100 min-w-[200px]">
                    <button onClick={() => setConfirmModal({ isOpen: true, type: 'approve', order: o })} className="w-full py-4 bg-[#136f42] text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-green-900/10 active:scale-95 transition-all">
                        Setujui Pesanan
                    </button>
                    <button onClick={() => setConfirmModal({ isOpen: true, type: 'reject', order: o })} className="w-full py-4 bg-white text-rose-600 border border-rose-100 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">
                        Tolak & Refund
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50 font-sans text-slate-900 pb-20">
            <div className="mb-6">
                <Link to="/admin/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-[#136f42] mb-4 w-fit transition-all text-sm font-medium">
                    <ArrowLeft size={18} /> Kembali
                </Link>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Manajemen Toko</h1>
                        <p className="text-sm text-gray-500">Verifikasi belanja & kontrol inventaris gudang</p>
                    </div>
                    <button onClick={() => activeTab === 'katalog' ? fetchProducts() : fetchOrders()} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-all active:scale-95">
                        <RefreshCw size={20} className={cn(loading && "animate-spin text-[#136f42]")} />
                    </button>
                </div>
            </div>

            <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto no-scrollbar">
                {(['pesanan', 'riwayat', 'katalog'] as const).map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={cn("pb-3 px-6 font-bold text-sm relative transition-colors whitespace-nowrap", activeTab === tab ? "text-[#136f42]" : "text-gray-400")}>
                        {tab === 'pesanan' ? 'Menunggu Konfirmasi' : tab === 'riwayat' ? 'Riwayat Transaksi' : 'Gudang Stok'}
                        {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#136f42] rounded-t-full"></div>}
                    </button>
                ))}
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-[#136f42]" /></div>
                ) : activeTab === 'pesanan' ? (
                    <div className="grid grid-cols-1 gap-4">
                        {pendingOrders.length === 0 ? <div className="bg-white p-20 rounded-[2rem] border border-dashed border-gray-200 text-center text-gray-400 font-medium italic"><Info size={48} className="mx-auto mb-4 opacity-20" />Tidak ada data pesanan di antrean.</div> : pendingOrders.map(o => renderOrderCard(o, false))}
                    </div>
                ) : activeTab === 'riwayat' ? (
                    <div className="grid grid-cols-1 gap-4">
                        {historyOrders.length === 0 ? <div className="bg-white p-20 rounded-[2rem] border border-dashed border-gray-200 text-center text-gray-400 font-medium italic"><Archive size={48} className="mx-auto mb-4 opacity-20" />Belum ada riwayat pesanan.</div> : historyOrders.map(o => renderOrderCard(o, true))}
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm gap-4">
                            <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                <Archive size={18} className="text-[#136f42]" /> Stok Barang Gudang
                            </h3>
                            <div className="flex w-full md:w-auto gap-2">
                                <div className="relative flex-1 md:w-64 group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#136f42] transition-colors" size={16} />
                                    <input type="text" placeholder="Cari barang..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#136f42]/20 outline-none" />
                                </div>
                                <button onClick={() => { setEditingId(null); setFormData({name:'', price:0, stock:0, image_url:'', category:'', is_active:true}); setIsModalOpen(true); }} className="bg-[#136f42] text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 shadow-lg shadow-green-900/20 active:scale-95">
                                    <Plus size={16} /> <span>Tambah Stok</span>
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filteredProducts.map((p) => (
                                <div key={p.id} className={cn("bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex gap-4 transition-all hover:shadow-md", !p.is_active && "opacity-60 grayscale border-dashed")}>
                                    <img src={p.image_url} className="w-20 h-20 rounded-xl object-cover border border-slate-100 shadow-inner" alt={p.name} />
                                    <div className="flex-1 flex flex-col justify-between py-0.5">
                                        <div>
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-[8px] font-black text-[#136f42] bg-green-50 px-2 py-0.5 rounded border border-green-100 uppercase truncate max-w-[80px]">{p.category || 'Tanpa Kategori'}</span>
                                                <span className={cn("text-[9px] font-black uppercase", p.stock < 5 && p.is_active ? "text-red-500 animate-pulse" : "text-slate-400")}>Stok: {p.stock}</span>
                                            </div>
                                            <h3 className="text-sm font-bold leading-tight line-clamp-1">{p.name}</h3>
                                            <p className="text-xs font-black text-slate-800 mt-1 tracking-tighter">{formatRupiah(p.price)}</p>
                                        </div>
                                        <div className="flex gap-1.5 mt-3">
                                            <button onClick={() => { setFormData(p); setEditingId(p.id); setIsModalOpen(true); }} className="flex-1 bg-slate-50 py-2 rounded-lg text-[10px] font-black text-slate-500 hover:bg-[#136f42] hover:text-white transition-all uppercase tracking-widest border border-slate-100">Edit</button>
                                            <button onClick={() => toggleProductStatus(p.id, p.is_active)} className={cn("px-3 py-2 rounded-lg transition-all border", p.is_active ? "bg-white text-rose-500 border-rose-100" : "bg-emerald-500 text-white border-emerald-500")}>
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

            {/* MODAL TAMBAH/EDIT PRODUK */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                    <form onSubmit={handleSaveProduct} className="bg-white w-full max-w-lg rounded-[2rem] p-8 shadow-2xl space-y-6 animate-in zoom-in-95 border border-white/20">
                        <div className="flex justify-between items-center border-b pb-4">
                            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">{editingId ? 'Ubah Data Produk' : 'Tambah Produk Baru'}</h2>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-rose-500 transition-colors"><X size={20}/></button>
                        </div>
                        
                        <div className="space-y-4">
                            <label className="block w-full h-40 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-green-50/30 transition-all group overflow-hidden">
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                {formData.image_url ? (
                                    <img src={formData.image_url} className="w-full h-full object-contain p-2 animate-in fade-in" alt="Preview Produk" />
                                ) : (
                                    <div className="text-center group-hover:scale-105 transition-transform duration-300">
                                        <ImageIcon className="mx-auto text-slate-300 mb-2" size={32}/>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pilih Foto Produk</p>
                                        <p className="text-[9px] text-slate-300 mt-1 font-bold italic">Otomatis Dikompres</p>
                                    </div>
                                )}
                            </label>
                            <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Nama Produk</label><input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-3.5 rounded-xl font-bold text-slate-800 outline-none focus:bg-white focus:border-[#136f42] transition-all" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Harga Jual</label><input type="text" required value={formData.price ? formData.price.toLocaleString('id-ID') : ''} onChange={handlePriceChange} className="w-full bg-slate-50 border border-slate-100 p-3.5 rounded-xl font-bold text-slate-800 outline-none focus:bg-white focus:border-[#136f42] transition-all" /></div>
                                <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Stok Awal</label><input type="number" required value={formData.stock || ''} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-100 p-3.5 rounded-xl font-bold text-slate-800 outline-none focus:bg-white focus:border-[#136f42] transition-all" /></div>
                            </div>
                            <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Kategori</label><input required placeholder="Contoh: Sembako" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-3.5 rounded-xl font-bold text-slate-800 outline-none focus:bg-white focus:border-[#136f42] transition-all" /></div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t text-center">
                            <button type="submit" disabled={uploading} className="flex-1 bg-[#136f42] text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-green-900/20 active:scale-95 transition-all disabled:opacity-50">
                                {editingId ? 'Perbarui Data' : 'Simpan Katalog'}
                            </button>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 border border-slate-100 rounded-xl font-black text-slate-300 text-[10px] uppercase tracking-widest">Batal</button>
                        </div>
                    </form>
                </div>
            )}

            {/* --- CUSTOM POPUP MODAL CONFIRMATION --- */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95 duration-200 border border-white/20 text-center">
                        <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4", confirmModal.type === 'approve' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600')}>
                            {confirmModal.type === 'approve' ? <CheckCircle size={32} /> : <AlertTriangle size={32} />}
                        </div>
                        
                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-2">
                            {confirmModal.type === 'approve' ? 'Konfirmasi Pesanan' : 'Batalkan Pesanan'}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed mb-8">
                            {confirmModal.type === 'approve' ? (
                                <>Pesanan akan ditandai <b>Siap Diambil</b> dan stok barang akan dipotong secara otomatis.</>
                            ) : (
                                <>Pesanan akan dibatalkan dan saldo Tapro sebesar <b>{formatRupiah(confirmModal.order.total_amount)}</b> akan dikembalikan ke anggota.</>
                            )}
                        </p>

                        <div className="grid grid-cols-2 gap-3 text-center">
                            <button onClick={() => setConfirmModal({ isOpen: false, type: 'approve', order: null })} className="py-3.5 bg-slate-100 text-slate-600 font-black rounded-2xl text-[10px] uppercase tracking-widest active:scale-95 transition-transform">
                                Batal
                            </button>
                            <button onClick={handleConfirmAction} className={cn("py-3.5 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-transform", confirmModal.type === 'approve' ? 'bg-[#136f42] shadow-green-900/20' : 'bg-rose-600 shadow-rose-900/20')}>
                                Ya, {confirmModal.type === 'approve' ? 'Setujui' : 'Refund'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
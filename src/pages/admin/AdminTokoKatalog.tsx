import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { formatRupiah, cn } from '../../lib/utils';
import { 
    Plus, Pencil, Trash2, ArrowLeft, Package, 
    Save, X, Search, RefreshCw, Image as ImageIcon, 
    Loader2, ShoppingCart, Check, Ban, Clock, PackageCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

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

    // 🔥 FIX QUERY: Menarik data pesanan secara mandiri terlebih dahulu untuk menghindari error relasi
    const fetchOrders = async () => {
        setLoading(true);
        try {
            // Kita tarik data orders dan profiles secara terpisah jika relasi join gagal
            const { data: ordersData, error: ordersError } = await supabase
                .from('shop_orders')
                .select('*')
                .order('created_at', { ascending: false });

            if (ordersError) throw ordersError;

            // Tarik data profil untuk mencocokkan nama pengguna
            const { data: profilesData } = await supabase
                .from('profiles')
                .select('id, full_name, member_id, tapro_balance');

            // Gabungkan data secara manual di frontend untuk keamanan data
            const combinedData = ordersData?.map(order => ({
                ...order,
                profiles: profilesData?.find(p => p.id === order.user_id)
            }));

            setOrders(combinedData || []);
        } catch (err: any) {
            console.error("Fetch Error:", err.message);
            toast.error("Gagal sinkronisasi antrean");
        } finally {
            setLoading(false);
        }
    };

    // LOGIKA APPROVE/REJECT
    const handleUpdateOrderStatus = async (order: any, newStatus: string) => {
        const toastId = toast.loading(`Sedang memperbarui...`);
        try {
            if (newStatus === 'siap_diambil') {
                const currentBalance = order.profiles?.tapro_balance || 0;
                if (currentBalance < order.total_amount) throw new Error("Saldo anggota tidak cukup");

                // 1. Potong Saldo Tapro
                const { error: balanceErr } = await supabase.from('profiles')
                    .update({ tapro_balance: currentBalance - order.total_amount })
                    .eq('id', order.user_id);
                if (balanceErr) throw balanceErr;

                // 2. Berhasilkan Transaksi
                await supabase.from('transactions').update({ status: 'success' })
                    .eq('user_id', order.user_id).ilike('description', `%${order.id.slice(0,8)}%`);
            }

            if (newStatus === 'ditolak') {
                await supabase.from('transactions').update({ status: 'failed' })
                    .eq('user_id', order.user_id).ilike('description', `%${order.id.slice(0,8)}%`);
            }

            // 3. Update Status Utama
            const { error: orderErr } = await supabase.from('shop_orders')
                .update({ status: newStatus }).eq('id', order.id);
            if (orderErr) throw orderErr;

            toast.success("Antrean diperbarui", { id: toastId });
            fetchOrders();
        } catch (err: any) {
            toast.error(err.message, { id: toastId });
        }
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
        try {
            if (editingId) await supabase.from('shop_products').update(formData).eq('id', editingId);
            else await supabase.from('shop_products').insert([formData]);
            setIsModalOpen(false);
            fetchProducts();
            toast.success('Stok diperbarui');
        } catch (err) { toast.error("Gagal simpan"); }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 text-slate-900 font-sans">
            {/* STICKY HEADER */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 shadow-sm">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 w-full">
                        <button onClick={() => navigate('/admin/dashboard')} className="p-2 hover:bg-slate-100 rounded-xl border border-slate-200 text-slate-500"><ArrowLeft size={20} /></button>
                        <div>
                            <h1 className="text-xl font-[1000] uppercase tracking-tight flex items-center gap-2">
                                <Package className="text-[#003366]" size={24} /> Toko Center
                            </h1>
                            <div className="flex gap-4 mt-2">
                                <button onClick={() => setActiveTab('pesanan')} className={cn("text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all", activeTab === 'pesanan' ? "border-[#003366] text-[#003366]" : "border-transparent text-slate-400")}>Antrean Pesanan</button>
                                <button onClick={() => setActiveTab('katalog')} className={cn("text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all", activeTab === 'katalog' ? "border-[#003366] text-[#003366]" : "border-transparent text-slate-400")}>Gudang Stok</button>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={fetchOrders} className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50"><RefreshCw size={18} className={cn(loading && "animate-spin")} /></button>
                        {activeTab === 'katalog' && (
                            <button onClick={() => { setEditingId(null); setFormData({name:'', price:0, stock:0, image_url:'', category:'Sembako', is_active:true}); setIsModalOpen(true); }} className="bg-[#003366] text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2"><Plus size={18} /> Tambah</button>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6">
                {activeTab === 'pesanan' ? (
                    /* VIEW ANTREAN PESANAN */
                    <div className="space-y-4">
                        {loading ? <div className="text-center py-20 font-bold text-slate-300 uppercase tracking-widest">Memuat Antrean...</div> : orders.length === 0 ? (
                            <div className="bg-white rounded-[2.5rem] p-20 text-center border-2 border-dashed">
                                <ShoppingCart size={48} className="mx-auto text-slate-200 mb-4" />
                                <p className="text-sm font-black text-slate-400 uppercase">Antrean Kosong</p>
                            </div>
                        ) : (
                            orders.map((o) => (
                                <div key={o.id} className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                                    <div className="flex items-center gap-4 w-full md:w-auto">
                                        <div className="p-4 bg-blue-50 text-[#003366] rounded-2xl"><Clock size={24} /></div>
                                        <div>
                                            <h4 className="text-sm font-[1000] uppercase tracking-tight">{o.profiles?.full_name || 'User Tanpa Nama'}</h4>
                                            <p className="text-[10px] font-black text-slate-400 uppercase">{o.profiles?.member_id || 'ID TIDAK TERDETEKSI'}</p>
                                            <span className={cn("inline-block mt-2 text-[8px] font-black px-2 py-0.5 rounded uppercase", 
                                                o.status === 'diproses' ? "bg-amber-100 text-amber-600" : 
                                                o.status === 'siap_diambil' ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600")}>
                                                {o.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 px-6 py-4 rounded-2xl flex-1 w-full text-center md:text-left border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Tagihan Saldo Tapro</p>
                                        <p className="text-lg font-black text-[#003366]">{formatRupiah(o.total_amount)}</p>
                                    </div>
                                    <div className="flex gap-2 w-full md:w-auto">
                                        {o.status === 'diproses' ? (
                                            <>
                                                <button onClick={() => handleUpdateOrderStatus(o, 'siap_diambil')} className="flex-1 md:flex-none bg-[#10B981] text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase flex items-center gap-2 shadow-sm"><Check size={16}/> Approve</button>
                                                <button onClick={() => handleUpdateOrderStatus(o, 'ditolak')} className="flex-1 md:flex-none bg-white border border-rose-200 text-rose-500 px-6 py-3 rounded-xl font-black text-[10px] uppercase flex items-center gap-2"><Ban size={16}/> Reject</button>
                                            </>
                                        ) : o.status === 'siap_diambil' ? (
                                            <button onClick={() => handleUpdateOrderStatus(o, 'selesai')} className="w-full bg-[#003366] text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase flex items-center gap-2"><PackageCheck size={16}/> Selesaikan Pickup</button>
                                        ) : (
                                            <span className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-1 px-4 py-2 bg-emerald-50 rounded-xl"><PackageCheck size={16}/> Selesai</span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    /* KATALOG VIEW */
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {products.map((p) => (
                            <div key={p.id} className="bg-white rounded-[2rem] p-5 border border-slate-200 flex gap-5 group shadow-sm hover:shadow-xl transition-all">
                                <img src={p.image_url} className="w-24 h-24 rounded-2xl object-cover border border-slate-100 shadow-inner" />
                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <span className="text-[9px] font-black text-[#003366] bg-blue-50 px-2 py-0.5 rounded uppercase">{p.category}</span>
                                        <h3 className="text-sm font-black uppercase mt-1 leading-tight">{p.name}</h3>
                                        <p className="text-xs font-bold text-slate-400">{formatRupiah(p.price)}</p>
                                    </div>
                                    <button onClick={() => { setFormData(p); setEditingId(p.id); setIsModalOpen(true); }} className="w-full bg-slate-50 py-2 rounded-xl text-[10px] font-black uppercase text-slate-400 hover:bg-[#003366] hover:text-white transition-all"><Pencil size={12}/> Edit</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* MODAL FORM */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <form onSubmit={handleSaveProduct} className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl space-y-6">
                        <div className="flex justify-between items-center border-b pb-4">
                            <h2 className="text-xl font-[1000] text-[#003366] uppercase">{editingId ? 'Update Produk' : 'Tambah Produk'}</h2>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 rounded-full"><X size={20}/></button>
                        </div>
                        <div className="space-y-4">
                            <label className="block w-full h-40 border-2 border-dashed rounded-[1.5rem] flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors">
                                <input type="file" className="hidden" onChange={handleFileUpload} />
                                {formData.image_url ? <img src={formData.image_url} className="w-full h-full object-contain p-2" /> : <div className="text-center"><ImageIcon className="mx-auto text-slate-300 mb-2" size={32}/><p className="text-[10px] font-black text-slate-400">Pilih Foto Produk</p></div>}
                            </label>
                            <input type="text" required placeholder="Nama Produk" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border p-4 rounded-2xl font-bold outline-none" />
                            <div className="grid grid-cols-2 gap-4">
                                <input type="number" required placeholder="Harga" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="bg-slate-50 border p-4 rounded-2xl font-bold" />
                                <input type="number" required placeholder="Stok" value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} className="bg-slate-50 border p-4 rounded-2xl font-bold" />
                            </div>
                        </div>
                        <div className="flex gap-3 pt-4 border-t">
                            <button type="submit" className="flex-1 bg-[#003366] text-white py-4 rounded-2xl font-black uppercase active:scale-95"><Save size={18} className="inline mr-2"/> Simpan</button>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 border border-slate-200 rounded-2xl font-black text-slate-400">Batal</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};
import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { formatRupiah, cn } from '../../lib/utils';
import {
    Eye, EyeOff, PlusCircle, ArrowUpRight, ArrowRightLeft,
    History, ArrowRight, Wallet, Building, Coins, ShieldCheck,
    Download, Share2, X, ShoppingBag, 
    Search, ShoppingCart, ChevronRight, Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { NewsCarousel } from '../../components/dashboard/NewsCarousel';
import { supabase } from '../../lib/supabase';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    image_url: string;
    category: string;
}

export const Home = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [showBalance, setShowBalance] = useState(true);
    const [showDetailAssets, setShowDetailAssets] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    // --- state multi-select simpanan ---
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // --- state belanja ---
    const [products, setProducts] = useState<Product[]>([]);
    const [loadingShop, setLoadingShop] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Semua');
    const [cart, setCart] = useState<{product: Product, quantity: number}[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);

    useEffect(() => {
        if (user?.role === 'admin') {
            navigate('/admin/dashboard', { replace: true });
        }
        fetchProducts();
    }, [user, navigate]);

    const fetchProducts = async () => {
        setLoadingShop(true);
        const { data, error } = await supabase
            .from('shop_products')
            .select('*')
            .eq('is_active', true)
            .order('name', { ascending: true });

        if (!error && data) setProducts(data);
        setLoadingShop(false);
    };

    if (user?.role === 'admin') return null;

    // --- data anggota ---
    const userData = {
        name: user?.full_name || user?.email?.split('@')[0] || 'Anggota KKJ',
        memberId: user?.member_id || 'MENUNGGU NIAK',
        taproBalance: user?.tapro_balance || 0,
        joinDate: user?.created_at ? new Date(user.created_at).getFullYear().toString() : '2026',
        validUntil: user?.created_at ? (new Date(user.created_at).getFullYear() + 5).toString() : '2031',
        branch: 'Pusat'
    };

    // 🔥 fungsi format Rp kapital
    const formatRpUpper = (amount: number) => {
        return formatRupiah(amount).replace('rp', 'Rp');
    };

    const otherSavings = [
        { id: 'simpok', name: 'simpanan pokok', val: user?.simpok_balance || 0 },
        { id: 'simwa', name: 'simpanan wajib', val: user?.simwa_balance || 0 },
        { id: 'simade', name: 'simpanan masa depan', val: user?.simade_balance || 0 },
        { id: 'sipena', name: 'simpanan pendidikan', val: user?.sipena_balance || 0 },
        { id: 'sihara', name: 'simpanan hari raya', val: user?.sihara_balance || 0 },
        { id: 'siqurma', name: 'simpanan qurban', val: user?.siqurma_balance || 0 },
        { id: 'siuji', name: 'simpanan haji/umroh', val: user?.siuji_balance || 0 },
        { id: 'siwalima', name: 'simpanan walimah', val: user?.siwalima_balance || 0 },
    ];

    // --- logika penjumlahan kumulatif ---
    const totalAssetsDisplay = selectedIds.length > 0 
        ? otherSavings.filter(s => selectedIds.includes(s.id)).reduce((acc, curr) => acc + curr.val, 0)
        : otherSavings.reduce((acc, curr) => acc + curr.val, 0);

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    // --- logika belanja ---
    const addToCart = (product: Product) => {
        const existing = cart.find(item => item.product.id === product.id);
        if (existing) {
            if (existing.quantity >= product.stock) return toast.error("stok tidak mencukupi");
            setCart(cart.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
        } else {
            setCart([...cart, { product, quantity: 1 }]);
        }
        toast.success(`${product.name} masuk keranjang`);
    };

    const removeFromCart = (productId: string) => {
        setCart(cart.filter(item => item.product.id !== productId));
    };

    const totalBayar = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

    const filteredProducts = products.filter(p => 
        (selectedCategory === 'Semua' || p.category === selectedCategory) &&
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- handlers kartu ---
    const handleDownloadCard = async () => {
        if (!cardRef.current) return;
        const toastId = toast.loading('mencetak kartu...');
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            const canvas = await html2canvas(cardRef.current, { 
                backgroundColor: null, scale: 3, useCORS: true,
                width: 632, height: 400
            });
            const link = document.createElement('a');
            link.download = `KARTU-KKJ-${userData.name.replace(/\s+/g, '_')}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            toast.success('berhasil disimpan!', { id: toastId });
        } catch (err) { toast.error('gagal simpan', { id: toastId }); }
    };

    const handleShare = async () => {
        if (!cardRef.current) return;
        const toastId = toast.loading('menyiapkan share...');
        try {
            const canvas = await html2canvas(cardRef.current, { scale: 2, useCORS: true });
            canvas.toBlob(async (blob) => {
                if (!blob) return;
                const file = new File([blob], "kartu-anggota.png", { type: "image/png" });
                if (navigator.share) {
                    await navigator.share({ title: 'Kartu Anggota KKJ', text: `Halo, ini kartu anggota KKJ saya a.n ${userData.name}.`, files: [file] });
                    toast.dismiss(toastId);
                } else { toast.error("browser tidak support share.", { id: toastId }); }
            });
        } catch (err) { toast.error("gagal membagikan kartu.", { id: toastId }); }
    };

    const quickActions = [
        { label: 'Top Up', icon: PlusCircle, color: 'text-green-600', bg: 'bg-green-50', link: '/transaksi/topup' },
        { label: 'Tarik Tunai', icon: ArrowUpRight, color: 'text-orange-600', bg: 'bg-orange-50', link: '/transaksi/tarik' },
        { label: 'Kirim', icon: ArrowRightLeft, color: 'text-blue-600', bg: 'bg-blue-50', link: '/transaksi/kirim' },
        { label: 'Riwayat', icon: History, color: 'text-purple-600', bg: 'bg-purple-50', link: '/transaksi/riwayat' },
    ];

    const featuredPrograms = [
        { name: 'tamasa', title: 'tabungan emas', desc: 'investasi aman mulai Rp 10rb', icon: Coins, color: 'from-yellow-400 to-yellow-600', text: 'text-yellow-700', bg: 'bg-yellow-50', link: '/program/tamasa' },
        { name: 'inflip', title: 'investasi properti', desc: 'flipping properti profit tinggi', icon: Building, color: 'from-green-400 to-green-600', text: 'text-green-800', bg: 'bg-green-50', link: '/program/inflip' },
        { name: 'pegadaian', title: 'gadai emas syariah', desc: 'solusi dana cepat & berkah', icon: Wallet, color: 'from-[#136f42] to-[#0f5c35]', text: 'text-green-900', bg: 'bg-green-50', link: '/program/pegadaian' }
    ];

    return (
        <div className="min-h-screen bg-gray-50 pb-10 font-sans">
    
            {/* 1. HERO SECTION (HIJAU KKJ DENGAN GRADASI PREMIUM) */}
    <div className="w-full bg-[#136f42] relative pb-24 pt-8 lg:pt-12 lg:rounded-b-[3rem] shadow-xl overflow-hidden">
        {/* Dekorasi Background agar tidak polos */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white opacity-5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
        
        <div className="max-w-xl mx-auto px-4 relative z-10 flex flex-col items-center">
            {/* KARTU ANGGOTA (UKURAN DIPERBAIKI & DESAIN PREMIUM) */}
            <div 
                id="id-card-render"
                ref={cardRef} 
                style={{ width: '632px', height: '400px', transform: 'scale(0.85)', transformOrigin: 'top center', marginBottom: '-55px' }}
                className="bg-gradient-to-tr from-[#0f3d23] via-[#136f42] to-[#1b5e20] rounded-[32px] shadow-2xl overflow-hidden border border-white/10 flex flex-col justify-between relative"
            >
                {/* Pola halus di dalam kartu agar tidak polos */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>

                {/* Header Kartu - Glassmorphism style */}
                <div className="flex items-center gap-4 p-8 border-b border-white/5 bg-black/10 backdrop-blur-sm relative z-10">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-yellow-500/40 shrink-0 shadow-lg">
                        <ShieldCheck className="text-[#136f42]" size={36} />
                    </div>
                    <div className="text-left">
                        <h2 className="text-white font-bold text-lg uppercase tracking-wider leading-none">koperasi karya kita jaya</h2>
                        <p className="text-[#aeea00] text-[10px] italic font-medium mt-1">berkoperasi demi wujud kesejahteraan bersama</p>
                    </div>
                </div>

                {/* Body Kartu */}
                <div className="px-10 py-2 flex justify-between items-center flex-1 gap-6 text-left relative z-10">
                    <div className="space-y-3 flex-1 min-w-0">
                        <h1 className="text-white font-bold text-3xl uppercase truncate tracking-tight">{userData.name}</h1>
                        <div className="space-y-1 text-sm text-white/90 font-medium">
                            <p><span className="text-[#aeea00] font-semibold w-14 inline-block uppercase">niak</span> : {userData.memberId}</p>
                            <p><span className="text-[#aeea00] font-semibold w-14 inline-block uppercase">status</span> : <span className="text-white font-bold bg-[#4caf50] px-2 rounded text-[10px] tracking-wider uppercase">aktif</span></p>
                        </div>
                        <div className="pt-2">
                            <p className="text-[#aeea00]/80 text-[10px] font-bold uppercase tracking-widest lowercase">saldo utama (tapro)</p>
                            {/* Format Saldo menggunakan Rp Kapital */}
                            <p className="text-3xl font-bold text-white font-mono tracking-tight">
                                {showBalance ? formatRpUpper(userData.taproBalance) : 'Rp ••••••••'}
                            </p>
                        </div>
                    </div>

                    {/* Bingkai Foto Elegan */}
                    <div className="w-28 h-36 bg-gray-200 rounded-[24px] border-[4px] border-white shadow-2xl overflow-hidden shrink-0 transform rotate-2 transition-transform hover:rotate-0 duration-500">
                        <img 
                            src={user?.avatar_url || `https://ui-avatars.com/api/?name=${userData.name}&background=136f42&color=fff&size=300`} 
                            className="w-full h-full object-cover" 
                            crossOrigin="anonymous" 
                        />
                    </div>
                </div>

                {/* Footer Kartu */}
                <div className="bg-gradient-to-r from-[#f9a825] via-[#fbc02d] to-[#f9a825] h-11 flex items-center justify-between px-10 text-xs text-[#1b5e20] font-bold uppercase tracking-wider shadow-inner relative z-10">
                    <span>sejak: {userData.joinDate}</span>
                    <span>valid: {userData.validUntil}</span>
                </div>
            </div>

            {/* Tombol Aksi di Bawah Kartu */}
            <div className="flex justify-center gap-3 mt-4 w-full px-2 max-w-sm uppercase font-bold">
                <button onClick={handleDownloadCard} className="flex-1 flex items-center justify-center gap-2 bg-white/10 text-white border border-white/20 py-2.5 rounded-full text-xs font-bold active:scale-95 transition-all hover:bg-white/20 backdrop-blur-sm shadow-lg">
                    <Download size={16} /> simpan
                </button>
                <button onClick={handleShare} className="flex-1 flex items-center justify-center gap-2 bg-white/10 text-white border border-white/20 py-2.5 rounded-full text-xs font-bold active:scale-95 transition-all hover:bg-white/20 backdrop-blur-sm shadow-lg">
                    <Share2 size={16} /> bagikan
                </button>
            </div>
        </div>
    </div>

            {/* 2. total simpanan overlay (Rp kapital & detail) */}
            <div className="max-w-5xl mx-auto px-4 -mt-8 relative z-20">
                <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 flex flex-col md:flex-row gap-8 items-center text-left lowercase">
                    <div onClick={() => setShowDetailAssets(true)} className="w-full md:w-5/12 border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 md:pr-8 cursor-pointer group p-2 rounded-lg transition-all active:scale-[0.98]">
                        <div className="flex justify-between items-center mb-1 text-slate-500 uppercase font-bold text-xs">
                            <div className="flex items-center gap-2">
                                <span className="group-hover:text-[#136f42]">total Aset</span>
                                <button onClick={(e) => { e.stopPropagation(); setShowBalance(!showBalance); }}>{showBalance ? <Eye size={14} /> : <EyeOff size={14} />}</button>
                            </div>
                            {/* 🔥 detail indicator */}
                            <div className="bg-green-50 text-[#136f42] text-[10px] px-2 py-0.5 rounded italic font-black uppercase">detail <ArrowRight size={10} className="inline ml-1" /></div>
                        </div>
                        <div className="text-2xl lg:text-3xl font-bold text-gray-900 group-hover:text-[#136f42] transition-colors tracking-tighter">
                            {/* 🔥 Rp kapital */}
                            {showBalance ? formatRpUpper(otherSavings.reduce((acc, curr) => acc + curr.val, 0)) : 'Rp ••••••••••'}
                        </div>
                    </div>
                    <div className="w-full md:w-7/12">
                        <div className="grid grid-cols-5 gap-3">
                            {quickActions.map((action) => (
                                <Link key={action.label} to={action.link} className="flex flex-col items-center gap-2 group">
                                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-sm border border-gray-50", action.bg)}><action.icon className={cn("w-6 h-6", action.color)} /></div>
                                    <span className="text-[10px] font-medium text-gray-600 group-hover:text-[#136f42] text-center leading-tight uppercase font-bold">{action.label}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. main content (news, programs, shop) */}
           <div className="max-w-5xl mx-auto px-4 mt-10 space-y-10">
                <NewsCarousel />
                <div>
                    <div className="flex justify-between items-end mb-4 px-2 uppercase font-bold">
                        <h3 className="text-lg text-gray-900">program unggulan</h3>
                        <button className="text-xs text-[#136f42] hover:underline flex items-center gap-1">lihat semua <ArrowRight size={14} /></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {featuredPrograms.map((program, idx) => (
                            <Link key={idx} to={program.link} className="group bg-white rounded-xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-gray-100 relative overflow-hidden">
                                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${program.color}`}></div>
                                <div className="flex justify-between items-start mb-3">
                                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", program.bg)}><program.icon className={program.text} size={20} /></div>
                                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#136f42] group-hover:text-white transition-colors"><ArrowUpRight size={16} /></div>
                                </div>
                                <h4 className="text-base font-bold text-gray-900 mb-0.5 uppercase">{program.name}</h4>
                                <p className="text-xs font-medium text-gray-600 mb-1 italic">{program.title}</p>
                                <p className="text-[10px] text-gray-400">{program.desc}</p>
                            </Link>
                        ))}
                    </div>
                </div>

                <div id="shop-section" className="pt-4 pb-12 space-y-6">
                    <div className="flex justify-between items-center px-2">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-[#136f42] rounded-2xl text-white shadow-xl shadow-green-900/20"><ShoppingBag size={24} /></div>
                            <div><h3 className="text-xl font-bold text-slate-900 tracking-tight leading-none uppercase">katalog belanja</h3><p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">self-pickup & tapro pay</p></div>
                        </div>
                        <button onClick={() => setIsCartOpen(true)} className="relative p-4 bg-amber-500 rounded-2xl shadow-xl transition-all text-white group shadow-amber-600/30 active:scale-95">
                            <ShoppingCart size={24} className="group-hover:rotate-12 transition-transform" />
                            {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-white text-[#136f42] text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-amber-500 animate-bounce">{cart.length}</span>}
                        </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-5 px-2">
                        {loadingShop ? [1,2,3,4].map(i => <div key={i} className="h-64 bg-white rounded-3xl animate-pulse border border-slate-50 shadow-sm" />) : filteredProducts.map((product) => (
                            <div key={product.id} className="bg-white rounded-[1.8rem] p-3 border border-slate-100 shadow-sm flex flex-col group hover:shadow-xl transition-all duration-300">
                                <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-50 mb-3 border border-slate-50">
                                    <img src={product.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className={cn("absolute top-3 right-3 px-3 py-1 rounded-full text-[9px] font-black uppercase shadow-sm backdrop-blur-md transition-all", product.stock > 0 ? "bg-white/90 text-[#136f42] border border-green-100" : "bg-rose-500 text-white")}>{product.stock > 0 ? `stok: ${product.stock}` : 'habis'}</div>
                                </div>
                                <div className="flex-1 flex flex-col text-left font-bold uppercase">
                                    <span className="text-[8px] font-bold text-[#136f42] bg-green-50 px-2 py-0.5 rounded uppercase w-fit mb-1">{product.category}</span>
                                    <h3 className="text-[13px] font-bold text-slate-800 leading-tight line-clamp-2 mb-2">{product.name}</h3>
                                    <div className="mt-auto"><p className="text-sm font-bold text-[#136f42] mb-3 lowercase">{formatRpUpper(product.price)}</p><button onClick={() => addToCart(product)} disabled={product.stock === 0} className="w-full py-2.5 bg-[#136f42] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg active:scale-95 flex items-center justify-center gap-1.5 uppercase font-black">tambah</button></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 4. modal rincian aset (multi-select) */}
            {showDetailAssets && (
                <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowDetailAssets(false); setSelectedIds([]); }}></div>
                    <div className="relative bg-white w-full max-w-sm sm:max-w-2xl rounded-t-3xl sm:rounded-3xl p-8 shadow-2xl flex flex-col max-h-[85vh] text-left animate-in slide-in-from-bottom duration-300">
                        <div className="flex justify-between items-center mb-8 shrink-0 border-b border-gray-100 pb-4 px-2 uppercase font-bold text-gray-900">
                            <div><h3 className="text-xl uppercase tracking-tight leading-none">rincian simpanan</h3><p className="text-[10px] text-gray-400 mt-2 tracking-widest lowercase">pilih simpanan untuk dijumlahkan</p></div>
                            <button onClick={() => { setShowDetailAssets(false); setSelectedIds([]); }} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><X size={20} className="text-gray-600" /></button>
                        </div>
                        <div className="overflow-y-auto pr-2 flex-1 custom-scrollbar">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {otherSavings.map((item, idx) => (
                                    <div key={idx} onClick={() => toggleSelection(item.id)} className={cn("flex justify-between items-center p-5 rounded-2xl border transition-all cursor-pointer active:scale-95", selectedIds.includes(item.id) ? "bg-green-600 border-green-600 text-white shadow-lg scale-[1.02]" : "bg-gray-50 border-gray-100 text-slate-900 hover:bg-green-50")}>
                                        <span className={cn("text-xs font-bold uppercase", selectedIds.includes(item.id) ? "text-green-50" : "text-gray-600")}>{item.name}</span>
                                        <span className="text-base font-bold font-mono tracking-tight">{formatRpUpper(item.val)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="mt-8 pt-6 border-t border-gray-100 shrink-0">
                            <div className={cn("flex justify-between items-center p-6 rounded-2xl shadow-xl border transition-all duration-500 uppercase font-bold", selectedIds.length > 0 ? "bg-[#136f42] border-green-400" : "bg-gray-100 border-gray-200")}>
                                <span className={cn("font-bold uppercase text-[10px] tracking-widest", selectedIds.length > 0 ? "text-green-200" : "text-gray-500")}>{selectedIds.length > 0 ? `total ${selectedIds.length} terpilih` : 'total keseluruhan'}</span>
                                <span className={cn("font-bold text-xl", selectedIds.length > 0 ? "text-white" : "text-[#136f42]")}>{formatRpUpper(totalAssetsDisplay)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 5. modal belanja (ke checkout) */}
            {isCartOpen && (
                <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[3rem] p-8 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-full duration-500 text-left">
                        <div className="flex justify-between items-center mb-8 border-b border-slate-50 pb-4 uppercase font-bold text-[#136f42]">
                            <h2 className="text-2xl tracking-tighter">keranjang belanja</h2>
                            <button onClick={() => setIsCartOpen(false)} className="p-2 bg-slate-50 rounded-full text-slate-400"><X size={24} /></button>
                        </div>
                        {cart.length === 0 ? <p className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest text-xs">keranjang kosong</p> : (
                            <div className="space-y-6">
                                {cart.map(item => (
                                    <div key={item.product.id} className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm transition-all active:scale-[0.98]">
                                        <div className="w-16 h-16 rounded-xl overflow-hidden shadow-md"><img src={item.product.image_url} className="w-full h-full object-cover" /></div>
                                        <div className="flex-1 uppercase font-bold"><h4 className="text-slate-900 text-sm tracking-tighter">{item.product.name}</h4><p className="text-xs text-[#136f42] mt-1">{formatRpUpper(item.product.price)} x {item.quantity}</p></div>
                                        <button onClick={() => removeFromCart(item.product.id)} className="p-2 text-rose-500"><X size={18} /></button>
                                    </div>
                                ))}
                                <div className="pt-6 border-t border-slate-200 space-y-4">
                                    <div className="flex justify-between items-center px-2 uppercase font-black"><span className="text-slate-400 text-[10px] tracking-[0.2em]">total</span><span className="text-2xl text-[#136f42] tracking-tighter">{formatRpUpper(totalBayar)}</span></div>
                                    <button onClick={() => navigate('/belanja/checkout', { state: { cart, total: totalBayar } })} className="w-full bg-[#136f42] text-white py-5 rounded-[2rem] font-bold text-sm uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3">checkout sekarang <ChevronRight size={18} /></button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
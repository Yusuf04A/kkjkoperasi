import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { formatRupiah, cn } from '../../lib/utils';
import {
    Eye, EyeOff, PlusCircle, ArrowUpRight, ArrowRightLeft,
    History, ArrowRight, Wallet, Building, Coins, ShieldCheck,
    Download, Share2, X, Smartphone, PiggyBank, ShoppingBag, 
    CheckCircle2, Search, ShoppingCart, ChevronRight, Plus, Minus
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

    // --- STATE BELANJA ---
    const [products, setProducts] = useState<Product[]>([]);
    const [loadingShop, setLoadingShop] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Semua');
    const [cart, setCart] = useState<{product: Product, quantity: number}[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);

    const categories = ['Semua', 'Sembako', 'Elektronik', 'Atribut', 'Lainnya'];

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

    // --- DATA ANGGOTA ---
    const userData = {
        name: user?.full_name || user?.email?.split('@')[0] || 'Anggota KKJ',
        memberId: user?.member_id || 'MENUNGGU NIAK',
        taproBalance: user?.tapro_balance || 0,
        joinDate: user?.created_at ? new Date(user.created_at).getFullYear().toString() : '2026',
        validUntil: user?.created_at ? (new Date(user.created_at).getFullYear() + 5).toString() : '2031',
        branch: 'Pusat'
    };

    const otherSavings = [
        { name: 'Simpanan Pokok', val: user?.simpok_balance || 0 },
        { name: 'Simpanan Wajib', val: user?.simwa_balance || 0 },
        { name: 'Simpanan Masa Depan', val: user?.simade_balance || 0 },
        { name: 'Simpanan Pendidikan', val: user?.sipena_balance || 0 },
        { name: 'Simpanan Hari Raya', val: user?.sihara_balance || 0 },
        { name: 'Simpanan Qurban', val: user?.siqurma_balance || 0 },
        { name: 'Simpanan Haji/Umroh', val: user?.siuji_balance || 0 },
        { name: 'Simpanan Walimah', val: user?.siwalima_balance || 0 },
    ];

    const totalOtherAssets = otherSavings.reduce((acc, curr) => acc + curr.val, 0);

    // --- LOGIKA KERANJANG ---
    const addToCart = (product: Product) => {
        const existing = cart.find(item => item.product.id === product.id);
        if (existing) {
            if (existing.quantity >= product.stock) return toast.error("Stok tidak mencukupi");
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

    // --- HANDLERS KARTU ---
    const handleDownloadCard = async () => {
        if (!cardRef.current) return;
        const toastId = toast.loading('Mencetak kartu HD...');
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            const canvas = await html2canvas(cardRef.current, { backgroundColor: null, scale: 3, useCORS: true, windowWidth: 1920, windowHeight: 1080 });
            const link = document.createElement('a');
            link.download = `KARTU-KKJ-${userData.name.replace(/\s+/g, '_')}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            toast.success('Kartu berhasil disimpan!', { id: toastId });
        } catch (err) { toast.error('Gagal menyimpan kartu', { id: toastId }); }
    };

    const handleShare = async () => {
        if (!cardRef.current) return;
        const toastId = toast.loading('Membuka menu share...');
        try {
            const canvas = await html2canvas(cardRef.current, { scale: 2, useCORS: true });
            canvas.toBlob(async (blob) => {
                if (!blob) return;
                const file = new File([blob], "kartu-anggota.png", { type: "image/png" });
                if (navigator.share) {
                    await navigator.share({ title: 'Kartu Anggota Koperasi KKJ', text: `Halo, ini kartu anggota digital saya di Koperasi KKJ a.n ${userData.name}.`, files: [file] });
                    toast.dismiss(toastId);
                } else { toast.error("Browser tidak support share.", { id: toastId }); }
            });
        } catch (err) { toast.error("Gagal membagikan kartu.", { id: toastId }); }
    };

   const quickActions = [
        { label: 'Top Up', icon: PlusCircle, color: 'text-green-600', bg: 'bg-green-50', link: '/transaksi/topup' },
        { label: 'Tarik Tunai', icon: ArrowUpRight, color: 'text-orange-600', bg: 'bg-orange-50', link: '/transaksi/tarik' },
        { label: 'Kirim', icon: ArrowRightLeft, color: 'text-blue-600', bg: 'bg-blue-50', link: '/transaksi/kirim' },
        { label: 'Riwayat', icon: History, color: 'text-purple-600', bg: 'bg-purple-50', link: '/transaksi/riwayat' },
    ];

    const featuredPrograms = [
        { name: 'TAMASA', title: 'Tabungan Emas', desc: 'Investasi aman mulai Rp 10rb', icon: Coins, color: 'from-yellow-400 to-yellow-600', text: 'text-yellow-700', bg: 'bg-yellow-50' },
        { name: 'INFLIP', title: 'Investasi Properti', desc: 'Flipping properti profit tinggi', icon: Building, color: 'from-blue-400 to-blue-600', text: 'text-blue-700', bg: 'bg-blue-50' },
        { name: 'PEGADAIAN', title: 'Gadai Emas Syariah', desc: 'Solusi dana cepat & berkah', icon: Wallet, color: 'from-[#003366] to-[#0055a5]', text: 'text-blue-900', bg: 'bg-blue-50' }
    ];

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            {/* 1. HERO SECTION */}
            <div className="w-full bg-[#003366] relative pb-24 pt-8 lg:pt-12 lg:rounded-b-[3rem] shadow-xl overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
                <div className="max-w-xl mx-auto px-4 relative z-10">
                    <div ref={cardRef} className="w-full bg-gradient-to-br from-[#003366] to-[#0055a5] rounded-xl shadow-2xl overflow-hidden border border-yellow-500/40 relative aspect-[1.58/1] flex flex-col justify-between">
                        {/* Konten Kartu tetap sama seperti sebelumnya */}
                        <div className="flex items-center gap-3 p-4 md:p-6 border-b border-yellow-500/30 bg-black/10 backdrop-blur-sm">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-yellow-500/50 shrink-0">
                                <ShieldCheck className="text-[#003366]" size={24} />
                            </div>
                            <div>
                                <h2 className="text-white font-bold text-sm md:text-lg uppercase">KOPERASI KARYA KITA JAYA</h2>
                                <p className="text-yellow-400 text-[10px] md:text-xs italic">Berkoperasi Demi Wujud Kesejahteraan Bersama</p>
                            </div>
                        </div>
                        <div className="px-5 py-2 flex justify-between items-center flex-1 gap-4">
                            <div className="space-y-2 flex-1 min-w-0">
                                <h1 className="text-white font-bold text-xl md:text-3xl uppercase truncate">{userData.name}</h1>
                                <div className="space-y-1 text-xs md:text-sm">
                                    <p className="text-white"><span className="text-yellow-400 font-semibold w-12 inline-block">NIAK</span> : {userData.memberId}</p>
                                    <p className="text-white"><span className="text-yellow-400 font-semibold w-12 inline-block">STATUS</span> : <span className="text-green-300 font-bold bg-green-900/60 px-2 rounded border border-green-500/30">AKTIF</span></p>
                                </div>
                                <div className="pt-2">
                                    <p className="text-yellow-400/80 text-[10px] font-bold uppercase tracking-widest">Saldo Tapro</p>
                                    <p className="text-2xl md:text-3xl font-bold text-white font-mono">{showBalance ? formatRupiah(userData.taproBalance) : 'Rp •••••••'}</p>
                                </div>
                            </div>
                            <div className="w-24 h-32 md:w-28 md:h-36 bg-gray-200 rounded-md border-[3px] border-white shadow-lg overflow-hidden shrink-0">
                                <img src={user?.avatar_url || `https://ui-avatars.com/api/?name=${userData.name}&background=003366&color=fff&size=200`} className="w-full h-full object-cover" crossOrigin="anonymous" />
                            </div>
                        </div>
                        <div className="bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600 h-8 md:h-10 flex items-center justify-between px-5 text-[10px] md:text-xs text-blue-900 font-bold uppercase tracking-wider shadow-inner">
                            <span>Sejak: {userData.joinDate}</span>
                            <span>Valid: {userData.validUntil}</span>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-3 px-2">
                        <button onClick={handleDownloadCard} className="flex items-center gap-2 bg-white/10 text-blue-50 border border-white/20 px-4 py-2 rounded-full text-xs font-bold active:scale-95 transition-all"><Download size={14} /> Simpan</button>
                        <button onClick={handleShare} className="flex items-center gap-2 bg-white/10 text-blue-50 border border-white/20 px-4 py-2 rounded-full text-xs font-bold active:scale-95 transition-all"><Share2 size={14} /> Bagikan</button>
                    </div>
                </div>
            </div>

            {/* 2. TOTAL ASSETS OVERLAY */}
            <div className="max-w-5xl mx-auto px-4 -mt-8 relative z-20">
                <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 flex flex-col md:flex-row gap-6 items-center">
                    <div onClick={() => setShowDetailAssets(true)} className="w-full md:w-5/12 border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 md:pr-6 cursor-pointer group p-2 rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                            <div className="flex items-center gap-2 text-gray-500">
                                <span className="text-xs font-bold tracking-wider uppercase group-hover:text-blue-900 transition-colors">Total Aset (Non-Tapro)</span>
                                <button onClick={(e) => { e.stopPropagation(); setShowBalance(!showBalance); }}>{showBalance ? <Eye size={14} /> : <EyeOff size={14} />}</button>
                            </div>
                            <div className="bg-blue-50 text-blue-900 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">8 JENIS <ArrowRight size={10} /></div>
                        </div>
                        <div className="text-2xl lg:text-3xl font-bold text-gray-900 group-hover:text-blue-900 transition-colors">{showBalance ? formatRupiah(totalOtherAssets) : 'Rp ••••••••'}</div>
                    </div>
                    <div className="w-full md:w-7/12">
                        <div className="grid grid-cols-5 gap-3">
                            {quickActions.map((action) => (
                                action.link ? (
                                    <Link key={action.label} to={action.link} className="flex flex-col items-center gap-2 group">
                                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-sm border border-gray-50", action.bg)}><action.icon className={cn("w-6 h-6", action.color)} /></div>
                                        <span className="text-[10px] font-medium text-gray-600 group-hover:text-blue-900 text-center leading-tight">{action.label}</span>
                                    </Link>
                                ) : (
                                    <button key={action.label} onClick={action.onClick} className="flex flex-col items-center gap-2 group">
                                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-sm border border-gray-50", action.bg)}><action.icon className={cn("w-6 h-6", action.color)} /></div>
                                        <span className="text-[10px] font-medium text-gray-600 group-hover:text-blue-900 text-center leading-tight">{action.label}</span>
                                    </button>
                                )
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. MAIN CONTENT */}
            <div className="max-w-5xl mx-auto px-4 mt-10 space-y-10">
                <NewsCarousel />
                
                {/* PROGRAM UNGGULAN */}
                <div>
                    <div className="flex justify-between items-end mb-4">
                        <h3 className="text-lg font-bold text-gray-900">Program Unggulan</h3>
                        <button className="text-xs font-medium text-blue-900 hover:underline flex items-center gap-1">Lihat Semua <ArrowRight size={14} /></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {featuredPrograms.map((program, idx) => (
                            <Link key={idx} to={program.name === 'TAMASA' ? '/program/tamasa' : program.name === 'INFLIP' ? '/program/inflip' : '/program/pegadaian'} className="group bg-white rounded-xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-gray-100 relative overflow-hidden">
                                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${program.color}`}></div>
                                <div className="flex justify-between items-start mb-3">
                                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", program.bg)}><program.icon className={program.text} size={20} /></div>
                                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#003366] group-hover:text-white transition-colors"><ArrowUpRight size={16} /></div>
                                </div>
                                <h4 className="text-base font-bold text-gray-900 mb-0.5">{program.name}</h4>
                                <p className="text-xs font-medium text-gray-600 mb-1">{program.title}</p>
                                <p className="text-[10px] text-gray-400">{program.desc}</p>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* 4. TOKO KOPERASI SECTION (KATALOG INTEGRASI) */}
<div id="shop-section" className="pt-4 pb-12 space-y-6">
    <div className="flex justify-between items-center px-2">
        <div className="flex items-center gap-3">
            <div className="p-3 bg-[#003366] rounded-2xl text-white shadow-xl shadow-blue-900/20">
                <ShoppingBag size={24} />
            </div>
            <div>
                <h3 className="text-xl font-[1000] text-slate-900 uppercase tracking-tighter leading-none">Katalog Belanja</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Self-Pickup & Tapro Pay</p>
            </div>
        </div>
        <button 
            onClick={() => setIsCartOpen(true)} 
            className="relative p-4 bg-amber-500 rounded-[1.5rem] shadow-xl shadow-amber-600/30 active:scale-95 transition-all text-white group"
        >
            <ShoppingCart size={24} className="group-hover:rotate-12 transition-transform" />
            {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-white text-[#003366] text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-lg animate-bounce border-2 border-amber-500">
                    {cart.length}
                </span>
            )}
        </button>
    </div>

    {/* FILTER & SEARCH BOX */}
    <div className="flex flex-col md:flex-row gap-4 items-center px-2">
        <div className="relative flex-1 w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#003366] transition-colors" size={20} />
            <input 
                type="text" 
                placeholder="Cari kebutuhan Anda di sini..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full bg-white border-2 border-slate-100 rounded-[1.5rem] py-4 pl-12 pr-4 text-sm font-bold focus:border-[#003366] outline-none transition-all shadow-sm" 
            />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar w-full md:w-auto pb-2">
            {categories.map(cat => (
                <button 
                    key={cat} 
                    onClick={() => setSelectedCategory(cat)} 
                    className={cn(
                        "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-2", 
                        selectedCategory === cat 
                        ? "bg-[#003366] text-white border-[#003366] shadow-lg shadow-blue-900/20" 
                        : "bg-white text-slate-400 border-slate-100 hover:border-[#003366]"
                    )}
                >
                    {cat}
                </button>
            ))}
        </div>
    </div>

    {/* LIST PRODUK DARI DATABASE */}
    {loadingShop ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-2">
            {[1,2,3,4].map(i => (
                <div key={i} className="h-64 bg-white border-2 border-slate-50 animate-pulse rounded-[2.5rem] shadow-sm" />
            ))}
        </div>
    ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] p-20 text-center border-2 border-dashed border-slate-200 mx-2 flex flex-col items-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Search size={40} className="text-slate-200" />
            </div>
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Produk tidak ditemukan</h3>
        </div>
    ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-2">
            {filteredProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-[2.2rem] p-1.5 shadow-sm border-2 border-slate-50 hover:border-[#003366] hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-500 group overflow-hidden flex flex-col h-full">
                    <div className="h-44 bg-slate-50 rounded-[1.8rem] overflow-hidden relative shadow-inner">
                        {product.image_url ? (
                            <img 
                                src={product.image_url} 
                                alt={product.name} 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-200">
                                <ShoppingBag size={48} />
                            </div>
                        )}
                        {/* BADGE STOK */}
                        <div className={cn(
                            "absolute top-3 right-3 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter shadow-xl backdrop-blur-md",
                            product.stock > 0 ? "bg-white/90 text-[#003366]" : "bg-rose-500 text-white"
                        )}>
                            {product.stock > 0 ? `Tersedia: ${product.stock}` : 'Habis'}
                        </div>
                    </div>
                    
                    <div className="p-4 flex flex-col flex-1">
                        <h3 className="text-[13px] font-[1000] text-slate-900 uppercase tracking-tighter leading-tight line-clamp-2 min-h-[2rem]">
                            {product.name}
                        </h3>
                        <div className="mt-auto pt-3 flex flex-col gap-3">
                            <p className="text-sm font-black text-[#003366] tracking-tight bg-blue-50 w-fit px-3 py-1 rounded-lg">
                                {formatRupiah(product.price)}
                            </p>
                            <button 
                                onClick={() => addToCart(product)} 
                                disabled={product.stock === 0} 
                                className={cn(
                                    "w-full py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm",
                                    product.stock > 0 
                                    ? "bg-slate-50 hover:bg-[#003366] text-slate-400 hover:text-white border-2 border-slate-100 hover:border-[#003366]" 
                                    : "bg-slate-100 text-slate-300 cursor-not-allowed border-none"
                                )}
                            >
                                <Plus size={14} className="stroke-[3px]" /> Keranjang
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )}
</div>
            </div>

            {/* MODAL CART (SLIDE UP) */}
            {isCartOpen && (
                <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[3rem] p-8 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-full duration-500">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-[1000] text-[#003366] uppercase tracking-tighter">Keranjang Belanja</h2>
                            <button onClick={() => setIsCartOpen(false)} className="p-3 bg-slate-100 rounded-full text-slate-400 hover:text-rose-500 transition-colors"><X size={24} /></button>
                        </div>
                        {cart.length === 0 ? (
                            <div className="py-20 text-center space-y-4">
                                <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto text-slate-200"><ShoppingBag size={40} /></div>
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Keranjang Anda Kosong</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {cart.map((item) => (
                                    <div key={item.product.id} className="flex items-center gap-4 bg-slate-50 p-4 rounded-[1.5rem] border border-slate-100">
                                        <div className="w-16 h-16 rounded-xl overflow-hidden shadow-md"><img src={item.product.image_url} className="w-full h-full object-cover" /></div>
                                        <div className="flex-1">
                                            <h4 className="font-black text-slate-900 text-sm uppercase tracking-tighter">{item.product.name}</h4>
                                            <p className="text-xs font-bold text-[#003366]">{formatRupiah(item.product.price)} x {item.quantity}</p>
                                        </div>
                                        <button onClick={() => removeFromCart(item.product.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><X size={18} /></button>
                                    </div>
                                ))}
                                <div className="pt-6 border-t border-slate-200 space-y-4">
                                    <div className="flex justify-between items-center px-2">
                                        <span className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em]">Total Estimasi</span>
                                        <span className="text-2xl font-[1000] text-[#003366] tracking-tighter">{formatRupiah(totalBayar)}</span>
                                    </div>
                                    <button onClick={() => navigate('/belanja/checkout', { state: { cart, total: totalBayar } })} className="w-full bg-[#003366] text-white py-5 rounded-[2rem] font-[1000] text-sm uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3">Checkout <ChevronRight size={18} /></button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL RINCIAN ASET */}
            {showDetailAssets && (
                <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDetailAssets(false)}></div>
                    <div className="relative bg-white w-full max-w-sm sm:max-w-2xl rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl flex flex-col max-h-[85vh]">
                        <div className="flex justify-between items-center mb-6 shrink-0 border-b border-gray-100 pb-4">
                            <h3 className="font-bold text-xl text-gray-900">Rincian Aset Koperasi</h3>
                            <button onClick={() => setShowDetailAssets(false)} className="p-2 bg-gray-100 rounded-full"><X size={20} className="text-gray-600" /></button>
                        </div>
                        <div className="overflow-y-auto pr-2 flex-1">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {otherSavings.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <span className="text-sm font-medium text-gray-600">{item.name}</span>
                                        <span className="text-base font-bold text-gray-900 font-mono">{formatRupiah(item.val)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="mt-6 pt-4 border-t border-gray-100 shrink-0">
                            <div className="flex justify-between items-center bg-blue-50 p-4 rounded-2xl">
                                <span className="font-bold text-blue-900 uppercase text-xs tracking-wider">Total Aset Lain</span>
                                <span className="font-bold text-xl text-blue-900">{formatRupiah(totalOtherAssets)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
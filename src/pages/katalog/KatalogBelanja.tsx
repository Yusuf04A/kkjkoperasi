import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { formatRupiah } from '../../lib/utils';
import { 
    ShoppingBag, Search, Filter, ShoppingCart, 
    ChevronRight, ArrowLeft, Plus, Minus, X, CheckCircle2 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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

export const KatalogBelanja = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Semua');
    const [cart, setCart] = useState<{product: Product, quantity: number}[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);

    const categories = ['Semua', 'Sembako', 'Elektronik', 'Atribut', 'Lainnya'];

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('shop_products')
            .select('*')
            .eq('is_active', true)
            .order('name', { ascending: true });

        if (!error && data) setProducts(data);
        setLoading(false);
    };

    const addToCart = (product: Product) => {
        const existing = cart.find(item => item.product.id === product.id);
        if (existing) {
            if (existing.quantity >= product.stock) return toast.error("Stok tidak mencukupi");
            setCart(cart.map(item => 
                item.product.id === product.id 
                ? { ...item, quantity: item.quantity + 1 } 
                : item
            ));
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

    return (
        <div className="min-h-screen bg-slate-50 pb-24 font-sans">
            {/* STICKY HEADER */}
            <div className="bg-[#003366] text-white sticky top-0 z-40 px-6 py-5 rounded-b-[2rem] shadow-2xl">
                <div className="flex justify-between items-center max-w-5xl mx-auto">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-xl font-black tracking-tight uppercase">Toko Koperasi</h1>
                            <p className="text-[10px] text-blue-200 font-bold uppercase tracking-widest">Self-Pickup & Tapro Pay</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsCartOpen(true)}
                        className="relative p-3 bg-amber-500 rounded-2xl shadow-lg shadow-amber-600/30 active:scale-90 transition-all"
                    >
                        <ShoppingCart size={22} className="text-white" />
                        {cart.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-white text-[#003366] text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-bounce">
                                {cart.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* SEARCH BAR */}
                <div className="max-w-5xl mx-auto mt-6 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300" size={18} />
                    <input 
                        type="text"
                        placeholder="Cari produk keinginan Anda..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder:text-blue-300 focus:outline-none focus:bg-white/20 transition-all"
                    />
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 mt-8 space-y-8">
                {/* CATEGORY FILTER */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={cn(
                                "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border",
                                selectedCategory === cat 
                                ? "bg-[#003366] text-white border-[#003366] shadow-lg shadow-blue-900/20" 
                                : "bg-white text-slate-400 border-slate-200 hover:border-[#003366]"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* PRODUCT GRID */}
                {loading ? (
                    <div className="grid grid-cols-2 gap-4">
                        {[1,2,3,4].map(i => <div key={i} className="h-64 bg-slate-200 animate-pulse rounded-[2rem]" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        {filteredProducts.map((product) => (
                            <div key={product.id} className="bg-white rounded-[2rem] p-1 shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-500 group overflow-hidden">
                                <div className="h-40 bg-slate-50 rounded-[1.8rem] overflow-hidden relative">
                                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black text-[#003366] uppercase tracking-tighter shadow-sm">
                                        Stok: {product.stock}
                                    </div>
                                </div>
                                <div className="p-4 space-y-2">
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter leading-tight line-clamp-1">{product.name}</h3>
                                    <p className="text-xs font-black text-[#003366]">{formatRupiah(product.price)}</p>
                                    <button 
                                        onClick={() => addToCart(product)}
                                        disabled={product.stock === 0}
                                        className="w-full bg-slate-50 hover:bg-[#003366] text-slate-400 hover:text-white py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 border border-slate-100"
                                    >
                                        + Keranjang
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* SLIDE-UP CART PREVIEW */}
            {isCartOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[3rem] p-8 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-full duration-500">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-[1000] text-[#003366] uppercase tracking-tighter">Keranjang Belanja</h2>
                            <button onClick={() => setIsCartOpen(false)} className="p-3 bg-slate-100 rounded-full text-slate-400 hover:text-rose-500 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {cart.length === 0 ? (
                            <div className="py-20 text-center space-y-4">
                                <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto">
                                    <ShoppingBag size={40} className="text-slate-200" />
                                </div>
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Keranjang Anda Kosong</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {cart.map((item) => (
                                    <div key={item.product.id} className="flex items-center gap-4 bg-slate-50 p-4 rounded-[1.5rem] border border-slate-100">
                                        <div className="w-16 h-16 rounded-xl overflow-hidden shadow-md">
                                            <img src={item.product.image_url} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-black text-slate-900 text-sm uppercase tracking-tighter">{item.product.name}</h4>
                                            <p className="text-xs font-bold text-[#003366]">{formatRupiah(item.product.price)} x {item.quantity}</p>
                                        </div>
                                        <button 
                                            onClick={() => removeFromCart(item.product.id)}
                                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                ))}

                                <div className="pt-6 border-t border-slate-200 space-y-4">
                                    <div className="flex justify-between items-center px-2">
                                        <span className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em]">Total Estimasi</span>
                                        <span className="text-2xl font-[1000] text-[#003366] tracking-tighter">{formatRupiah(totalBayar)}</span>
                                    </div>
                                    <button 
                                        onClick={() => navigate('/belanja/checkout', { state: { cart, total: totalBayar } })}
                                        className="w-full bg-[#003366] text-white py-5 rounded-[2rem] font-[1000] text-sm uppercase tracking-[0.2em] shadow-2xl shadow-blue-900/40 active:scale-95 transition-all flex items-center justify-center gap-3"
                                    >
                                        Lanjut ke Checkout <ChevronRight size={18} className="stroke-[3px]" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
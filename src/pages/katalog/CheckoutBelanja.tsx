import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import { formatRupiah } from '../../lib/utils';
import { ArrowLeft, ShieldCheck, Loader2, ChevronRight, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';

export const CheckoutBelanja = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuthStore();
    
    // Pastikan data cart dikirim dari halaman Katalog
    const { cart, total } = location.state || { cart: [], total: 0 };

    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);

    if (!cart.length) {
        navigate('/belanja');
        return null;
    }

    const handlePayment = async () => {
        if (pin.length < 6) return toast.error("Masukkan 6 digit PIN");
        if ((user?.tapro_balance || 0) < total) return toast.error("Saldo TAPRO tidak cukup");

        setLoading(true);
        try {
            // 1. Verifikasi PIN
            const { data: profile } = await supabase
                .from('profiles')
                .select('pin')
                .eq('id', user?.id)
                .single();

            if (profile?.pin !== pin) {
                setLoading(false);
                return toast.error("PIN Salah!");
            }

            // 2. SIMPAN KE SHOP_ORDERS (PENTING: Status harus 'diproses')
            const pickupCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            
            const { data: order, error: orderError } = await supabase
                .from('shop_orders')
                .insert({
                    user_id: user?.id,
                    total_amount: total,
                    status: 'diproses', // 🔑 KUNCI: Agar muncul di Antrean Admin
                    pickup_code: pickupCode,
                    payment_method: 'tapro'
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // 3. Simpan Rincian Item ke shop_order_items
            const orderItems = cart.map((item: any) => ({
                order_id: order.id,
                product_id: item.product.id,
                quantity: item.quantity,
                price_at_purchase: item.product.price
            }));
            await supabase.from('shop_order_items').insert(orderItems);

            // 4. BUAT LOG TRANSAKSI PENDING (Tipe diubah agar tidak muncul sebagai withdrawal)
            // Saldo tidak langsung dipotong di sini, melainkan menunggu Admin Approve
            await supabase.from('transactions').insert({
                user_id: user?.id,
                amount: total,
                type: 'shop_payment', // 🔑 FIX: Diubah dari 'withdrawal' menjadi 'shop_payment'
                status: 'pending', 
                description: `Belanja Toko: ${order.id.slice(0,8)}` // Muncul sebagai "Belanja Toko" di riwayat
            });

            toast.success("Pesanan Terkirim! Menunggu Konfirmasi Admin.");
            navigate('/transaksi/riwayat'); // User memantau status di sini
            
        } catch (err: any) {
            toast.error("Gagal: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-12 font-sans text-slate-900">
            <div className="bg-[#003366] text-white p-6 rounded-b-[2.5rem] shadow-xl">
                <div className="max-w-xl mx-auto flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all"><ArrowLeft size={22} /></button>
                    <h1 className="text-xl font-[1000] uppercase tracking-tighter">Konfirmasi Pesanan</h1>
                </div>
            </div>

            <div className="max-w-xl mx-auto px-6 -mt-4 space-y-6">
                {/* STATUS SALDO */}
                <div className="bg-white rounded-[2rem] p-6 shadow-xl border flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-[#003366] rounded-2xl"><Wallet size={24} /></div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo TAPRO</p>
                            <p className="text-lg font-black text-slate-900">{formatRupiah(user?.tapro_balance || 0)}</p>
                        </div>
                    </div>
                </div>

                {/* RINCIAN PESANAN */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-lg space-y-6 border border-slate-100">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] border-b pb-4">Item Belanja</h3>
                    <div className="space-y-4 max-h-60 overflow-y-auto no-scrollbar">
                        {cart.map((item: any) => (
                            <div key={item.product.id} className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <span className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-[11px] font-black text-[#003366] border">{item.quantity}x</span>
                                    <p className="text-xs font-bold text-slate-700 uppercase tracking-tighter">{item.product.name}</p>
                                </div>
                                <p className="text-xs font-black text-slate-900">{formatRupiah(item.product.price * item.quantity)}</p>
                            </div>
                        ))}
                    </div>
                    <div className="pt-6 border-t-2 border-dashed flex justify-between items-center">
                        <p className="text-2xl font-[1000] text-[#003366] tracking-tighter">{formatRupiah(total)}</p>
                        <span className="text-[8px] font-black bg-blue-50 text-[#003366] px-2 py-1 rounded uppercase tracking-widest border border-blue-100">Self Pickup</span>
                    </div>
                </div>

                {/* VERIFIKASI PIN */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-lg text-center border-t-4 border-amber-400">
                    <ShieldCheck size={32} className="mx-auto text-amber-500 mb-2" />
                    <h4 className="text-sm font-black text-slate-900 uppercase">Konfirmasi PIN</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">Keamanan Transaksi KKJ</p>

                    <input 
                        type="password" 
                        maxLength={6}
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-5 text-center text-3xl font-black tracking-[0.5em] focus:border-[#003366] outline-none"
                        placeholder="••••••"
                    />

                    <button 
                        onClick={handlePayment}
                        disabled={loading}
                        className="w-full mt-6 bg-[#003366] text-white py-5 rounded-[2rem] font-[1000] text-sm uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:bg-slate-300"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <>Kirim ke Antrean <ChevronRight size={20} /></>}
                    </button>
                    <p className="text-[9px] text-slate-400 font-medium italic mt-4">Pesanan akan divalidasi oleh admin sebelum saldo TAPRO Anda dikurangi.</p>
                </div>
            </div>
        </div>
    );
};
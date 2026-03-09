import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import { formatRupiah, cn } from '../../lib/utils';
import {
    ArrowLeft, ShieldCheck, Loader2, ChevronRight, Wallet,
    Store, Truck, MapPin, Phone, Eye, EyeOff, CheckCircle, X, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { SuccessModal } from '../../components/SuccessModal';

export const CheckoutBelanja = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuthStore();

    const { cart, total } = location.state || { cart: [], total: 0 };

    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);

    const [showPin, setShowPin] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [isPinSuccess, setIsPinSuccess] = useState(false);
    const [isPinError, setIsPinError] = useState(false); // 🔥 State untuk popup gagal merah

    const [deliveryMethod, setDeliveryMethod] = useState<'Diambil di Toko' | 'Diantar'>('Diambil di Toko');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');

    // 🔥 FUNGSI PEMUTAR SUARA (pop.mp3)
    const playSuccessSound = () => {
        try {
            const audio = new Audio('/sounds/pop.mp3');
            audio.volume = 0.5;
            audio.play().catch(err => console.warn("Autoplay dicegah browser", err));
        } catch (e) {
            console.error("File audio tidak ditemukan");
        }
    };

    useEffect(() => {
        const fetchProfileData = async () => {
            if (!user?.id) return;
            const { data } = await supabase.from('profiles').select('phone, address').eq('id', user.id).single();
            if (data) {
                setPhone(data.phone || '');
                setAddress(data.address || '');
            }
        };
        fetchProfileData();
    }, [user]);

    if (!cart.length) {
        navigate('/belanja');
        return null;
    }

    const handlePayment = async () => {
        if (pin.length < 6) return;

        const userPin = (user as any)?.pin;

        // 🔥 LOGIKA PIN SALAH: Tampilkan Popup Merah di Tengah
        if (pin !== userPin) {
            setIsPinError(true);
            playSuccessSound(); // Bunyi pop saat muncul merah
            setTimeout(() => {
                setIsPinError(false);
                setPin('');
            }, 1500);
            return;
        }

        if ((user?.tapro_balance || 0) < total) {
            toast.error("saldo tapro tidak cukup");
            return;
        }

        if (deliveryMethod === 'Diantar') {
            if (!phone.trim() || !address.trim()) {
                toast.error("nomor telepon dan alamat pengiriman wajib diisi!");
                return;
            }
        }

        // 🔥 PIN BENAR: Jalankan suara & animasi centang
        playSuccessSound();
        setIsPinSuccess(true);
        setLoading(true);

        try {
            if (deliveryMethod === 'Diantar') {
                await supabase.from('profiles').update({ phone, address }).eq('id', user?.id);
            }

            const pickupCode = Math.random().toString(36).substring(2, 8).toUpperCase();

            const { data: order, error: orderError } = await supabase
                .from('shop_orders')
                .insert({
                    user_id: user?.id,
                    total_amount: total,
                    status: 'diproses',
                    pickup_code: pickupCode,
                    payment_method: 'tapro',
                    delivery_method: deliveryMethod,
                    delivery_phone: deliveryMethod === 'Diantar' ? phone : null,
                    delivery_address: deliveryMethod === 'Diantar' ? address : null
                })
                .select()
                .single();

            if (orderError) throw orderError;

            const orderItems = cart.map((item: any) => ({
                order_id: order.id,
                product_id: item.product.id,
                quantity: item.quantity,
                price_at_purchase: item.product.price
            }));
            await supabase.from('shop_order_items').insert(orderItems);

            const newBalance = (user?.tapro_balance || 0) - total;
            await supabase.from('profiles').update({ tapro_balance: newBalance }).eq('id', user?.id);

            await supabase.from('transactions').insert({
                user_id: user?.id,
                amount: total,
                type: 'shop_payment',
                status: 'pending',
                description: `belanja toko: ${order.id.slice(0, 8)}`
            });

            setTimeout(() => {
                setShowSuccessModal(true);
                setIsPinSuccess(false);
            }, 1500);

        } catch (err: any) {
            toast.error("gagal: " + err.message);
            setLoading(false);
            setIsPinSuccess(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-12 font-sans text-slate-900 text-left">
            <div className="bg-[#136f42] text-white p-6 rounded-b-[2.5rem] shadow-md">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all shrink-0"
                    >
                        <ArrowLeft size={22} />
                    </button>
                    <h1 className="text-lg font-bold tracking-tight">Konfirmasi Pesanan</h1>
                </div>
            </div>

            <div className="max-w-xl mx-auto px-6 -mt-4 space-y-6">
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-green-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-50 text-[#136f42] rounded-2xl"><Wallet size={24} /></div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 tracking-widest">SALDO TAPRO</p>
                            <p className="text-lg font-black text-slate-900">{formatRupiah(user?.tapro_balance || 0)}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-green-100 space-y-4">
                    <h3 className="text-sm font-black text-slate-400 tracking-[0.2em] border-b border-green-50 pb-4">OPSI PENGIRIMAN</h3>
                    <div className="flex flex-col gap-3">
                        <label className={cn("flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all", deliveryMethod === 'Diambil di Toko' ? "border-[#136f42] bg-green-50/50" : "border-slate-100 hover:border-green-100")}>
                            <div className="flex items-center gap-4">
                                <input
                                    type="radio"
                                    name="delivery"
                                    value="Diambil di Toko"
                                    checked={deliveryMethod === 'Diambil di Toko'}
                                    onChange={(e) => setDeliveryMethod(e.target.value as 'Diambil di Toko')}
                                    className="w-4 h-4 text-[#136f42] accent-[#136f42]"
                                />
                                <div>
                                    <p className="text-xs font-bold text-slate-700 flex items-center gap-2"><Store size={14} className="text-[#136f42]" /> DIAMBIL DI TOKO</p>
                                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Ambil sendiri barang di koperasi</p>
                                </div>
                            </div>
                        </label>

                        <label className={cn("flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all", deliveryMethod === 'Diantar' ? "border-[#136f42] bg-green-50/50" : "border-slate-100 hover:border-green-100")}>
                            <div className="flex items-center gap-4">
                                <input
                                    type="radio"
                                    name="delivery"
                                    value="Diantar"
                                    checked={deliveryMethod === 'Diantar'}
                                    onChange={(e) => setDeliveryMethod(e.target.value as 'Diantar')}
                                    className="w-4 h-4 text-[#136f42] accent-[#136f42]"
                                />
                                <div>
                                    <p className="text-xs font-bold text-slate-700 flex items-center gap-2"><Truck size={14} className="text-[#136f42]" /> DIANTAR EKSPEDISI</p>
                                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Ongkir dikoordinasikan via WA admin</p>
                                </div>
                            </div>
                        </label>

                        {deliveryMethod === 'Diantar' && (
                            <div className="mt-2 pt-4 border-t border-slate-100 space-y-4 animate-in fade-in slide-in-from-top-2">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 mb-1.5 uppercase">
                                        <Phone size={12} /> Nomor Telepon / WA
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: 081234567890"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-sm outline-none focus:border-[#136f42] focus:ring-1 focus:ring-[#136f42] transition-all font-medium text-slate-800"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 mb-1.5 uppercase">
                                        <MapPin size={12} /> Alamat Lengkap Pengiriman
                                    </label>
                                    <textarea
                                        rows={3}
                                        placeholder="Tuliskan nama jalan, rt/rw, dan patokan rumah..."
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-sm outline-none focus:border-[#136f42] focus:ring-1 focus:ring-[#136f42] transition-all font-medium text-slate-800"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-green-100 space-y-6">
                    <h3 className="text-sm font-black text-slate-400 tracking-[0.2em] border-b border-green-50 pb-4">ITEM BELANJA</h3>
                    <div className="space-y-4 max-h-60 overflow-y-auto no-scrollbar">
                        {cart.map((item: any) => (
                            <div key={item.product.id} className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <span className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-[11px] font-black text-[#136f42] border border-green-100">{item.quantity}X</span>
                                    <p className="text-xs font-bold text-slate-700 tracking-tighter uppercase">{item.product.name}</p>
                                </div>
                                <p className="text-xs font-black text-slate-900">{formatRupiah(item.product.price * item.quantity)}</p>
                            </div>
                        ))}
                    </div>
                    <div className="pt-6 border-t-2 border-dashed border-green-100 flex justify-between items-center">
                        <p className="text-2xl font-[1000] text-[#136f42] tracking-tighter">{formatRupiah(total)}</p>
                        <span className="text-[8px] font-black bg-green-50 text-[#136f42] px-2 py-1 rounded tracking-widest border border-green-200 text-right max-w-[100px] truncate">
                            {deliveryMethod}
                        </span>
                    </div>
                </div>

                {/* --- BAGIAN PIN DENGAN ANIMASI BERHASIL & GAGAL --- */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-md text-center border-t-4 border-amber-400 relative overflow-hidden">
                    {isPinSuccess ? (
                        <div className="py-4 animate-in fade-in">
                            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 text-[#136f42] shadow-inner animate-in zoom-in duration-500">
                                <CheckCircle size={48} strokeWidth={2.5} />
                            </div>
                            <h3 className="text-lg font-black text-slate-800 tracking-tight mb-1">Pin benar</h3>
                            <p className="text-xs text-slate-400 font-medium">memproses pesanan anda...</p>
                        </div>
                    ) : isPinError ? (
                        <div className="py-4 animate-in fade-in">
                            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600 shadow-inner animate-bounce">
                                <AlertCircle size={48} strokeWidth={2.5} />
                            </div>
                            <h3 className="text-lg font-black text-rose-600 tracking-tight mb-1">Pin salah!</h3>
                            <p className="text-xs text-slate-400 font-medium">silakan masukkan pin yang benar.</p>
                        </div>
                    ) : (
                        <>
                            <ShieldCheck size={32} className="mx-auto text-amber-500 mb-2 relative z-10" />
                            <h4 className="text-sm font-black text-slate-900 relative z-10">Konfirmasi PIN</h4>
                            <p className="text-[10px] text-slate-400 font-bold tracking-widest mb-4 relative z-10 uppercase">Keamanan Transaksi KKJ</p>

                            <div className="relative group z-10 max-w-[280px] mx-auto">
                                <input
                                    type={showPin ? "text" : "password"}
                                    inputMode="numeric"
                                    maxLength={6}
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-5 text-center text-3xl font-black tracking-[0.5em] focus:border-[#136f42] outline-none transition-all pr-12 text-slate-800"
                                    placeholder="••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPin(!showPin)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#136f42] p-2 transition-colors"
                                >
                                    {showPin ? <EyeOff size={22} /> : <Eye size={22} />}
                                </button>
                            </div>

                            <button
                                onClick={handlePayment}
                                disabled={loading || pin.length < 6}
                                className="w-full mt-6 bg-[#136f42] text-white py-5 rounded-[2rem] font-[1000] text-sm tracking-[0.2em] shadow-lg shadow-green-900/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:bg-slate-300 disabled:shadow-none relative z-10"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <>Kirim ke Antrean <ChevronRight size={20} /></>}
                            </button>
                        </>
                    )}
                    <p className="text-[9px] text-slate-400 font-medium italic mt-4 relative z-10">Pesanan akan divalidasi oleh admin sebelum Saldo TaPro Anda dikurangi.</p>
                </div>
            </div>

            <SuccessModal
                isOpen={showSuccessModal}
                onClose={() => {
                    setShowSuccessModal(false);
                    navigate('/transaksi/riwayat');
                }}
                title="Pesanan terkirim!"
                message="Terima kasih! Pesanan Anda sedang diproses dan menunggu konfirmasi admin. Saldo TaPro Anda akan otomatis terpotong saat disetujui."
            />
        </div>
    );
};
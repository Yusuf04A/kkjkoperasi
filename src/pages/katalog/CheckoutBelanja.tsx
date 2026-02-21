import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import { formatRupiah, cn } from '../../lib/utils';
import { 
    ArrowLeft, ShieldCheck, Loader2, ChevronRight, Wallet, 
    Store, Truck, MapPin, Phone, Eye, EyeOff 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { SuccessModal } from '../../components/SuccessModal'; // 🔥 IMPORT MODAL SUKSES 🔥

export const CheckoutBelanja = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuthStore();
    
    const { cart, total } = location.state || { cart: [], total: 0 };

    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    
    // STATE BARU: View PIN
    const [showPin, setShowPin] = useState(false);

    // 🔥 STATE BARU: Tampilkan Modal Sukses
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const [deliveryMethod, setDeliveryMethod] = useState<'Diambil di Toko' | 'Diantar'>('Diambil di Toko');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');

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
        if (pin.length < 6) return toast.error("Masukkan 6 digit PIN");
        if ((user?.tapro_balance || 0) < total) return toast.error("Saldo TAPRO tidak cukup");

        if (deliveryMethod === 'Diantar') {
            if (!phone.trim() || !address.trim()) {
                return toast.error("Nomor Telepon dan Alamat Pengiriman wajib diisi!");
            }
        }

        setLoading(true);
        const toastId = toast.loading("Memproses pesanan...");

        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('pin')
                .eq('id', user?.id)
                .single();

            if (profile?.pin !== pin) {
                setLoading(false);
                toast.dismiss(toastId);
                return toast.error("PIN Salah!");
            }

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
                description: `Belanja Toko: ${order.id.slice(0,8)}` 
            });

            toast.dismiss(toastId); // Matikan loading toast

            // 🔥 MUNCULKAN POPUP DI TENGAH, JANGAN LANGSUNG NAVIGATE 🔥
            setShowSuccessModal(true); 
            
        } catch (err: any) {
            toast.error("Gagal: " + err.message, { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-12 font-sans text-slate-900">
            <div className="bg-[#136f42] text-white p-6 rounded-b-[2.5rem] shadow-md">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all shrink-0"
                    >
                        <ArrowLeft size={22} />
                    </button>
                    <h1 className="text-lg font-bold uppercase tracking-tight">Konfirmasi Pesanan</h1>
                </div>
            </div>

            <div className="max-w-xl mx-auto px-6 -mt-4 space-y-6">
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-green-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-50 text-[#136f42] rounded-2xl"><Wallet size={24} /></div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo TAPRO</p>
                            <p className="text-lg font-black text-slate-900">{formatRupiah(user?.tapro_balance || 0)}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-green-100 space-y-4">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] border-b border-green-50 pb-4">Opsi Pengiriman</h3>
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
                                    <p className="text-xs font-bold text-slate-700 uppercase flex items-center gap-2"><Store size={14} className="text-[#136f42]"/> Diambil di Toko</p>
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
                                    <p className="text-xs font-bold text-slate-700 uppercase flex items-center gap-2"><Truck size={14} className="text-[#136f42]"/> Diantar Ekspedisi</p>
                                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Ongkir dikoordinasikan via WA admin</p>
                                </div>
                            </div>
                        </label>

                        {deliveryMethod === 'Diantar' && (
                            <div className="mt-2 pt-4 border-t border-slate-100 space-y-4 animate-in fade-in slide-in-from-top-2">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5 mb-1.5">
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
                                    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5 mb-1.5">
                                        <MapPin size={12} /> Alamat Lengkap Pengiriman
                                    </label>
                                    <textarea 
                                        rows={3}
                                        placeholder="Tuliskan nama jalan, RT/RW, dan patokan rumah..." 
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
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] border-b border-green-50 pb-4">Item Belanja</h3>
                    <div className="space-y-4 max-h-60 overflow-y-auto no-scrollbar">
                        {cart.map((item: any) => (
                            <div key={item.product.id} className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <span className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-[11px] font-black text-[#136f42] border border-green-100">{item.quantity}x</span>
                                    <p className="text-xs font-bold text-slate-700 uppercase tracking-tighter">{item.product.name}</p>
                                </div>
                                <p className="text-xs font-black text-slate-900">{formatRupiah(item.product.price * item.quantity)}</p>
                            </div>
                        ))}
                    </div>
                    <div className="pt-6 border-t-2 border-dashed border-green-100 flex justify-between items-center">
                        <p className="text-2xl font-[1000] text-[#136f42] tracking-tighter">{formatRupiah(total)}</p>
                        <span className="text-[8px] font-black bg-green-50 text-[#136f42] px-2 py-1 rounded uppercase tracking-widest border border-green-200 text-right max-w-[100px] truncate">
                            {deliveryMethod}
                        </span>
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] p-8 shadow-md text-center border-t-4 border-amber-400 relative overflow-hidden">
                    <ShieldCheck size={32} className="mx-auto text-amber-500 mb-2 relative z-10" />
                    <h4 className="text-sm font-black text-slate-900 uppercase relative z-10">Konfirmasi PIN</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4 relative z-10">Keamanan Transaksi KKJ</p>

                    {/* 🔥 FITUR VIEW PIN DENGAN TOMBOL MATA 🔥 */}
                    <div className="relative group z-10 max-w-[280px] mx-auto">
                        <input 
                            type={showPin ? "text" : "password"} 
                            maxLength={6}
                            value={pin}
                            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-5 text-center text-3xl font-black tracking-[0.5em] focus:border-[#136f42] outline-none transition-all pr-12"
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
                        className="w-full mt-6 bg-[#136f42] text-white py-5 rounded-[2rem] font-[1000] text-sm uppercase tracking-[0.2em] shadow-lg shadow-green-900/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:bg-slate-300 disabled:shadow-none relative z-10"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <>Kirim ke Antrean <ChevronRight size={20} /></>}
                    </button>
                    <p className="text-[9px] text-slate-400 font-medium italic mt-4 relative z-10">Pesanan akan divalidasi oleh admin sebelum saldo TAPRO Anda dikurangi.</p>
                </div>
            </div>

            {/* 🔥 SUCCESS MODAL POPUP DI TENGAH 🔥 */}
            <SuccessModal 
                isOpen={showSuccessModal}
                onClose={() => {
                    setShowSuccessModal(false);
                    navigate('/transaksi/riwayat'); // Baru pindah halaman saat ditutup
                }}
                title="PESANAN TERKIRIM!"
                message={`Terima kasih! Pesanan Anda sedang diproses dan menunggu konfirmasi admin. Saldo TAPRO Anda akan otomatis terpotong saat disetujui.`}
            />
        </div>
    );
};
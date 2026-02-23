import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { formatRupiah, cn } from '../../lib/utils';
import {
  ArrowLeft, Upload, Loader2, Clock, CheckCircle,
  XCircle, Coins, Scale, Camera, AlertCircle, ShoppingBag,
  ChevronRight, History, ShieldCheck, Info, CalendarDays, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PinModal } from '../../components/PinModal';
import { SuccessModal } from '../../components/SuccessModal';
// 🔥 IMPORT LIBRARY KOMPRESI
import imageCompression from 'browser-image-compression'; 

export const Pegadaian = () => {
  const navigate = useNavigate();
  const { user, checkSession } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'apply' | 'history'>(() => {
    return (localStorage.getItem('pegadaian_active_tab') as 'apply' | 'history') || 'apply';
  });

  // State Form Pengajuan
  const [formData, setFormData] = useState({ 
    itemName: '', 
    weight: '', 
    karat: '24', 
    condition: 'Baik',
    tenor: '4' 
  });
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State History
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // State Transaksi Tebus & Modal
  const [itemToRedeem, setItemToRedeem] = useState<any>(null);
  const [showRedeemDetails, setShowRedeemDetails] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successConfig, setSuccessConfig] = useState({ title: '', message: '' });

  // 🔥 FUNGSI PEMUTAR SUARA (pop.mp3)
  const playSuccessSound = () => {
    try {
      const audio = new Audio('/sounds/pop.mp3');
      audio.volume = 0.5;
      audio.play().catch(err => console.warn("Autoplay dicegah browser", err));
    } catch (e) {
      console.error("Audio file not found");
    }
  };

  useEffect(() => {
    localStorage.setItem('pegadaian_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    const init = async () => {
      if (!user) await checkSession();
      if (activeTab === 'history') fetchHistory();
    };
    init();
  }, [user, activeTab]);

  const fetchHistory = async () => {
    const currentUser = user || (await supabase.auth.getUser()).data.user;
    if (!currentUser) return;
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('pawn_transactions')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validasi ukuran sebelum kompresi (Maks 10MB)
      if (file.size > 10 * 1024 * 1024) {
        return toast.error("ukuran file terlalu besar (maksimal 10mb)");
      }
      
      const toastId = toast.loading("mengompres foto barang...");
      try {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1024,
          useWebWorker: true,
        };

        const compressedFile = await imageCompression(file, options);
        setImageFile(compressedFile);
        setImagePreview(URL.createObjectURL(compressedFile));
        toast.success("foto siap diunggah!", { id: toastId });
      } catch (error) {
        toast.error("gagal mengompres gambar", { id: toastId });
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("silakan login terlebih dahulu");
    if (!imageFile) return toast.error("wajib upload foto barang");
    
    setIsSubmitting(true);
    const toastId = toast.loading("mengunggah pengajuan...");
    try {
      const fileExt = imageFile.name.split('.').pop() || 'jpg';
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage.from('pawn_images').upload(fileName, imageFile);
      if (uploadError) throw uploadError;
      
      const imageUrl = supabase.storage.from('pawn_images').getPublicUrl(fileName).data.publicUrl;

      const { error: insertError } = await supabase.from('pawn_transactions').insert({
        user_id: user.id,
        item_name: formData.itemName,
        item_weight: parseFloat(formData.weight),
        item_karat: parseInt(formData.karat),
        item_condition: formData.condition,
        tenor_bulan: parseInt(formData.tenor),
        image_url: imageUrl,
        status: 'pending'
      });
      if (insertError) throw insertError;
      
      toast.dismiss(toastId);
      
      // 🔥 PUTAR SUARA & MODAL SUKSES
      playSuccessSound();
      setSuccessConfig({
        title: "PENGAJUAN TERKIRIM!",
        message: `pengajuan gadai ${formData.itemName.toLowerCase()} telah berhasil dikirim. admin akan segera meninjau barang anda dalam maksimal 1x24 jam.`
      });
      setShowSuccessModal(true); 
      
      setFormData({ itemName: '', weight: '', karat: '24', condition: 'Baik', tenor: '4' });
      setImageFile(null);
      setImagePreview(null);
    } catch (err: any) {
      toast.error("gagal: " + err.message, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenRedeem = (item: any) => {
    setItemToRedeem(item);
    setShowRedeemDetails(true);
  };

  const proceedToPin = () => {
    const adminFee = (itemToRedeem?.loan_amount || 0) * 0.05; 
    const totalPay = (itemToRedeem?.loan_amount || 0) + adminFee;

    if ((user?.tapro_balance || 0) < totalPay) {
      toast.error("saldo tapro tidak cukup untuk membayar pokok + biaya admin.");
      return;
    }
    setShowRedeemDetails(false);
    setShowPinModal(true);
  };

  const executeRedeem = async () => {
    if (!itemToRedeem) return;
    const adminFee = itemToRedeem.loan_amount * 0.05;
    const totalPay = itemToRedeem.loan_amount + adminFee;

    setIsSubmitting(true);
    try {
      const { error: errSaldo } = await supabase.from('profiles')
        .update({ tapro_balance: (user?.tapro_balance || 0) - totalPay })
        .eq('id', user?.id);
      if (errSaldo) throw errSaldo;

      await supabase.from('pawn_transactions').update({ status: 'completed' }).eq('id', itemToRedeem.id);
      
      await supabase.from('transactions').insert({
        user_id: user?.id,
        type: 'withdraw',
        amount: totalPay,
        status: 'success',
        description: `tebus gadai: ${itemToRedeem.item_name}`
      });

      // 🔥 PUTAR SUARA & MODAL SUKSES
      playSuccessSound();
      setSuccessConfig({
        title: "PENEBUSAN BERHASIL!",
        message: `penebusan barang "${itemToRedeem.item_name.toLowerCase()}" telah sukses dilakukan. saldo tapro anda telah terpotong sebesar ${formatRupiah(totalPay)}.`
      });
      setShowSuccessModal(true); 
      
      await checkSession();
      fetchHistory();
      setItemToRedeem(null);
    } catch (err: any) {
      toast.error("gagal: " + err.message);
    } finally {
      setIsSubmitting(false);
      setShowPinModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans text-slate-900 text-left lowercase">
      <div className="sticky top-0 z-30 bg-white border-b border-green-100 shadow-sm">
        <div className="px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-green-50 text-[#136f42] transition-colors uppercase">
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
          <h1 className="text-lg font-bold text-gray-900 leading-none first-letter:uppercase">pegadaian</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="bg-[#136f42] rounded-[2rem] p-6 lg:p-10 text-white shadow-xl relative overflow-hidden flex items-center justify-between uppercase">
          <div className="absolute inset-0 bg-gradient-to-br from-[#167d4a] to-[#0f5c35] z-0" />
          <div className="relative z-10 max-w-md text-left">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="text-[#aeea00]" size={18} />
              <span className="font-black tracking-[0.2em] text-[#aeea00] text-[10px]">layanan amanah kkj</span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-black mb-2 leading-tight tracking-tight">gadai emas cepat & syariah</h2>
            <p className="text-green-50/80 text-sm lg:text-base leading-relaxed font-medium lowercase first-letter:uppercase">
              taksiran harga pasar tinggi dengan biaya titip yang transparan. amanah dan dikelola profesional oleh koperasi kkj.
            </p>
          </div>
          <Coins className="hidden sm:block text-[#aeea00]/10 absolute -right-4 -bottom-4 w-40 h-40 rotate-12" />
        </div>

        <div className="flex p-1.5 bg-green-900/5 rounded-2xl w-full max-w-sm mx-auto border border-green-100 shadow-sm uppercase">
          <button onClick={() => setActiveTab('apply')} className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-black tracking-widest rounded-xl transition-all", activeTab === 'apply' ? "bg-white text-[#136f42] shadow-md border border-green-50" : "text-gray-400 hover:text-[#136f42]")}><Upload size={14} /> pengajuan</button>
          <button onClick={() => setActiveTab('history')} className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-black tracking-widest rounded-xl transition-all", activeTab === 'history' ? "bg-white text-[#136f42] shadow-md border border-green-50" : "text-gray-400 hover:text-[#136f42]")}><History size={14} /> riwayat</button>
        </div>

        {activeTab === 'apply' ? (
          <div className="bg-white rounded-[2rem] shadow-sm border border-green-50 p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Camera size={14} className="text-[#136f42]" /> foto barang emas
                    </label>
                    <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-lg uppercase tracking-tight">Maks 10MB</span>
                </div>
                
                <div className="relative group">
                  <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className={cn("border-2 border-dashed rounded-2xl p-6 text-center transition-all min-h-[200px] flex flex-col items-center justify-center bg-gray-50 group-hover:bg-green-50/50", imagePreview ? "border-[#136f42]" : "border-gray-200")}>
                    {imagePreview ? (
                        <div className="relative">
                            <img src={imagePreview} alt="Preview" className="h-44 w-full object-contain rounded-xl shadow-md" />
                            <p className="text-center text-[10px] text-[#136f42] font-black mt-3 lowercase uppercase tracking-widest">klik untuk ganti foto</p>
                        </div>
                    ) : (
                        <div className="text-gray-400">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-gray-100">
                                <Camera size={24} className="text-[#136f42]" />
                            </div>
                            <p className="text-sm font-bold text-gray-600 first-letter:uppercase">ambil foto atau pilih galeri</p>
                            <div className="mt-2 flex flex-col gap-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter flex items-center justify-center gap-1">
                                    <Info size={10} /> format: jpg, png, webp
                                </p>
                                <p className="text-[10px] font-black text-[#136f42] uppercase tracking-tighter">ukuran akan dikompres otomatis ke 1MB</p>
                            </div>
                        </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">nama perhiasan / lm</label><input required name="itemName" value={formData.itemName} onChange={handleChange} placeholder="misal: cincin kawin" className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-4 focus:ring-green-50 focus:border-[#136f42] outline-none text-sm font-bold text-gray-900 transition-all first-letter:uppercase" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">berat (gr)</label><input required type="number" step="0.01" name="weight" value={formData.weight} onChange={handleChange} placeholder="0.00" className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-4 focus:ring-green-50 focus:border-[#136f42] outline-none text-sm font-black text-gray-900 transition-all" /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">karat</label><select name="karat" value={formData.karat} onChange={handleChange} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm font-black text-gray-900 cursor-pointer focus:ring-4 focus:ring-green-50 uppercase"><option value="24">24k</option><option value="22">22k</option><option value="18">18k</option></select></div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">tenor gadai (bulan)</label><div className="relative"><select name="tenor" value={formData.tenor} onChange={handleChange} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm font-black text-gray-900 cursor-pointer focus:ring-4 focus:ring-green-50 appearance-none first-letter:uppercase"><option value="4">4 bulan (standar)</option><option value="3">3 bulan</option><option value="2">2 bulan</option><option value="1">1 bulan</option></select><CalendarDays size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" /></div></div>
                <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">kondisi & kelengkapan</label><input required name="condition" value={formData.condition} onChange={handleChange} placeholder="ada nota, box, atau surat toko" className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-4 focus:ring-green-50 focus:border-[#136f42] outline-none text-sm font-medium text-gray-900 transition-all first-letter:uppercase" /></div>
              </div>
              
              <div className="bg-amber-50 p-4 rounded-2xl flex gap-3 border border-amber-100 shadow-sm lowercase"><AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" /><p className="text-[11px] text-amber-900 leading-relaxed font-medium">pengajuan anda akan ditinjau admin. setelah <b>taksiran harga</b> disetujui, dana langsung cair ke <b>saldo tapro</b>.</p></div>
              <button disabled={isSubmitting} className="w-full bg-[#136f42] text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-green-900/20 flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-[#0f5c35] disabled:opacity-50">{isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "kirim pengajuan"}</button>
            </form>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-500">
            {loadingHistory ? <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-[#136f42]" /></div> : history.length === 0 ? <div className="text-center py-24 bg-white rounded-[2rem] border border-dashed border-green-100 uppercase"><Scale size={48} className="mx-auto text-green-50 mb-4" /><h3 className="font-black text-gray-400 tracking-widest text-xs">belum ada riwayat gadai</h3></div> : (
              history.map((item) => (
                <div key={item.id} className="bg-white p-5 rounded-[1.5rem] border border-green-50 shadow-sm flex gap-4 transition-all hover:shadow-lg group">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-gray-100"><img src={item.image_url} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" alt={item.item_name} /></div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center uppercase">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-black text-gray-900 text-sm truncate pr-2 tracking-tight">{item.item_name}</h4>
                      <div className="flex gap-1.5 items-center">
                        <span className="text-[9px] px-2.5 py-1 rounded-full font-black tracking-tighter border bg-blue-50 text-blue-700 border-blue-100 flex items-center gap-1"><CalendarDays size={10} /> {item.tenor_bulan || 4} bln</span>
                        <span className={cn("text-[9px] px-2.5 py-1 rounded-full font-black tracking-tighter border", item.status === 'approved' ? "bg-amber-50 text-amber-700 border-amber-100" : item.status === 'completed' ? "bg-green-50 text-green-700 border-green-100" : "bg-gray-50 text-gray-400 border-gray-100")}>{item.status}</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold mb-3">{item.item_weight}gr • {item.item_karat}k</p>
                    <div className="flex justify-between items-center border-t border-green-50/50 pt-3">
                      <div>{item.loan_amount > 0 && <p className="font-black text-[#136f42] text-sm tracking-tighter">{formatRupiah(item.loan_amount)}</p>}</div>
                      {item.status === 'approved' && (
                        <button onClick={() => handleOpenRedeem(item)} className="bg-[#136f42] hover:bg-[#0f5c35] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md transition-all active:scale-90 flex items-center gap-1.5">
                          <ShoppingBag size={12} strokeWidth={3} /> tebus
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* MODAL RINCIAN TEBUSAN */}
      {showRedeemDetails && itemToRedeem && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] p-6 shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95 uppercase text-left">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-gray-900 tracking-tight">rincian penebusan</h3>
              <button onClick={() => setShowRedeemDetails(false)} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-gray-900 transition-colors uppercase"><X size={20}/></button>
            </div>
            <div className="space-y-6">
              <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <img src={itemToRedeem.image_url} className="w-16 h-16 rounded-xl object-cover bg-white shadow-sm" alt="Thumbnail" />
                <div>
                  <h4 className="font-bold text-gray-900 text-sm mb-1">{itemToRedeem.item_name}</h4>
                  <p className="text-[10px] text-gray-500 font-bold tracking-wide">{itemToRedeem.item_weight}gr • {itemToRedeem.item_karat}k</p>
                </div>
              </div>
              <div className="space-y-3 lowercase">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">pokok pinjaman</span>
                  <span className="font-bold text-gray-900 uppercase">{formatRupiah(itemToRedeem.loan_amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">jasa titip (5%)</span>
                  <span className="font-bold text-gray-900 uppercase">{formatRupiah(itemToRedeem.loan_amount * 0.05)}</span>
                </div>
                <div className="border-t border-dashed border-gray-200 my-2"></div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900">total bayar</span>
                  <span className="font-black text-[#136f42] text-xl tracking-tight uppercase">{formatRupiah(itemToRedeem.loan_amount * 1.05)}</span>
                </div>
              </div>
              <button onClick={proceedToPin} className="w-full bg-[#136f42] text-white py-4 rounded-xl font-bold text-sm uppercase tracking-widest shadow-lg active:scale-95 transition-all hover:bg-[#0f5c35]">konfirmasi & bayar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PIN */}
      <PinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={executeRedeem}
        title="masukkan pin"
      />

      {/* SUCCESS MODAL POPUP */}
      <SuccessModal 
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          setActiveTab('history');
          fetchHistory();
        }}
        title={successConfig.title}
        message={successConfig.message}
      />
    </div>
  );
};

export default Pegadaian;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { formatRupiah, cn } from '../../lib/utils';
import {
  ArrowLeft, Upload, Loader2, Clock, CheckCircle,
  XCircle, Coins, Scale, Camera, AlertCircle, ShoppingBag,
  ChevronRight, History, ShieldCheck, Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PinModal } from '../../components/PinModal';

export const Pegadaian = () => {
  const navigate = useNavigate();
  const { user, checkSession } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'apply' | 'history'>(() => {
    return (localStorage.getItem('pegadaian_active_tab') as 'apply' | 'history') || 'apply';
  });

  const [formData, setFormData] = useState({ itemName: '', weight: '', karat: '24', condition: 'Baik' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [itemToRedeem, setItemToRedeem] = useState<any>(null);
  const [showPinModal, setShowPinModal] = useState(false);

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) return toast.error("Ukuran foto maksimal 5MB");
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Silakan login terlebih dahulu");
    if (!imageFile) return toast.error("Wajib upload foto barang");
    setIsSubmitting(true);
    const toastId = toast.loading("Mengunggah pengajuan...");
    try {
      const fileExt = imageFile.name.split('.').pop();
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
        image_url: imageUrl,
        status: 'pending'
      });
      if (insertError) throw insertError;
      toast.success("Pengajuan berhasil dikirim!", { id: toastId });
      setFormData({ itemName: '', weight: '', karat: '24', condition: 'Baik' });
      setImageFile(null);
      setImagePreview(null);
      setActiveTab('history');
    } catch (err: any) {
      toast.error("Gagal: " + err.message, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeRedeem = async () => {
    if (!itemToRedeem) return;
    const toastId = toast.loading("Memproses penebusan...");
    try {
      const { error: errSaldo } = await supabase.from('profiles')
        .update({ tapro_balance: (user?.tapro_balance || 0) - itemToRedeem.loan_amount })
        .eq('id', user?.id);
      if (errSaldo) throw errSaldo;

      await supabase.from('pawn_transactions').update({ status: 'completed' }).eq('id', itemToRedeem.id);
      await supabase.from('transactions').insert({
        user_id: user?.id,
        type: 'withdraw',
        amount: itemToRedeem.loan_amount,
        status: 'success',
        description: `Tebus Gadai: ${itemToRedeem.item_name}`
      });

      toast.success("Barang berhasil ditebus!", { id: toastId });
      await checkSession();
      fetchHistory();
      setItemToRedeem(null);
    } catch (err: any) {
      toast.error("Gagal: " + err.message, { id: toastId });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* HEADER */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-slate-900">Pegadaian Emas</h1>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* HERO SECTION */}
        <div className="bg-[#0B2B4B] rounded-3xl p-6 lg:p-8 text-white shadow-xl relative overflow-hidden flex items-center justify-between">
          <div className="relative z-10 max-w-md">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="text-amber-400" size={18} />
              <span className="font-bold tracking-widest text-amber-400 text-[10px] uppercase">Layanan Amanah KKJ</span>
            </div>
            <h2 className="text-xl lg:text-3xl font-bold mb-2 leading-tight">Gadai Emas Cepat & Syariah</h2>
            <p className="text-blue-100/80 text-xs lg:text-sm leading-relaxed">
              Taksiran harga pasar tinggi dengan biaya titip yang transparan. Amanah dan diawasi pengurus.
            </p>
          </div>
          <Coins className="hidden sm:block text-amber-500/20 absolute -right-4 -bottom-4 w-32 h-32 rotate-12" />
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex p-1.5 bg-slate-200 rounded-2xl w-full max-w-sm mx-auto shadow-inner">
          <button
            onClick={() => setActiveTab('apply')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all",
              activeTab === 'apply' ? "bg-white text-[#0B2B4B] shadow-md" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Upload size={14} /> Pengajuan
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all",
              activeTab === 'history' ? "bg-white text-[#0B2B4B] shadow-md" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <History size={14} /> Riwayat
          </button>
        </div>

        {/* CONTENT AREA */}
        {activeTab === 'apply' ? (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Upload Foto */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                  <Camera size={14} /> Foto Barang Emas
                </label>
                <div className="relative group">
                  <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className={cn(
                    "border-2 border-dashed rounded-2xl p-4 text-center transition-all min-h-[180px] flex flex-col items-center justify-center bg-slate-50 group-hover:bg-slate-100",
                    imagePreview ? "border-amber-400" : "border-slate-300"
                  )}>
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="h-40 w-full object-contain rounded-lg" />
                    ) : (
                      <div className="text-slate-400">
                        <Camera size={40} className="mx-auto mb-2 opacity-20" />
                        <p className="text-sm font-semibold">Ambil foto atau pilih galeri</p>
                        <p className="text-[10px] mt-1 italic">Pastikan pencahayaan cukup terang</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Grid Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nama Perhiasan / LM</label>
                  <input required name="itemName" value={formData.itemName} onChange={handleChange} placeholder="Misal: Cincin Kawin" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-[#0B2B4B] outline-none text-sm font-semibold" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Berat (gr)</label>
                    <input required type="number" step="0.01" name="weight" value={formData.weight} onChange={handleChange} placeholder="0.00" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none text-sm font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Karat</label>
                    <select name="karat" value={formData.karat} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-bold cursor-pointer">
                      <option value="24">24K</option>
                      <option value="22">22K</option>
                      <option value="18">18K</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Kondisi & Kelengkapan</label>
                <input required name="condition" value={formData.condition} onChange={handleChange} placeholder="Ada Nota, Box, atau Surat Toko" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm" />
              </div>

              <div className="bg-amber-50 p-4 rounded-2xl flex gap-3 border border-amber-100 shadow-sm shadow-amber-900/5">
                <Info size={18} className="text-amber-600 shrink-0" />
                <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
                  Pengajuan Anda akan ditinjau Admin. Setelah <b>Taksiran Harga</b> disetujui, dana langsung cair ke <b>Saldo Tapro</b>.
                </p>
              </div>

              <button
                disabled={isSubmitting}
                className="w-full bg-[#0B2B4B] text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "Kirim Pengajuan"}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-500">
            {loadingHistory ? (
              <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-[#0B2B4B]" /></div>
            ) : history.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                <Scale size={48} className="mx-auto text-slate-200 mb-4" />
                <h3 className="font-bold text-slate-400">Belum ada riwayat gadai</h3>
              </div>
            ) : (
              history.map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex gap-4 transition-all hover:shadow-md">
                  <img src={item.image_url} className="w-20 h-20 rounded-xl object-cover border border-slate-100" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-sm text-slate-900 truncate">{item.item_name}</h4>
                      <span className={cn(
                        "text-[9px] px-2 py-0.5 rounded-full font-bold uppercase",
                        item.status === 'approved' ? "bg-amber-100 text-amber-700" :
                        item.status === 'completed' ? "bg-green-100 text-green-700" :
                        "bg-slate-100 text-slate-500"
                      )}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium mb-2">{item.item_weight}gr • {item.item_karat}K</p>
                    
                    <div className="flex justify-between items-center border-t border-slate-50 pt-2">
                      <div>
                        {item.loan_amount > 0 && (
                          <p className="font-bold text-[#0B2B4B] text-sm">{formatRupiah(item.loan_amount)}</p>
                        )}
                      </div>
                      {item.status === 'approved' && (
                        <button 
                          onClick={() => { setItemToRedeem(item); setShowPinModal(true); }}
                          className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-sm transition-colors"
                        >
                          <ShoppingBag size={12} /> Tebus
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

      <PinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={executeRedeem}
        title="Konfirmasi Tebus"
      />
    </div>
  );
};

export default Pegadaian;
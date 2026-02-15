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
    <div className="min-h-screen bg-slate-50 pb-24 font-sans">
      {/* HEADER (HIJAU KONSISTEN) */}
      <div className="sticky top-0 z-30 bg-white border-b border-green-100 shadow-sm">
        <div className="px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-green-50 text-[#136f42] transition-colors"
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
          <h1 className="text-lg font-bold text-gray-900 leading-none uppercase tracking-wide">
            Pegadaian
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* HERO SECTION (HIJAU HUTAN) */}
        <div className="bg-[#136f42] rounded-[2rem] p-6 lg:p-10 text-white shadow-xl relative overflow-hidden flex items-center justify-between">
          <div className="absolute inset-0 bg-gradient-to-br from-[#167d4a] to-[#0f5c35] z-0" />
          <div className="relative z-10 max-w-md">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="text-[#aeea00]" size={18} />
              <span className="font-black tracking-[0.2em] text-[#aeea00] text-[10px] uppercase">Layanan Amanah KKJ</span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-black mb-2 leading-tight tracking-tight">Gadai Emas Cepat & Syariah</h2>
            <p className="text-green-50/80 text-sm lg:text-base leading-relaxed font-medium">
              Taksiran harga pasar tinggi dengan biaya titip yang transparan. Amanah dan dikelola profesional oleh Koperasi KKJ.
            </p>
          </div>
          <Coins className="hidden sm:block text-[#aeea00]/10 absolute -right-4 -bottom-4 w-40 h-40 rotate-12" />
        </div>

        {/* TABS NAVIGATION (HIJAU KONSISTEN) */}
        <div className="flex p-1.5 bg-green-900/5 rounded-2xl w-full max-w-sm mx-auto border border-green-100 shadow-sm">
          <button
            onClick={() => setActiveTab('apply')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all",
              activeTab === 'apply' ? "bg-white text-[#136f42] shadow-md border border-green-50" : "text-gray-400 hover:text-[#136f42]"
            )}
          >
            <Upload size={14} /> Pengajuan
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all",
              activeTab === 'history' ? "bg-white text-[#136f42] shadow-md border border-green-50" : "text-gray-400 hover:text-[#136f42]"
            )}
          >
            <History size={14} /> Riwayat
          </button>
        </div>

        {/* CONTENT AREA */}
        {activeTab === 'apply' ? (
          <div className="bg-white rounded-[2rem] shadow-sm border border-green-50 p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Upload Foto */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Camera size={14} className="text-[#136f42]" /> Foto Barang Emas
                </label>
                <div className="relative group">
                  <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className={cn(
                    "border-2 border-dashed rounded-2xl p-6 text-center transition-all min-h-[200px] flex flex-col items-center justify-center bg-gray-50 group-hover:bg-green-50/50",
                    imagePreview ? "border-[#136f42]" : "border-gray-200"
                  )}>
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="h-44 w-full object-contain rounded-xl shadow-md" />
                    ) : (
                      <div className="text-gray-400">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-gray-100">
                          <Camera size={24} className="text-[#136f42]" />
                        </div>
                        <p className="text-sm font-bold text-gray-600">Ambil foto atau pilih galeri</p>
                        <p className="text-[10px] mt-1 italic font-medium">Pastikan pencahayaan cukup terang</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Grid Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nama Perhiasan / LM</label>
                  <input required name="itemName" value={formData.itemName} onChange={handleChange} placeholder="Misal: Cincin Kawin" className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-4 focus:ring-green-50 focus:border-[#136f42] outline-none text-sm font-bold text-gray-900 transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Berat (gr)</label>
                    <input required type="number" step="0.01" name="weight" value={formData.weight} onChange={handleChange} placeholder="0.00" className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-4 focus:ring-green-50 focus:border-[#136f42] outline-none text-sm font-black text-gray-900 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Karat</label>
                    <select name="karat" value={formData.karat} onChange={handleChange} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm font-black text-gray-900 cursor-pointer focus:ring-4 focus:ring-green-50">
                      <option value="24">24K</option>
                      <option value="22">22K</option>
                      <option value="18">18K</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Kondisi & Kelengkapan</label>
                <input required name="condition" value={formData.condition} onChange={handleChange} placeholder="Ada Nota, Box, atau Surat Toko" className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-4 focus:ring-green-50 focus:border-[#136f42] outline-none text-sm font-medium text-gray-900 transition-all" />
              </div>

              <div className="bg-amber-50 p-4 rounded-2xl flex gap-3 border border-amber-100 shadow-sm">
                <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
                  Pengajuan Anda akan ditinjau Admin. Setelah <b>Taksiran Harga</b> disetujui, dana langsung cair ke <b>Saldo Tapro</b>.
                </p>
              </div>

              <button
                disabled={isSubmitting}
                className="w-full bg-[#136f42] text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-green-900/20 flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-[#0f5c35] disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "Kirim Pengajuan"}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-500">
            {loadingHistory ? (
              <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-[#136f42]" /></div>
            ) : history.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-[2rem] border border-dashed border-green-100">
                <Scale size={48} className="mx-auto text-green-50 mb-4" />
                <h3 className="font-black text-gray-400 uppercase tracking-widest text-xs">Belum ada riwayat gadai</h3>
              </div>
            ) : (
              history.map((item) => (
                <div key={item.id} className="bg-white p-5 rounded-[1.5rem] border border-green-50 shadow-sm flex gap-4 transition-all hover:shadow-lg group">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-gray-100">
                    <img src={item.image_url} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-black text-gray-900 text-sm truncate pr-2 tracking-tight">{item.item_name}</h4>
                      <span className={cn(
                        "text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-tighter border",
                        item.status === 'approved' ? "bg-amber-50 text-amber-700 border-amber-100" :
                        item.status === 'completed' ? "bg-green-50 text-green-700 border-green-100" :
                        "bg-gray-50 text-gray-400 border-gray-100"
                      )}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-3">{item.item_weight}gr • {item.item_karat}K</p>
                    
                    <div className="flex justify-between items-center border-t border-green-50/50 pt-3">
                      <div>
                        {item.loan_amount > 0 && (
                          <p className="font-black text-[#136f42] text-sm tracking-tighter">{formatRupiah(item.loan_amount)}</p>
                        )}
                      </div>
                      {item.status === 'approved' && (
                        <button 
                          onClick={() => { setItemToRedeem(item); setShowPinModal(true); }}
                          className="bg-[#136f42] hover:bg-[#0f5c35] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md transition-all active:scale-90 flex items-center gap-1.5"
                        >
                          <ShoppingBag size={12} strokeWidth={3} /> Tebus
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
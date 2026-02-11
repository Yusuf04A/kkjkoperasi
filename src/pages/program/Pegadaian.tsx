import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { formatRupiah, cn } from '../../lib/utils';
import {
  ArrowLeft, Upload, Loader2, Clock, CheckCircle,
  XCircle, Coins, Scale, Camera, AlertCircle, ShoppingBag,
  RefreshCw, ChevronRight, History
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PinModal } from '../../components/PinModal';

export const Pegadaian = () => {
  const navigate = useNavigate();
  const { user, checkSession } = useAuthStore();

  // 1. STATE & STORAGE
  const [activeTab, setActiveTab] = useState<'apply' | 'history'>(() => {
    return (localStorage.getItem('pegadaian_active_tab') as 'apply' | 'history') || 'apply';
  });

  const [formData, setFormData] = useState({ itemName: '', weight: '', karat: '24', condition: 'Baik' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // History & Redeem State
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [itemToRedeem, setItemToRedeem] = useState<any>(null);
  const [showPinModal, setShowPinModal] = useState(false);

  // 2. EFFECT: Simpan Tab Terakhir
  useEffect(() => {
    localStorage.setItem('pegadaian_active_tab', activeTab);
  }, [activeTab]);

  // 3. EFFECT: Fetch Data (Fix Refresh Issue)
  useEffect(() => {
    const init = async () => {
      // Cek sesi jika user null (misal pas refresh)
      if (!user) {
        await checkSession();
      }
      // Jika tab history aktif, ambil data
      if (activeTab === 'history') {
        fetchHistory();
      }
    };
    init();
  }, [user, activeTab]); // Dependencies penting: user & activeTab

  const fetchHistory = async () => {
    // Pastikan user ada sebelum fetch (Supabase butuh user_id untuk policy RLS)
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

  // --- FORM HANDLERS ---
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
    const toastId = toast.loading("Mengunggah data...");

    try {
      // Upload Foto
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('pawn_images').upload(fileName, imageFile);
      if (uploadError) throw uploadError;

      const imageUrl = supabase.storage.from('pawn_images').getPublicUrl(fileName).data.publicUrl;

      // Insert Data
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

      // Reset
      setFormData({ itemName: '', weight: '', karat: '24', condition: 'Baik' });
      setImageFile(null);
      setImagePreview(null);
      setActiveTab('history'); // Pindah ke tab history untuk lihat status

    } catch (err: any) {
      toast.error("Gagal: " + err.message, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- REDEEM LOGIC (TEBUS) ---
  const handleRedeemClick = (item: any) => {
    if ((user?.tapro_balance || 0) < item.loan_amount) {
      toast.error("Saldo Tapro tidak mencukupi untuk menebus barang ini.");
      return;
    }
    setItemToRedeem(item);
    setShowPinModal(true);
  };

  const executeRedeem = async () => {
    if (!itemToRedeem) return;
    const toastId = toast.loading("Memproses penebusan...");

    try {
      // 1. Kurangi Saldo Tapro
      const { error: errSaldo } = await supabase.from('profiles')
        .update({ tapro_balance: (user?.tapro_balance || 0) - itemToRedeem.loan_amount })
        .eq('id', user?.id);
      if (errSaldo) throw errSaldo;

      // 2. Update Status Gadai -> Completed
      const { error: errUpdate } = await supabase.from('pawn_transactions')
        .update({ status: 'completed' })
        .eq('id', itemToRedeem.id);
      if (errUpdate) throw errUpdate;

      // 3. Catat Transaksi Keluar
      await supabase.from('transactions').insert({
        user_id: user?.id,
        type: 'withdraw', // Uang keluar
        amount: itemToRedeem.loan_amount,
        status: 'success',
        description: `Tebus Gadai: ${itemToRedeem.item_name}`
      });

      // 4. Notifikasi
      await supabase.from('notifications').insert({
        user_id: user?.id,
        title: 'Barang Ditebus ✅',
        message: `Anda berhasil menebus ${itemToRedeem.item_name}.`,
        type: 'success'
      });

      toast.success("Barang berhasil ditebus!", { id: toastId });
      await checkSession(); // Update saldo di UI
      fetchHistory(); // Refresh list
      setItemToRedeem(null);

    } catch (err: any) {
      toast.error("Gagal: " + err.message, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 overflow-y-scroll">

      {/* HEADER */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 transition"><ArrowLeft size={20} /></button>
          <h1 className="text-base font-bold text-gray-900">Pegadaian Syariah</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6">

        {/* HERO SECTION */}
        <div className="bg-gradient-to-r from-emerald-700 to-teal-600 rounded-3xl p-6 lg:p-10 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center gap-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <div className="relative z-10 flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Scale className="text-emerald-200" size={20} />
              <span className="font-bold tracking-widest text-emerald-200 text-xs uppercase">Solusi Dana Cepat</span>
            </div>
            <h2 className="text-2xl lg:text-4xl font-bold mb-4 leading-tight">
              Gadai Emas Amanah <br /> Cair Dalam Hitungan Menit
            </h2>
            <p className="text-emerald-50 text-sm lg:text-base leading-relaxed mb-6 max-w-lg">
              Dapatkan dana tunai dengan agunan emas Anda. Taksiran tinggi, biaya titip ringan, dan barang aman berasuransi.
            </p>
            <div className="flex gap-4 text-xs font-medium">
              <div className="bg-white/20 px-3 py-1.5 rounded-lg flex items-center gap-2 border border-white/10">
                <CheckCircle size={14} /> Syariah
              </div>
              <div className="bg-white/20 px-3 py-1.5 rounded-lg flex items-center gap-2 border border-white/10">
                <CheckCircle size={14} /> Aman
              </div>
            </div>
          </div>
          <div className="hidden md:block w-1/3 flex justify-center">
            <div className="bg-white/10 p-6 rounded-full backdrop-blur-md border border-white/20">
              <Coins size={64} className="text-white drop-shadow-md" />
            </div>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex p-1 bg-gray-200/60 rounded-xl w-full max-w-md mx-auto mb-6">
          <button
            onClick={() => setActiveTab('apply')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'apply' ? 'bg-white text-emerald-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <Upload size={16} /> Ajukan Gadai
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'history' ? 'bg-white text-emerald-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <History size={16} /> Riwayat Gadai
          </button>
        </div>

        {/* CONTENT AREA */}
        {activeTab === 'apply' ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8 max-w-2xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Upload Foto */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Foto Barang</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer relative bg-gray-50 group">
                  <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  {imagePreview ? (
                    <div className="relative h-56 w-full">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-contain rounded-lg shadow-sm" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity rounded-lg backdrop-blur-sm">
                        <Camera size={24} className="mr-2" /> Ganti Foto
                      </div>
                    </div>
                  ) : (
                    <div className="py-10 text-gray-400 flex flex-col items-center group-hover:text-emerald-600 transition-colors">
                      <div className="bg-white p-3 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                        <Camera size={32} />
                      </div>
                      <span className="text-sm font-medium">Ketuk untuk ambil foto emas</span>
                      <span className="text-xs text-gray-300 mt-1">Format JPG/PNG, Max 5MB</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Inputs */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nama Barang</label>
                  <input required name="itemName" value={formData.itemName} onChange={handleChange} placeholder="Contoh: Kalung Emas 5 Gram" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Berat (Gram)</label>
                    <input required type="number" step="0.01" name="weight" value={formData.weight} onChange={handleChange} placeholder="0.00" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Karat</label>
                    <select name="karat" value={formData.karat} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none transition-all">
                      <option value="24">24 Karat (99%)</option>
                      <option value="23">23 Karat</option>
                      <option value="22">22 Karat</option>
                      <option value="18">18 Karat</option>
                      <option value="16">16 Karat</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Kondisi Fisik</label>
                  <input required name="condition" value={formData.condition} onChange={handleChange} placeholder="Contoh: Mulus, Nota Lengkap" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none transition-all" />
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-xl flex gap-3 items-start border border-yellow-100">
                <AlertCircle size={18} className="text-yellow-600 mt-0.5 shrink-0" />
                <p className="text-xs text-yellow-800 leading-relaxed">
                  Admin akan meninjau foto dan data untuk menentukan <b>Nilai Taksiran</b>. Jika Anda setuju dengan nilai tersebut, dana akan langsung cair ke Saldo Tapro.
                </p>
              </div>

              <button
                disabled={isSubmitting}
                className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform active:scale-[0.98]"
              >
                {isSubmitting ? <Loader2 className="animate-spin" /> : "Kirim Pengajuan Gadai"}
              </button>
            </form>
          </div>
        ) : (
          // --- TAB RIWAYAT ---
          <div className="max-w-3xl mx-auto space-y-4 animate-in slide-in-from-bottom-4 duration-500">
            {loadingHistory ? (
              <div className="text-center py-20 text-gray-400 flex flex-col items-center">
                <Loader2 className="animate-spin mb-2" size={32} />
                <p>Memuat riwayat...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 border-dashed">
                <Scale size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-bold text-gray-900">Belum ada gadai</h3>
                <p className="text-gray-500 text-sm mt-1">Ajukan gadai sekarang untuk mendapatkan dana cepat.</p>
                <button onClick={() => setActiveTab('apply')} className="mt-4 text-emerald-600 font-bold text-sm hover:underline">
                  Mulai Pengajuan
                </button>
              </div>
            ) : (
              history.map((item) => (
                <div key={item.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-5 items-start transition-all hover:border-emerald-200 hover:shadow-md">

                  {/* Gambar */}
                  <div className="w-full md:w-24 h-24 bg-gray-100 rounded-xl overflow-hidden shrink-0 border border-gray-100">
                    <img src={item.image_url} alt="Item" className="w-full h-full object-cover" />
                  </div>

                  {/* Detail */}
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-gray-900 text-base truncate pr-2">{item.item_name}</h4>
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${item.status === 'approved' ? 'bg-orange-100 text-orange-700' :
                          item.status === 'completed' ? 'bg-green-100 text-green-700' :
                            item.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                        }`}>
                        {item.status === 'pending' ? 'Review Admin' :
                          item.status === 'approved' ? 'Sedang Gadai' :
                            item.status === 'completed' ? 'Selesai / Lunas' : 'Ditolak'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                      <span className="bg-gray-100 px-2 py-0.5 rounded">{item.item_weight} Gram</span>
                      <span className="bg-gray-100 px-2 py-0.5 rounded">{item.item_karat} Karat</span>
                      <span className="italic truncate max-w-[150px]">{item.item_condition}</span>
                    </div>

                    {/* Info Nominal & Tombol */}
                    <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-3 border-t border-gray-50 pt-3">
                      <div>
                        {(item.status === 'approved' || item.status === 'completed') ? (
                          <>
                            <p className="text-[10px] text-gray-400 uppercase font-bold">Nilai Pinjaman</p>
                            <p className="font-bold text-emerald-700 text-lg">{formatRupiah(item.loan_amount)}</p>
                          </>
                        ) : (
                          <p className="text-xs text-gray-400 italic">Menunggu taksiran admin...</p>
                        )}
                      </div>

                      {/* Tombol Tebus */}
                      {item.status === 'approved' && (
                        <button
                          onClick={() => handleRedeemClick(item)}
                          className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-orange-500/20"
                        >
                          <ShoppingBag size={14} /> Tebus Barang
                        </button>
                      )}

                      {item.status === 'completed' && (
                        <span className="text-xs font-bold text-green-600 flex items-center gap-1 bg-green-50 px-3 py-1.5 rounded-lg">
                          <CheckCircle size={14} /> Barang Sudah Ditebus
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modal PIN Konfirmasi Tebus */}
      <PinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={executeRedeem}
        title="Konfirmasi Penebusan"
      />
    </div>
  );
};
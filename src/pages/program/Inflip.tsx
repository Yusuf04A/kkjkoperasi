import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { formatRupiah, cn } from '../../lib/utils';
import {
  ArrowLeft, Building, MapPin, TrendingUp,
  CheckCircle, X, AlertCircle, Loader2,
  Briefcase, Search, Clock, PieChart, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PinModal } from '../../components/PinModal';

export const Inflip = () => {
  const navigate = useNavigate();
  const { user, checkSession } = useAuthStore();

  // State Data
  const [projects, setProjects] = useState<any[]>([]);
  const [myInvestments, setMyInvestments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // State UI (Menggunakan localStorage agar tahan refresh)
  const [activeTab, setActiveTab] = useState<'browse' | 'portfolio'>(() => {
    return (localStorage.getItem('inflip_active_tab') as 'browse' | 'portfolio') || 'browse';
  });

  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [investAmount, setInvestAmount] = useState<string>('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Simpan tab ke localStorage setiap kali berubah
  useEffect(() => {
    localStorage.setItem('inflip_active_tab', activeTab);
  }, [activeTab]);

  // 1. Fetch Data
  useEffect(() => {
    const init = async () => {
      if (!user) await checkSession();
      fetchData();
    };
    init();
  }, [user, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'browse') {
        const { data, error } = await supabase
          .from('inflip_projects')
          .select('*')
          .eq('status', 'open')
          .order('created_at', { ascending: false });
        if (error) throw error;
        setProjects(data || []);
      } else {
        if (!user) return;
        const { data, error } = await supabase
          .from('inflip_investments')
          .select(`*, project:inflip_projects (*)`)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setMyInvestments(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Logic Investasi
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setInvestAmount(raw ? parseInt(raw).toLocaleString('id-ID') : '');
  };

  const handleInitialSubmit = () => {
    const cleanAmount = investAmount ? parseInt(investAmount.replace(/\./g, '')) : 0;

    if (!user) { toast.error("Silakan login dahulu"); return; }
    if (cleanAmount < (selectedProject?.min_investment || 0)) {
      toast.error(`Minimal investasi ${formatRupiah(selectedProject?.min_investment)}`);
      return;
    }
    if (cleanAmount > (user.tapro_balance || 0)) {
      toast.error("Saldo Tapro tidak mencukupi");
      return;
    }
    setShowPinModal(true);
  };

  const executeInvestment = async () => {
    setIsSubmitting(true);
    const toastId = toast.loading("Memproses investasi...");
    const cleanAmount = parseInt(investAmount.replace(/\./g, ''));

    try {
      // A. Insert Investasi
      const { error: errInvest } = await supabase.from('inflip_investments').insert({
        user_id: user?.id,
        project_id: selectedProject.id,
        amount: cleanAmount,
        status: 'active'
      });
      if (errInvest) throw errInvest;

      // B. Potong Saldo Tapro
      const { error: errBalance } = await supabase.from('profiles')
        .update({ tapro_balance: (user?.tapro_balance || 0) - cleanAmount })
        .eq('id', user?.id);
      if (errBalance) throw errBalance;

      // C. Update Progress Proyek
      const { error: errProject } = await supabase.from('inflip_projects')
        .update({ collected_amount: selectedProject.collected_amount + cleanAmount })
        .eq('id', selectedProject.id);
      if (errProject) throw errProject;

      // D. Catat Transaksi
      await supabase.from('transactions').insert({
        user_id: user?.id,
        type: 'withdraw',
        amount: cleanAmount,
        status: 'success',
        description: `Investasi INFLIP: ${selectedProject.title}`
      });

      // E. Buat Notifikasi Database (Agar muncul di lonceng notif)
      await supabase.from('notifications').insert({
        user_id: user?.id,
        title: 'Investasi Berhasil 🎉',
        message: `Anda berhasil berinvestasi sebesar ${formatRupiah(cleanAmount)} pada proyek "${selectedProject.title}".`,
        type: 'success'
      });

      toast.success("Investasi Berhasil!", { id: toastId });

      // Reset & Pindah ke Tab Portfolio
      setInvestAmount('');
      setSelectedProject(null);
      setActiveTab('portfolio'); // Otomatis pindah ke tab portofolio
      checkSession();
      // Data akan di-fetch ulang karena activeTab berubah

    } catch (err: any) {
      toast.error("Gagal: " + err.message, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // FIX LAYOUT GESER: overflow-y-scroll memaksa scrollbar selalu ada
    <div className="min-h-screen bg-gray-50 pb-24 overflow-y-scroll">

      {/* HEADER */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 transition">
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <h1 className="text-base font-bold text-gray-900">INFLIP (Properti)</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6">

        {/* HERO SECTION */}
        <div className="bg-[#0B2B4B] rounded-3xl p-6 lg:p-10 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center gap-6 border-b-4 border-yellow-500">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl -ml-5 -mb-5"></div>

          <div className="relative z-10 flex-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-white/10 rounded-lg">
                <Building className="text-blue-200" size={18} />
              </div>
              <span className="font-bold tracking-widest text-blue-200 text-xs uppercase">Investment Flipping Property</span>
            </div>
            <h2 className="text-2xl lg:text-4xl font-bold mb-4 leading-tight">
              Bangun Aset Properti <br /> Tanpa Modal Besar
            </h2>
            <p className="text-blue-100 text-sm lg:text-base leading-relaxed mb-6 max-w-lg">
              Platform investasi patungan untuk proyek renovasi dan jual beli properti. Aman, transparan, dan dikelola profesional oleh Koperasi KKJ.
            </p>
            <div className="flex gap-3 text-xs font-medium">
              <div className="bg-white/10 px-3 py-1.5 rounded-lg flex items-center gap-2 border border-white/10">
                <CheckCircle size={14} className="text-green-400" /> ROI s.d 20%
              </div>
              <div className="bg-white/10 px-3 py-1.5 rounded-lg flex items-center gap-2 border border-white/10">
                <CheckCircle size={14} className="text-green-400" /> Legalitas Jelas
              </div>
            </div>
          </div>

          <div className="hidden md:block w-1/3 aspect-video bg-blue-900/50 rounded-2xl overflow-hidden border border-blue-500/30 shadow-lg relative">
            <img
              src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80"
              alt="Property"
              className="w-full h-full object-cover opacity-80 mix-blend-overlay"
            />
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex p-1 bg-gray-200/60 rounded-xl w-full max-w-md mx-auto mb-6">
          <button
            onClick={() => setActiveTab('browse')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'browse' ? 'bg-white text-[#0B2B4B] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <Search size={16} /> Jelajahi Proyek
          </button>
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'portfolio' ? 'bg-white text-[#0B2B4B] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <Briefcase size={16} /> Portofolio Saya
          </button>
        </div>

        {/* CONTENT AREA */}
        <div>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 className="animate-spin mb-2" size={32} />
              <p>Memuat data...</p>
            </div>
          ) : activeTab === 'browse' ? (
            // --- TAB BROWSE ---
            <>
              {projects.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 border-dashed">
                  <Building size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 font-medium">Belum ada proyek dibuka saat ini.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.map((item) => {
                    const progress = Math.min((item.collected_amount / item.target_amount) * 100, 100);
                    return (
                      <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden group flex flex-col h-full">
                        <div className="h-48 bg-gray-200 relative overflow-hidden">
                          <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-bold text-[#0B2B4B] shadow-sm flex items-center gap-1">
                            <TrendingUp size={12} /> ROI {item.roi_percent}%
                          </div>
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                          <div className="mb-4">
                            <h4 className="font-bold text-gray-900 text-lg leading-tight mb-1 line-clamp-2">{item.title}</h4>
                            <div className="flex items-center gap-1 text-gray-500 text-xs">
                              <MapPin size={12} /> {item.location}
                            </div>
                          </div>
                          <div className="mb-4">
                            <div className="flex justify-between text-xs mb-1.5 font-medium">
                              <span className="text-gray-500">Terkumpul</span>
                              <span className="text-[#0B2B4B]">{Math.round(progress)}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                              <div className="bg-[#0B2B4B] h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                            </div>
                            <div className="flex justify-between text-xs mt-1.5 font-mono text-gray-500">
                              <span>{formatRupiah(item.collected_amount)}</span>
                              <span className="text-gray-400">Target: {formatRupiah(item.target_amount)}</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3 mb-5 mt-auto">
                            <div className="bg-gray-50 p-2 rounded-lg text-center border border-gray-100">
                              <p className="text-[10px] text-gray-400 uppercase font-bold">Min. Invest</p>
                              <p className="text-xs font-bold text-gray-900">{formatRupiah(item.min_investment)}</p>
                            </div>
                            <div className="bg-gray-50 p-2 rounded-lg text-center border border-gray-100">
                              <p className="text-[10px] text-gray-400 uppercase font-bold">Tenor</p>
                              <p className="text-xs font-bold text-gray-900">{item.duration_months} Bulan</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedProject(item)}
                            className="w-full bg-kkj-blue text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/10 flex items-center justify-center gap-2"
                          >
                            Lihat Detail <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            // --- TAB PORTFOLIO ---
            <>
              {myInvestments.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 border-dashed">
                  <PieChart size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 font-medium">Anda belum memiliki investasi properti.</p>
                  <button onClick={() => setActiveTab('browse')} className="mt-4 text-blue-600 font-bold text-sm hover:underline">
                    Mulai Investasi Sekarang
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myInvestments.map((inv) => (
                    <div key={inv.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex gap-4 items-center hover:border-blue-200 transition-colors">
                      <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                        <img src={inv.project?.image_url} alt="Project" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold text-gray-900 text-sm truncate pr-2">{inv.project?.title}</h4>
                          <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                            Aktif
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                          <Clock size={12} /> Berakhir dlm {inv.project?.duration_months} Bulan
                        </p>
                        <div className="flex justify-between items-end border-t border-gray-50 pt-2">
                          <div>
                            <p className="text-[10px] text-gray-400">Nilai Investasi</p>
                            <p className="font-bold text-[#0B2B4B]">{formatRupiah(inv.amount)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-gray-400">Est. Return</p>
                            <p className="font-bold text-green-600">+{inv.project?.roi_percent}%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

      </div>

      {/* MODAL INVESTASI */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedProject(null)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0">
            <button onClick={() => setSelectedProject(null)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><X size={20} className="text-gray-600" /></button>
            <h3 className="font-bold text-xl text-gray-900 mb-1">Mulai Investasi</h3>
            <p className="text-sm text-gray-500 mb-6">{selectedProject.title}</p>
            <div className="space-y-5">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Nominal</label>
                  <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded">Saldo: {formatRupiah(user?.tapro_balance || 0)}</span>
                </div>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">Rp</span>
                  <input type="text" value={investAmount} onChange={handleAmountChange} placeholder={`Min ${parseInt(selectedProject.min_investment).toLocaleString('id-ID')}`} className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-xl text-gray-900 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all" />
                </div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 text-xs text-yellow-800 leading-relaxed flex gap-3">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <p>Dana akan dikunci selama <b>{selectedProject.duration_months} bulan</b>. Estimasi profit <b>{selectedProject.roi_percent}%</b> (prorata) dibagikan di akhir tenor.</p>
              </div>
              <button onClick={handleInitialSubmit} disabled={isSubmitting} className="w-full bg-kkj-blue text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {isSubmitting ? <Loader2 className="animate-spin" /> : "Konfirmasi Investasi"}
              </button>
            </div>
          </div>
        </div>
      )}

      <PinModal isOpen={showPinModal} onClose={() => setShowPinModal(false)} onSuccess={executeInvestment} title="Konfirmasi INFLIP" />
    </div>
  );
};
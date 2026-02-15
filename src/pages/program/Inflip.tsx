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

  // State UI
  const [activeTab, setActiveTab] = useState<'browse' | 'portfolio'>(() => {
    return (localStorage.getItem('inflip_active_tab') as 'browse' | 'portfolio') || 'browse';
  });

  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [investAmount, setInvestAmount] = useState<string>('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    localStorage.setItem('inflip_active_tab', activeTab);
  }, [activeTab]);

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
      const { error: errInvest } = await supabase.from('inflip_investments').insert({
        user_id: user?.id,
        project_id: selectedProject.id,
        amount: cleanAmount,
        status: 'active'
      });
      if (errInvest) throw errInvest;

      const { error: errBalance } = await supabase.from('profiles')
        .update({ tapro_balance: (user?.tapro_balance || 0) - cleanAmount })
        .eq('id', user?.id);
      if (errBalance) throw errBalance;

      const { error: errProject } = await supabase.from('inflip_projects')
        .update({ collected_amount: selectedProject.collected_amount + cleanAmount })
        .eq('id', selectedProject.id);
      if (errProject) throw errProject;

      await supabase.from('transactions').insert({
        user_id: user?.id,
        type: 'withdraw',
        amount: cleanAmount,
        status: 'success',
        description: `Investasi INFLIP: ${selectedProject.title}`
      });

      await supabase.from('notifications').insert({
        user_id: user?.id,
        title: 'Investasi Berhasil 🎉',
        message: `Anda berhasil berinvestasi sebesar ${formatRupiah(cleanAmount)} pada proyek "${selectedProject.title}".`,
        type: 'success'
      });

      toast.success("Investasi Berhasil!", { id: toastId });
      setInvestAmount('');
      setSelectedProject(null);
      setActiveTab('portfolio');
      checkSession();
    } catch (err: any) {
      toast.error("Gagal: " + err.message, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 overflow-y-scroll font-sans">

      {/* HEADER (HIJAU KONSISTEN) */}
      <div className="sticky top-0 z-30 bg-white border-b border-green-100 shadow-sm">
        <div className="px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-green-50 text-[#136f42] transition-colors"
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
          <h1 className="text-lg font-bold text-gray-900 leading-none">
            INFLIP (Properti)
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6">

        {/* HERO SECTION (HIJAU HUTAN) */}
        <div className="bg-[#136f42] rounded-[2rem] p-6 lg:p-10 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center gap-6">
          <div className="absolute inset-0 bg-gradient-to-br from-[#167d4a] to-[#0f5c35] z-0" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10" />

          <div className="relative z-10 flex-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-md border border-white/10">
                <Building className="text-[#aeea00]" size={18} />
              </div>
              <span className="font-black tracking-[0.2em] text-[#aeea00] text-[10px] uppercase">Investment Flipping Property</span>
            </div>
            <h2 className="text-2xl lg:text-4xl font-black mb-4 leading-tight tracking-tight">
              Bangun Aset Properti <br /> Tanpa Modal Besar
            </h2>
            <p className="text-green-50/80 text-sm lg:text-base leading-relaxed mb-6 max-w-lg font-medium">
              Platform investasi patungan untuk proyek renovasi dan jual beli properti. Aman, transparan, dan dikelola profesional oleh Koperasi KKJ.
            </p>
            <div className="flex gap-3 text-[10px] font-black uppercase tracking-widest">
              <div className="bg-white/10 px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10 shadow-sm">
                <CheckCircle size={14} className="text-[#aeea00]" /> ROI s.d 20%
              </div>
              <div className="bg-white/10 px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10 shadow-sm">
                <CheckCircle size={14} className="text-[#aeea00]" /> Legalitas Aman
              </div>
            </div>
          </div>

          <div className="hidden md:block w-1/3 aspect-video bg-white/5 rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative rotate-2">
            <img
              src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80"
              alt="Property"
              className="w-full h-full object-cover opacity-90"
            />
          </div>
        </div>

        {/* TABS NAVIGATION (HIJAU KONSISTEN) */}
        <div className="flex p-1.5 bg-green-900/5 rounded-2xl w-full max-w-md mx-auto mb-6 border border-green-100">
          <button
            onClick={() => setActiveTab('browse')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
              activeTab === 'browse' ? 'bg-white text-[#136f42] shadow-md border border-green-50' : 'text-gray-400 hover:text-[#136f42]'
            }`}
          >
            <Search size={16} /> Jelajah
          </button>
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
              activeTab === 'portfolio' ? 'bg-white text-[#136f42] shadow-md border border-green-50' : 'text-gray-400 hover:text-[#136f42]'
            }`}
          >
            <Briefcase size={16} /> Portofolio
          </button>
        </div>

        {/* CONTENT AREA */}
        <div>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <Loader2 className="animate-spin mb-3 text-[#136f42]" size={32} />
              <p className="text-sm font-bold uppercase tracking-widest">Memuat Proyek...</p>
            </div>
          ) : activeTab === 'browse' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.length === 0 ? (
                <div className="col-span-full text-center py-24 bg-white rounded-[2rem] border border-green-100 border-dashed">
                  <Building size={48} className="mx-auto text-green-100 mb-4" />
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Belum ada proyek dibuka</p>
                </div>
              ) : projects.map((item) => {
                const progress = Math.min((item.collected_amount / item.target_amount) * 100, 100);
                return (
                  <div key={item.id} className="bg-white rounded-[2rem] border border-green-50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 overflow-hidden group flex flex-col h-full">
                    <div className="h-48 relative overflow-hidden">
                      <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      <div className="absolute top-3 right-3 bg-[#aeea00] px-3 py-1 rounded-full text-[10px] font-black text-[#136f42] shadow-lg flex items-center gap-1">
                        <TrendingUp size={12} /> ROI {item.roi_percent}%
                      </div>
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="mb-4">
                        <h4 className="font-black text-gray-900 text-lg leading-tight mb-2 tracking-tight group-hover:text-[#136f42] transition-colors">{item.title}</h4>
                        <div className="flex items-center gap-1 text-gray-400 text-[10px] font-bold uppercase tracking-wide">
                          <MapPin size={12} className="text-[#136f42]" /> {item.location}
                        </div>
                      </div>
                      <div className="mb-6">
                        <div className="flex justify-between text-[10px] mb-2 font-black uppercase tracking-tighter">
                          <span className="text-gray-400">Pendanaan</span>
                          <span className="text-[#136f42]">{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden shadow-inner">
                          <div className="bg-[#136f42] h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                        </div>
                        <div className="flex justify-between text-[10px] mt-2 font-bold font-mono text-gray-400">
                          <span className="text-[#136f42]">{formatRupiah(item.collected_amount)}</span>
                          <span>Target: {formatRupiah(item.target_amount)}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-6 mt-auto">
                        <div className="bg-green-50/50 p-3 rounded-xl text-center border border-green-100">
                          <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest mb-1">Min. Invest</p>
                          <p className="text-xs font-black text-[#136f42] tracking-tighter">{formatRupiah(item.min_investment)}</p>
                        </div>
                        <div className="bg-green-50/50 p-3 rounded-xl text-center border border-green-100">
                          <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest mb-1">Tenor</p>
                          <p className="text-xs font-black text-[#136f42] tracking-tighter">{item.duration_months} Bulan</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedProject(item)}
                        className="w-full bg-[#136f42] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#0f5c35] transition-all shadow-lg shadow-green-900/10 active:scale-95 flex items-center justify-center gap-2"
                      >
                        Ikut Patungan <ChevronRight size={16} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myInvestments.length === 0 ? (
                <div className="col-span-full text-center py-24 bg-white rounded-[2rem] border border-green-100 border-dashed">
                  <PieChart size={48} className="mx-auto text-green-100 mb-4" />
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Belum ada investasi</p>
                </div>
              ) : myInvestments.map((inv) => (
                <div key={inv.id} className="bg-white p-5 rounded-[1.5rem] border border-green-50 shadow-sm flex gap-4 items-center hover:border-[#136f42] transition-all group">
                  <div className="w-20 h-20 bg-gray-100 rounded-2xl overflow-hidden shrink-0">
                    <img src={inv.project?.image_url} alt="Project" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-black text-gray-900 text-sm truncate pr-2 group-hover:text-[#136f42] transition-colors">{inv.project?.title}</h4>
                      <span className="bg-green-50 text-green-700 text-[8px] px-2 py-1 rounded-full font-black uppercase tracking-widest border border-green-100">
                        Aktif
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 mb-3 flex items-center gap-1 font-bold uppercase">
                      <Clock size={12} className="text-[#136f42]" /> Tenor {inv.project?.duration_months} Bln
                    </p>
                    <div className="flex justify-between items-end border-t border-green-50 pt-2">
                      <div>
                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Modal</p>
                        <p className="font-black text-sm text-[#136f42] tracking-tighter">{formatRupiah(inv.amount)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Return</p>
                        <p className="font-black text-sm text-[#aeea00] drop-shadow-sm">+{inv.project?.roi_percent}%</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL INVESTASI (HIJAU RAPI) */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="fixed inset-0 bg-[#0f5c35]/80 backdrop-blur-md" onClick={() => setSelectedProject(null)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom-20 duration-500">
            <button onClick={() => setSelectedProject(null)} className="absolute top-6 right-6 p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors text-gray-400"><X size={20} /></button>
            <h3 className="font-black text-2xl text-gray-900 tracking-tighter mb-1">Mulai Investasi</h3>
            <p className="text-sm text-gray-400 font-medium mb-8 leading-tight">{selectedProject.title}</p>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Nominal Patungan</label>
                  <span className="text-[10px] text-[#136f42] font-black bg-green-50 px-3 py-1 rounded-full border border-green-100 uppercase tracking-tighter">Saldo: {formatRupiah(user?.tapro_balance || 0)}</span>
                </div>
                <div className="relative group">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-gray-300 text-xl group-focus-within:text-[#136f42] transition-colors">Rp</span>
                  <input type="text" value={investAmount} onChange={handleAmountChange} placeholder={`Min ${parseInt(selectedProject.min_investment).toLocaleString('id-ID')}`} className="w-full pl-14 pr-4 py-5 bg-gray-50 border border-gray-100 rounded-2xl font-black text-2xl text-gray-900 focus:bg-white focus:ring-4 focus:ring-green-50 focus:border-[#136f42] outline-none transition-all placeholder:text-gray-200" />
                </div>
              </div>
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-[11px] text-amber-800 leading-relaxed flex gap-3 shadow-sm">
                <AlertCircle size={18} className="shrink-0 text-amber-600 mt-0.5" />
                <p className="font-medium">Dana akan dikunci selama <b>{selectedProject.duration_months} bulan</b>. Estimasi profit <b>{selectedProject.roi_percent}%</b> (prorata) akan dibagikan ke saldo Tapro di akhir tenor.</p>
              </div>
              <button onClick={handleInitialSubmit} disabled={isSubmitting} className="w-full bg-[#136f42] text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-[#0f5c35] transition-all shadow-xl shadow-green-900/20 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-3">
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
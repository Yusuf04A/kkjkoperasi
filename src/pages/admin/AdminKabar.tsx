import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, EyeOff, Trash2, ArrowLeft, Megaphone, Clock, CheckCircle2, AlertCircle, Eye, Info } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

interface KabarKKJ {
  id: string;
  title: string;
  description: string;
  type: 'PROMO' | 'INFO' | 'RAT' | 'PROGRAM';
  color: 'blue' | 'yellow' | 'green' | 'biru_tua' | 'red';
  is_active: boolean;
  created_at: string;
  image_url?: string | null;
}

export default function AdminKabar() {
  const [list, setList] = useState<KabarKKJ[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔥 STATE BARU UNTUK CUSTOM POPUP CONFIRMATION 🔥
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    kabarId: string;
    kabarTitle: string;
  }>({
    isOpen: false,
    kabarId: '',
    kabarTitle: ''
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-600',
    biru_tua: 'bg-[#003366]',
    yellow: 'bg-amber-400',
    green: 'bg-[#136f42]', 
    red: 'bg-rose-600',
  };

  const fetchData = async () => {
    const { data } = await supabase
      .from('kabar_kkj')
      .select('*')
      .order('created_at', { ascending: false });

    setList(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleActive = async (id: string, active: boolean) => {
    const toastId = toast.loading('memperbarui status...');
    try {
        await supabase.from('kabar_kkj').update({ is_active: !active }).eq('id', id);
        toast.success('status kabar diperbarui', { id: toastId });
        fetchData();
    } catch (err) {
        toast.error('gagal memperbarui status', { id: toastId });
    }
  };

  // --- 🔥 LOGIKA HAPUS KABAR (VIA CUSTOM MODAL) 🔥 ---
  const triggerDelete = (id: string, title: string) => {
    setConfirmModal({
        isOpen: true,
        kabarId: id,
        kabarTitle: title
    });
  };

  const executeDelete = async () => {
    setIsDeleting(true);
    const toastId = toast.loading('menghapus kabar...');
    try {
      const { error } = await supabase.from('kabar_kkj').delete().eq('id', confirmModal.kabarId);
      if (error) throw error;
      
      toast.success('kabar berhasil dihapus', { id: toastId });
      setConfirmModal({ isOpen: false, kabarId: '', kabarTitle: '' });
      fetchData();
    } catch (err: any) {
      toast.error('gagal menghapus: ' + err.message, { id: toastId });
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#136f42]"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans text-slate-900">
      {/* HEADER */}
      <div className="bg-white border-b sticky top-0 z-30 px-6 py-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <Link 
              to="/admin/dashboard" 
              className="flex items-center gap-2 text-gray-400 hover:text-[#136f42] transition-all group w-fit"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-bold lowercase">kembali</span>
            </Link>

            <div className="flex flex-col mt-1">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-none lowercase">manajemen kabar kkj</h1>
              <p className="text-sm text-gray-500 font-medium mt-1 lowercase">kelola pengumuman dan berita terbaru untuk anggota</p>
            </div>
          </div>
          
          <Link
            to="/admin/kabar/tambah"
            className="bg-[#136f42] text-white text-xs font-black uppercase tracking-widest px-6 py-3.5 rounded-xl hover:bg-[#0f5c35] transition shadow-lg shadow-green-900/20 flex items-center justify-center gap-2 active:scale-95"
          >
            <Plus size={18} strokeWidth={3} /> tambah kabar kkj
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {list.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-20 text-center border-2 border-dashed border-gray-100 shadow-sm">
            <Megaphone size={48} className="mx-auto text-gray-200 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 lowercase">belum ada kabar terbaru</h3>
            <p className="text-gray-500 text-sm max-w-xs mx-auto mt-2 font-medium lowercase">
              mulai buat pengumuman pertama anda untuk seluruh anggota koperasi hari ini.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {list.map((item) => (
              <div key={item.id} className="bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 group flex flex-col h-full border-b-4 border-b-transparent hover:border-b-[#136f42]">
                
                <div className={cn("h-48 relative overflow-hidden bg-gray-200", !item.image_url && (colorMap[item.color] || 'bg-gray-600'))}>
                  {item.image_url ? (
                    <>
                      <img 
                        src={item.image_url} 
                        alt={item.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
                    </>
                  ) : (
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500 text-white">
                      <Megaphone size={120} strokeWidth={1} />
                    </div>
                  )}

                  <div className="absolute top-5 left-5 z-10">
                    <span className="bg-white/20 backdrop-blur-md text-white text-[9px] font-black px-3 py-1.5 rounded-lg border border-white/20 tracking-[0.2em] uppercase shadow-lg">
                        {item.type}
                    </span>
                  </div>
                  
                  <div className="absolute bottom-4 left-5 z-10 flex items-center gap-1.5 text-white/90 text-[10px] font-bold tracking-wider uppercase">
                    <Clock size={12} className="text-[#aeea00]" />
                    {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <h3 className="font-bold text-slate-800 leading-tight text-base line-clamp-2 min-h-[2.75rem] group-hover:text-[#136f42] transition-colors uppercase tracking-tight">
                      {item.title}
                    </h3>
                    <div className={cn(
                      "p-1.5 rounded-lg shrink-0 transition-colors",
                      item.is_active ? "bg-green-50 text-[#136f42]" : "bg-gray-50 text-gray-300"
                    )}>
                      {item.is_active ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    </div>
                  </div>
                  
                  <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-6 flex-1 font-medium italic">
                    {item.description}
                  </p>

                  <div className="pt-5 flex items-center justify-between border-t border-gray-50">
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        item.is_active ? "bg-[#136f42] animate-pulse shadow-[0_0_8px_rgba(19,111,66,0.5)]" : "bg-gray-300"
                      )} />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        {item.is_active ? 'tampil' : 'draft'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleActive(item.id, item.is_active)}
                        className="p-2.5 hover:bg-green-50 text-gray-400 hover:text-[#136f42] rounded-xl transition-all active:scale-90"
                        title={item.is_active ? 'Sembunyikan' : 'Tampilkan'}
                      >
                        {item.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <Link
                        to={`/admin/kabar/edit/${item.id}`}
                        className="p-2.5 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-xl transition-all active:scale-90"
                      >
                        <Pencil size={16} />
                      </Link>
                      <button
                        onClick={() => triggerDelete(item.id, item.title)}
                        className="p-2.5 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-xl transition-all active:scale-90"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- 🔥 CUSTOM POPUP CONFIRMATION MODAL 🔥 --- */}
      {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95 duration-200 border border-white/20 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
                      <Trash2 size={32} />
                  </div>
                  
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-2">
                      Hapus kabar ini?
                  </h3>
                  
                  <p className="text-xs text-slate-500 font-medium leading-relaxed mb-8 px-4 lowercase">
                      tindakan ini akan menghapus kabar <b>"{confirmModal.kabarTitle}"</b> secara permanen dari server dan aplikasi anggota.
                  </p>

                  <div className="grid grid-cols-2 gap-3 text-center">
                      <button 
                        onClick={() => setConfirmModal({ isOpen: false, kabarId: '', kabarTitle: '' })} 
                        className="py-3.5 bg-slate-100 text-slate-600 font-black rounded-2xl text-[10px] uppercase tracking-widest active:scale-95 transition-transform"
                      >
                          batal
                      </button>
                      <button 
                        onClick={executeDelete} 
                        disabled={isDeleting}
                        className="py-3.5 bg-rose-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-lg shadow-rose-900/20 active:scale-95 transition-transform disabled:opacity-50"
                      >
                          {isDeleting ? 'memproses...' : 'ya, hapus'}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
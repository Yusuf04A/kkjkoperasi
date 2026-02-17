import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/api'; // Menggunakan Axios
import { 
    Plus, Pencil, EyeOff, Trash2, ArrowLeft, Megaphone, 
    Clock, CheckCircle2, AlertCircle, Eye, Loader2 
} from 'lucide-react';
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

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-600',
    biru_tua: 'bg-[#003366]',
    yellow: 'bg-amber-400',
    green: 'bg-emerald-600',
    red: 'bg-rose-600',
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Panggil API Laravel: GET /admin/kabar
      const response = await API.get('/admin/kabar');
      setList(response.data || []);
    } catch (error) {
      toast.error("Gagal memuat daftar kabar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const toastId = toast.loading("Memperbarui status...");
    try {
      // Panggil API Laravel: PATCH /admin/kabar/{id}/toggle
      await API.patch(`/admin/kabar/${id}/toggle`, { 
          is_active: !currentStatus 
      });
      toast.success("Status diperbarui", { id: toastId });
      fetchData();
    } catch (error) {
      toast.error("Gagal memperbarui status", { id: toastId });
    }
  };

  const deleteKabar = async (id: string) => {
    if (!confirm('Yakin hapus kabar ini?')) return;
    
    const toastId = toast.loading("Menghapus kabar...");
    try {
      // Panggil API Laravel: DELETE /admin/kabar/{id}
      await API.delete(`/admin/kabar/${id}`);
      toast.success("Kabar berhasil dihapus", { id: toastId });
      setList(list.filter(item => item.id !== id));
    } catch (error) {
      toast.error("Gagal menghapus kabar", { id: toastId });
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="animate-spin text-[#003366]" size={32} />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      {/* STICKY TOP BAR */}
      <div className="bg-white border-b sticky top-0 z-10 px-4 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin/dashboard" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Manajemen Kabar</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">Kontrol berita anggota</p>
            </div>
          </div>
          <Link
            to="/admin/kabar/tambah"
            className="bg-[#003366] text-white text-xs font-black uppercase tracking-widest px-6 py-3 rounded-2xl hover:bg-blue-800 transition shadow-xl shadow-blue-900/20 flex items-center gap-2 active:scale-95"
          >
            <Plus size={18} /> Tambah Kabar
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-6 mt-4">
        {list.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-20 text-center border border-dashed border-slate-200">
            <Megaphone size={48} className="mx-auto text-slate-200 mb-4" />
            <h3 className="text-lg font-bold text-slate-900">Belum ada kabar</h3>
            <p className="text-slate-400 text-sm max-w-xs mx-auto">Mulai buat pengumuman pertama Anda untuk anggota koperasi.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {list.map((item) => (
              <div key={item.id} className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 group flex flex-col h-full">
                
                {/* HEADER LOGIC (GAMBAR ATAU WARNA) */}
                <div className={cn("h-44 relative overflow-hidden", !item.image_url && (colorMap[item.color] || 'bg-gray-600'))}>
                  
                  {item.image_url ? (
                    <>
                        <img 
                            src={item.image_url} 
                            alt={item.title} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60" />
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center opacity-10 group-hover:scale-110 transition-transform duration-700">
                        <Megaphone size={120} />
                    </div>
                  )}

                  {/* Badge & Tanggal */}
                  <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
                    <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 rounded-xl border border-white/20 tracking-[0.2em] uppercase shadow-lg">
                        {item.type}
                    </span>
                  </div>
                  
                  <div className="absolute bottom-4 left-5 z-10 flex items-center gap-2 text-white/90 text-[10px] font-black tracking-widest uppercase">
                    <Clock size={12} strokeWidth={3} />
                    {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>

                {/* CONTENT */}
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <h3 className="font-black text-slate-900 leading-tight line-clamp-2 min-h-[3rem] text-lg tracking-tight">
                      {item.title}
                    </h3>
                    {item.is_active ? (
                      <CheckCircle2 size={20} className="text-emerald-500 shrink-0 shadow-sm" />
                    ) : (
                      <AlertCircle size={20} className="text-slate-300 shrink-0" />
                    )}
                  </div>
                  
                  <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-6 flex-1 font-medium italic">
                    {item.description}
                  </p>

                  <div className="pt-5 flex items-center justify-between border-t border-slate-50 mt-auto">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "w-2.5 h-2.5 rounded-full animate-pulse shadow-sm",
                        item.is_active ? "bg-emerald-500 shadow-emerald-200" : "bg-slate-300 shadow-slate-100"
                      )} />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {item.is_active ? 'Aktif' : 'Draft'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleActive(item.id, item.is_active)}
                        className="p-2.5 bg-slate-50 hover:bg-orange-50 text-slate-400 hover:text-orange-600 rounded-xl transition-all active:scale-90"
                        title={item.is_active ? 'Sembunyikan' : 'Tampilkan'}
                      >
                        {item.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>
                      <Link
                        to={`/admin/kabar/edit/${item.id}`}
                        className="p-2.5 bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all active:scale-90"
                      >
                        <Pencil size={18} />
                      </Link>
                      <button
                        onClick={() => deleteKabar(item.id)}
                        className="p-2.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all active:scale-90"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, EyeOff, Trash2, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface KabarKKJ {
  id: string;
  title: string;
  description: string;
  type: 'PROMO' | 'INFO' | 'RAT' | 'PROGRAM';
  color: 'blue' | 'yellow' | 'green';
  is_active: boolean;
  created_at: string;
}

export default function AdminKabar() {
  const [list, setList] = useState<KabarKKJ[]>([]);
  const [loading, setLoading] = useState(true);

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
    await supabase
      .from('kabar_kkj')
      .update({ is_active: !active })
      .eq('id', id);

    fetchData();
  };

  const deleteKabar = async (id: string) => {
    if (!confirm('Yakin hapus kabar ini?')) return;

    await supabase.from('kabar_kkj').delete().eq('id', id);
    fetchData();
  };

  if (loading) return <p>Loading...</p>;

  return (
  <div className="min-h-screen bg-gray-50 py-10 px-4">
    <div className="max-w-4xl mx-auto space-y-6">

      {/* HEADER */}
      {/* HEADER */}
<div>
  {/* TOMBOL KEMBALI (TAMBAHAN) */}
  <Link
    to="/admin/dashboard"
    className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-2"
  >
    <ArrowLeft size={18} />
    Kembali
  </Link>
</div>

      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Manajemen Kabar KKJ
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Kelola berita, promo, dan informasi untuk anggota koperasi.
        </p>
      </div>

      {/* CARD UTAMA */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">

        {/* CARD HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-sm font-semibold text-gray-700">
            Daftar Kabar
          </h2>

          <Link
            to="/admin/kabar/tambah"
            className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-blue-700 transition"
          >
            + Tambah Kabar
          </Link>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-6 py-3 text-left font-medium">Judul</th>
                <th className="px-6 py-3 text-center font-medium">Tipe</th>
                <th className="px-6 py-3 text-center font-medium">Status</th>
                <th className="px-6 py-3 text-center font-medium">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {list.map(item => (
                <tr key={item.id} className="hover:bg-gray-50 transition">

                  {/* JUDUL */}
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-800">
                      {item.title}
                    </p>
                  </td>

                  {/* TIPE */}
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                      {item.type}
                    </span>
                  </td>

                  {/* STATUS */}
                  <td className="px-6 py-4 text-center">
                    {item.is_active ? (
                      <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        Aktif
                      </span>
                    ) : (
                      <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-600">
                        Nonaktif
                      </span>
                    )}
                  </td>

                  {/* AKSI */}
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">

                      <Link
                        to={`/admin/kabar/edit/${item.id}`}
                        className="px-3 py-1 text-xs font-semibold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
                      >
                        Edit
                      </Link>

                      <button
                        onClick={() => toggleActive(item.id, item.is_active)}
                        className="px-3 py-1 text-xs font-semibold text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50"
                      >
                        {item.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>

                      <button
                        onClick={() => deleteKabar(item.id)}
                        className="px-3 py-1 text-xs font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                      >
                        Hapus
                      </button>

                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>

          {/* EMPTY STATE */}
          {list.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm">
              Belum ada kabar yang ditambahkan.
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);
}
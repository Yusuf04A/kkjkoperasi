import React, { useState } from 'react';
import { ArrowLeft, TrendingUp, Home, Calculator, Building } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatRupiah } from '../../lib/utils';

export const Inflip = () => {
  const navigate = useNavigate();

  // STATE SIMULASI
  const [modal, setModal] = useState(200_000_000);
  const [biayaRenovasi, setBiayaRenovasi] = useState(20_000_000);
  const [hargaJual, setHargaJual] = useState(260_000_000);

  const totalModal = modal + biayaRenovasi;
  const keuntungan = hargaJual - totalModal;
  const roi = ((keuntungan / totalModal) * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-gray-50 pb-16">

      {/* HEADER */}
<div className="bg-white border-b border-gray-200 sticky top-0 z-30 px-4 py-4 flex items-center gap-3">
  <button
    onClick={() => navigate(-1)}
    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
  >
    <ArrowLeft size={20} className="text-kkj-blue" />
  </button>

  <h1 className="text-lg font-bold text-kkj-blue">
    INFLIP - Investasi Flipping Property
  </h1>
</div>


      <div className="max-w-4xl mx-auto px-4 mt-10 space-y-10">


        {/* PENJELASAN */}
        {/* HERO SECTION */}
<div className="max-w-4xl mx-auto mb-8">
  <div className="bg-[#0B2B4B] text-white rounded-2xl shadow-xl p-8">
    <div className="flex items-start gap-3">
      <Building className="w-6 h-6 mt-1" />
      <div>
        <h2 className="text-xl font-bold mb-2">
          Investasi Properti Syariah
        </h2>
        <p className="text-sm text-blue-100 leading-relaxed">
          INFLIP adalah program investasi properti berbasis sistem flipping,
          yaitu membeli properti di bawah harga pasar, melakukan renovasi ringan,
          lalu menjual kembali untuk memperoleh keuntungan. Dikelola dengan prinsip
          syariah tanpa riba.
        </p>
      </div>
    </div>
  </div>
</div>

        {/* CARA KERJA */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="font-bold text-lg mb-4">Cara Kerja</h2>

          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="bg-blue-50 p-4 rounded-lg">
              1️⃣ Properti dibeli di bawah harga pasar
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              2️⃣ Renovasi ringan meningkatkan nilai jual
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              3️⃣ Dijual kembali dengan profit
            </div>
          </div>
        </div>

        {/* SIMULASI */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <Calculator className="text-kkj-blue" />
            <h2 className="font-bold text-lg">Simulasi Profit Flipping</h2>
          </div>

          <div className="space-y-4">

            <div>
              <label className="text-sm font-medium">Harga Beli Properti</label>
              <input
                type="number"
                value={modal}
                onChange={(e) => setModal(Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2 mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Biaya Renovasi</label>
              <input
                type="number"
                value={biayaRenovasi}
                onChange={(e) => setBiayaRenovasi(Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2 mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Harga Jual</label>
              <input
                type="number"
                value={hargaJual}
                onChange={(e) => setHargaJual(Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2 mt-1"
              />
            </div>

            {/* HASIL */}
            <div className="mt-6 bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
              <p>Total Modal: <span className="font-bold">{formatRupiah(totalModal)}</span></p>
              <p>
                Keuntungan: 
                <span className={`font-bold ml-2 ${keuntungan >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatRupiah(keuntungan)}
                </span>
              </p>
              <p>ROI: <span className="font-bold">{roi}%</span></p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <button className="bg-kkj-blue text-white px-6 py-3 rounded-xl shadow hover:opacity-90 transition">
            Ajukan Investasi INFLIP
          </button>
        </div>

      </div>
    </div>
  );
};

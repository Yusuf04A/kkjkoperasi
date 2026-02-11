import React, { useState } from 'react';
import { ArrowLeft, Coins, TrendingUp, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatRupiah } from '../../lib/utils';

export const Tamasa = () => {
  const navigate = useNavigate();

  // State simulasi
  const [monthlyAmount, setMonthlyAmount] = useState(500000);
  const [duration, setDuration] = useState(12);
  const [goldPrice, setGoldPrice] = useState(1000000); // harga emas per gram

  // Perhitungan
  const totalInvestment = monthlyAmount * duration;
  const estimatedGram = totalInvestment / goldPrice;
  const estimatedFutureValue = estimatedGram * goldPrice;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">

      {/* HEADER */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft size={20} className="text-kkj-blue" />
        </button>
        <h1 className="text-lg font-bold text-kkj-blue">
          TAMASA - Tabungan Emas
        </h1>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-8">

        {/* HERO INFO */}
        <div className="bg-gradient-to-br from-[#0B2B4B] to-[#123D6A] rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <Coins size={28} />
            <h2 className="text-xl font-bold">Investasi Emas Syariah</h2>
          </div>
          <p className="text-sm opacity-90">
            TAMASA adalah program tabungan emas anggota KKJ yang aman, fleksibel,
            dan berbasis prinsip syariah. Mulai investasi dari Rp 10.000.
          </p>
        </div>

        {/* KEUNGGULAN */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <TrendingUp className="text-kkj-blue mb-2" />
            <h3 className="font-bold text-gray-900 text-sm mb-1">Lindungi Nilai Aset</h3>
            <p className="text-xs text-gray-500">
              Emas tahan inflasi dan cocok untuk investasi jangka panjang.
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <ShieldCheck className="text-kkj-blue mb-2" />
            <h3 className="font-bold text-gray-900 text-sm mb-1">Aman & Syariah</h3>
            <p className="text-xs text-gray-500">
              Dikelola transparan sesuai prinsip koperasi syariah.
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <Coins className="text-kkj-blue mb-2" />
            <h3 className="font-bold text-gray-900 text-sm mb-1">Fleksibel</h3>
            <p className="text-xs text-gray-500">
              Setor rutin atau bebas, bisa dicairkan sesuai ketentuan.
            </p>
          </div>
        </div>

        {/* SIMULASI */}
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200 space-y-6">

          <h2 className="text-lg font-bold text-gray-900">
            Simulasi Tabungan Emas
          </h2>

          {/* Input Nominal */}
          <div>
            <label className="text-sm font-semibold text-gray-700">
              Setoran per Bulan
            </label>
            <input
              type="number"
              value={monthlyAmount}
              onChange={(e) => setMonthlyAmount(Number(e.target.value))}
              className="w-full mt-1 p-3 border rounded-xl text-lg font-bold"
            />
          </div>

          {/* Input Durasi */}
          <div>
            <label className="text-sm font-semibold text-gray-700">
              Durasi (Bulan)
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full mt-1 p-3 border rounded-xl text-lg font-bold"
            />
          </div>

          {/* Input Harga Emas */}
          <div>
            <label className="text-sm font-semibold text-gray-700">
              Harga Emas per Gram
            </label>
            <input
              type="number"
              value={goldPrice}
              onChange={(e) => setGoldPrice(Number(e.target.value))}
              className="w-full mt-1 p-3 border rounded-xl text-lg font-bold"
            />
          </div>

          {/* HASIL */}
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-2">
            <p className="text-sm text-gray-600">
              Total Setoran:
              <span className="font-bold text-gray-900 ml-2">
                {formatRupiah(totalInvestment)}
              </span>
            </p>

            <p className="text-sm text-gray-600">
              Estimasi Emas:
              <span className="font-bold text-gray-900 ml-2">
                {estimatedGram.toFixed(2)} gram
              </span>
            </p>

            <p className="text-sm text-gray-600">
              Estimasi Nilai:
              <span className="font-bold text-green-700 ml-2">
                {formatRupiah(estimatedFutureValue)}
              </span>
            </p>
          </div>

          {/* BUTTON */}
          <button className="w-full bg-kkj-blue text-white py-4 rounded-xl font-bold hover:opacity-90 transition">
            Mulai Tabungan Emas
          </button>
        </div>
      </div>
    </div>
  );
};

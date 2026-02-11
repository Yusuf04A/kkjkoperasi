import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";
import { formatRupiah } from "../../lib/utils";

export const AdminTamasa = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    const { data } = await supabase
      .from("tamasa_transactions")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    setTransactions(data || []);
    setLoading(false);
  };

  // ✅ APPROVE
  const handleApprove = async (tx: any) => {
    try {
      const { data: balance } = await supabase
        .from("tamasa_balances")
        .select("*")
        .eq("user_id", tx.user_id)
        .single();

      if (balance) {
        await supabase
          .from("tamasa_balances")
          .update({
            total_gram: balance.total_gram + tx.estimasi_gram,
          })
          .eq("user_id", tx.user_id);
      } else {
        await supabase
          .from("tamasa_balances")
          .insert({
            user_id: tx.user_id,
            total_gram: tx.estimasi_gram,
          });
      }

      await supabase
  .from("tamasa_transactions")
  .update({
    status: "approved",
    approved_at: new Date().toISOString(),
  })
  .eq("id", tx.id);


      alert("Transaksi berhasil di-approve ✅");
      fetchTransactions();
    } catch (err) {
      console.error(err);
      alert("Gagal approve transaksi");
    }
  };

  // ❌ REJECT
  const handleReject = async (tx: any) => {
    try {
      await supabase
        .from("tamasa_transactions")
        .update({
          status: "rejected",
          approved_at: new Date().toISOString(),
        })
        .eq("id", tx.id);

      alert("Transaksi berhasil di-reject ❌");
      fetchTransactions();
    } catch (err) {
      console.error(err);
      alert("Gagal reject transaksi");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Approval TAMASA</h1>
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-blue-600"
          >
            ← Kembali
          </button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : transactions.length === 0 ? (
          <p>Tidak ada transaksi pending.</p>
        ) : (
          <div className="space-y-4">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="bg-white p-5 rounded-xl shadow border"
              >
                <div className="space-y-1 text-sm">
                  <p><b>User ID:</b> {tx.user_id}</p>
                  <p><b>Setoran:</b> {formatRupiah(tx.setoran)}</p>
                  <p><b>Estimasi Gram:</b> {tx.estimasi_gram.toFixed(2)} gram</p>
                  <p><b>Status:</b> {tx.status}</p>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => handleApprove(tx)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    Approve
                  </button>

                  <button
                    onClick={() => handleReject(tx)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    Reject
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

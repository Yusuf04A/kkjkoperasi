import React, { useState, useRef, useEffect } from "react";
import { X, Send, Bot, Loader2, Headset } from "lucide-react";
import { askSila } from "../lib/gemini";
import { useAuthStore } from "../store/useAuthStore";
import { supabase } from "../lib/supabase";

type Message = { id: number; role: "user" | "model"; text: string; };

export const SilaChat = () => {
    const { user } = useAuthStore();

    // STATE DATA LENGKAP
    const [realProfile, setRealProfile] = useState<any>(null);
    const [loans, setLoans] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);

    // STATE BARU: TAMASA & INFLIP
    const [tamasaData, setTamasaData] = useState<any>(null);
    const [inflipTotal, setInflipTotal] = useState<number>(0);

    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const displayName = realProfile?.full_name || 'Anggota';

    const [messages, setMessages] = useState<Message[]>([
        { id: 1, role: "model", text: `Halo Kak! 👋\nSaya SILA. Bisa tanya soal **Saldo**, **Tagihan**, **Tamasa**, atau **Inflip** ya!` }
    ]);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // === FUNGSI TARIK SEMUA DATA DARI DB ===
    const fetchFreshData = async () => {
        if (!user?.id) return;

        try {
            // 1. AMBIL PROFILE (Tapro, Simwa, Simpok)
            const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            if (profileData) {
                setRealProfile(profileData);
                if (messages.length === 1) {
                    setMessages([{ id: 1, role: "model", text: `Halo Kak **${profileData.full_name}**! 👋\nSaldo Tapro Kakak: **${new Intl.NumberFormat('id-ID').format(profileData.tapro_balance)}**. Ada yg bisa dibantu?` }]);
                }
            }

            // 2. AMBIL TAMASA (Tabel: tamasa_balances)
            const { data: tData } = await supabase
                .from('tamasa_balances')
                .select('total_gram')
                .eq('user_id', user.id)
                .single(); // Pakai single() karena 1 user 1 balance

            if (tData) setTamasaData(tData); // Simpan { total_gram: ... }

            // 3. AMBIL INFLIP (Tabel: inflip_investments)
            // Kita asumsikan ada tabel 'inflip_investments' berisi riwayat investasi user
            const { data: iData } = await supabase
                .from('inflip_investments')
                .select('amount') // Atau 'total_investment' tergantung nama kolommu
                .eq('user_id', user.id);

            if (iData) {
                // Hitung total aset inflip (sum semua investasi)
                const total = iData.reduce((acc, curr) => acc + (curr.amount || 0), 0);
                setInflipTotal(total);
            }

            // 4. AMBIL TAGIHAN & TRANSAKSI
            const { data: loanData } = await supabase.from('loans').select('*').eq('user_id', user.id).eq('status', 'active');
            if (loanData) setLoans(loanData);

            const { data: trxData } = await supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5);
            if (trxData) setTransactions(trxData);

        } catch (error) {
            console.error("Gagal tarik data AI:", error);
        }
    };

    useEffect(() => { fetchFreshData(); }, [user?.id]);
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isOpen]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { id: Date.now(), role: "user", text: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        await fetchFreshData(); // Refresh data biar update

        try {
            const historyForGemini = messages.map(msg => ({ role: msg.role, parts: msg.text }));

            // PAKET DATA LENGKAP UTK AI
            const contextData = {
                profile: realProfile,
                loans: loans,
                transactions: transactions,
                tamasa: tamasaData,      // Kirim data emas
                inflipTotal: inflipTotal // Kirim total properti
            };

            const responseText = await askSila(input, historyForGemini, contextData);
            setMessages((prev) => [...prev, { id: Date.now() + 1, role: "model", text: responseText }]);
        } catch (error) {
            setMessages((prev) => [...prev, { id: Date.now() + 2, role: "model", text: "Maaf Kak, koneksi SILA terputus." }]);
        } finally {
            setIsLoading(false);
        }
    };

    // Render Teks (Bold)
    const renderMessageText = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={index} className="font-bold text-blue-800">{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    // STYLE
    const buttonStyle = `fixed z-[999] bottom-20 right-4 md:bottom-6 md:right-6 p-4 rounded-full shadow-xl transition-all duration-300 flex items-center justify-center hover:scale-105 active:scale-95 ${isOpen ? "bg-blue-600 rotate-90" : "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 animate-pulse-slow"}`;
    const windowStyle = `fixed z-[998] bottom-36 right-4 md:bottom-24 md:right-6 w-[92%] md:w-[380px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transition-all duration-300 origin-bottom-right flex flex-col ${isOpen ? "scale-100 opacity-100 translate-y-0" : "scale-0 opacity-0 translate-y-10 pointer-events-none"}`;

    return (
        <>
            <button onClick={() => setIsOpen(!isOpen)} className={buttonStyle}>
                {isOpen ? <X className="text-white" size={28} /> : <Headset className="text-white" size={28} />}
                {!isOpen && <span className="absolute top-0 right-0 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>}
            </button>

            <div className={windowStyle} style={{ height: "500px", maxHeight: "75vh" }}>
                <div className="bg-blue-600 p-4 flex items-center gap-3 shadow-sm">
                    <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm"><Headset size={24} className="text-white" /></div>
                    <div><h3 className="font-bold text-white text-lg leading-tight">CS Koperasi KKJ</h3><p className="text-blue-100 text-xs flex items-center gap-1"><span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span> Online • {displayName.split(' ')[0]}</p></div>
                    <button onClick={() => setIsOpen(false)} className="ml-auto text-blue-100 hover:text-white md:hidden"><X size={20} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 text-sm scrollbar-thin scrollbar-thumb-gray-300">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                            {msg.role === "model" && <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 border border-blue-200 self-end mb-1"><Bot size={16} className="text-blue-600" /></div>}
                            <div className={`max-w-[85%] p-3.5 rounded-2xl leading-relaxed shadow-sm whitespace-pre-line ${msg.role === "user" ? "bg-blue-600 text-white rounded-br-none" : "bg-white text-gray-800 border border-gray-100 rounded-bl-none"}`}>
                                {renderMessageText(msg.text)}
                            </div>
                        </div>
                    ))}
                    {isLoading && <div className="flex justify-start gap-2 animate-pulse items-center"><div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100"><Bot size={16} className="text-blue-400" /></div><div className="bg-white px-4 py-2 rounded-full border border-gray-100 flex items-center gap-2 text-gray-500 text-xs"><Loader2 size={14} className="animate-spin text-blue-600" /> Sedang mengecek data...</div></div>}
                    <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex gap-2 relative z-10">
                    <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Tanya saldo Tamasa, Inflip..." className="flex-1 bg-gray-100 focus:bg-white border border-transparent focus:border-blue-500 rounded-full px-4 py-2.5 text-sm transition-all outline-none" disabled={isLoading} />
                    <button type="submit" disabled={!input.trim() || isLoading} className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-full shadow-md flex items-center justify-center shrink-0"><Send size={18} /></button>
                </form>
            </div>
        </>
    );
};
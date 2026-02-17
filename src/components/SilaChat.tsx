import React, { useState, useRef, useEffect } from "react";
import { X, Send, Bot, Loader2, Headset } from "lucide-react";
import API from "../api/api"; // Pastikan menggunakan instance Axios Anda
import { askSila } from "../lib/gemini";
import { useAuthStore } from "../store/useAuthStore";

type Message = { id: number; role: "user" | "model"; text: string; };

export const SilaChat = () => {
    const { user } = useAuthStore();

    // STATE DATA
    const [realProfile, setRealProfile] = useState<any>(null);
    const [loans, setLoans] = useState<any[]>([]);
    const [installments, setInstallments] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [tamasaData, setTamasaData] = useState<any>(null);
    const [inflipTotal, setInflipTotal] = useState<number>(0);

    // STATE UI
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const displayName = realProfile?.name || 'Anggota';

    const [messages, setMessages] = useState<Message[]>([
        { id: 1, role: "model", text: `Halo Kak! 👋\nSaya SILA. Ada yang bisa dibantu cek **Sisa Pinjaman**, **Saldo**, atau lainnya?` }
    ]);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // === FETCH DATA VIA LARAVEL API ===
    const fetchFreshData = async () => {
        if (!user) return;

        try {
            // Kita panggil endpoint profile yang sudah mencakup data finansial dasar
            // atau buat endpoint khusus /user/ sila-context di Laravel
            const response = await API.get('/user/profile');
            const data = response.data;

            setRealProfile(data);
            
            // Set Pesan Pembuka Personal
            if (messages.length === 1) {
                setMessages([{ 
                    id: 1, 
                    role: "model", 
                    text: `Halo Kak **${data.name}**! 👋\nSaya SILA. Mau cek angsuran terdekat atau saldo tabungan hari ini?` 
                }]);
            }

            // Ambil data tambahan untuk Context AI
            // Di Laravel, Anda bisa menggabungkan ini dalam satu hit API agar lebih cepat
            const financialRes = await API.get('/user/financial-summary');
            const finData = financialRes.data;

            setLoans(finData.active_loans || []);
            setInstallments(finData.unpaid_installments || []);
            setTransactions(finData.recent_transactions || []);
            setTamasaData(finData.tamasa_balance);
            setInflipTotal(finData.inflip_total_investment || 0);

        } catch (err) {
            console.error("Gagal sinkronisasi data SILA:", err);
        }
    };

    useEffect(() => { 
        if (isOpen) fetchFreshData(); 
    }, [isOpen]);

    useEffect(() => { 
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); 
    }, [messages, isLoading]);

    // === SEND ===
    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const currentInput = input;
        const newUserMsg: Message = { id: Date.now(), role: "user", text: currentInput };

        setInput("");
        setMessages((prev) => [...prev, newUserMsg]);
        setIsLoading(true);

        try {
            // Siapkan history untuk Gemini
            const currentHistory = messages.map(msg => ({ 
                role: msg.role === "model" ? "model" : "user", 
                parts: [{ text: msg.text }] 
            }));

            // Siapkan Data Member sebagai Context
            const contextData = {
                profile: realProfile,
                loans: loans,
                installments: installments,
                transactions: transactions,
                tamasa: tamasaData,
                inflipTotal: inflipTotal,
                current_time: new Date().toLocaleString('id-ID')
            };

            const responseText = await askSila(currentInput, currentHistory, contextData);
            setMessages((prev) => [...prev, { id: Date.now() + 1, role: "model", text: responseText }]);

        } catch (error) {
            setMessages((prev) => [...prev, { id: Date.now() + 2, role: "model", text: "Maaf Kak, koneksi SILA terputus. Silakan coba lagi nanti." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const renderMessageText = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={index} className="font-bold text-blue-700">{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    const buttonStyle = `fixed z-[999] bottom-24 right-4 md:bottom-6 md:right-6 p-4 rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center hover:scale-110 active:scale-95 ${isOpen ? "bg-red-500 rotate-90" : "bg-blue-600 animate-bounce-slow"}`;
    const windowStyle = `fixed z-[998] bottom-40 right-4 md:bottom-24 md:right-6 w-[92%] md:w-[400px] bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transition-all duration-500 origin-bottom-right flex flex-col ${isOpen ? "scale-100 opacity-100 translate-y-0" : "scale-0 opacity-0 translate-y-10 pointer-events-none"}`;

    return (
        <>
            <button onClick={() => setIsOpen(!isOpen)} className={buttonStyle}>
                {isOpen ? <X className="text-white" size={28} /> : <Bot className="text-white" size={28} />}
                {!isOpen && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-5 w-5 bg-blue-500 text-[10px] text-white items-center justify-center font-bold">1</span>
                    </span>
                )}
            </button>

            <div className={windowStyle} style={{ height: "600px", maxHeight: "80vh" }}>
                {/* Header */}
                <div className="bg-[#003366] p-5 flex items-center gap-3">
                    <div className="relative">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
                            <Bot size={28} className="text-white" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-[#003366] rounded-full animate-pulse"></div>
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-lg tracking-tight">SILA Virtual Assistant</h3>
                        <p className="text-blue-200 text-xs font-medium uppercase tracking-widest">Koperasi Karya Kita Jaya</p>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="ml-auto text-white/50 hover:text-white transition-colors"><X size={20} /></button>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-50/50 scroll-smooth custom-scrollbar">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "justify-start"}`}>
                            {msg.role === "model" && (
                                <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-slate-100 self-end mb-1 text-[#003366]">
                                    <Bot size={16} />
                                </div>
                            )}
                            <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                msg.role === "user" 
                                ? "bg-[#003366] text-white rounded-tr-none font-medium" 
                                : "bg-white text-slate-700 border border-slate-100 rounded-tl-none"
                            }`}>
                                {renderMessageText(msg.text)}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start gap-3 items-center">
                            <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center border border-slate-100 text-blue-400">
                                <Bot size={16} />
                            </div>
                            <div className="bg-white px-4 py-2.5 rounded-2xl border border-slate-100 flex items-center gap-2 text-slate-400 text-xs font-medium italic shadow-sm">
                                <Loader2 size={14} className="animate-spin text-blue-500" /> SILA sedang berpikir...
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex gap-2">
                    <input 
                        type="text" 
                        value={input} 
                        onChange={(e) => setInput(e.target.value)} 
                        placeholder="Tanya info saldo atau angsuran..." 
                        className="flex-1 bg-slate-100 focus:bg-white border-2 border-transparent focus:border-blue-500 rounded-2xl px-5 py-3 text-sm transition-all outline-none font-medium" 
                        disabled={isLoading} 
                    />
                    <button 
                        type="submit" 
                        disabled={!input.trim() || isLoading} 
                        className="bg-[#003366] hover:bg-blue-900 text-white p-3.5 rounded-2xl shadow-lg transition-all active:scale-90 disabled:opacity-50 shrink-0"
                    >
                        <Send size={20} />
                    </button>
                </form>
            </div>
        </>
    );
};
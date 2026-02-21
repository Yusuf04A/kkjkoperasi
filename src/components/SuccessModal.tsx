import React from 'react';
import { CheckCircle, X } from 'lucide-react';
import { Button } from './ui/Button';

interface SuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose, title, message }) => {
    // 🔥 Pastikan ini me-return null jika tidak open
    if (!isOpen) return null;

    return (
        // 🔥 Z-INDEX ditingkatkan ke 999 agar di atas segalanya
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            {/* BACKDROP */}
            <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" 
                onClick={onClose} 
            />
            
            {/* CONTENT MODAL */}
            <div className="bg-white w-full max-w-xs rounded-[2rem] p-8 shadow-2xl relative animate-in zoom-in-95 duration-200 text-center border border-white/20">
                <button 
                    onClick={onClose} 
                    className="absolute top-5 right-5 text-slate-300 hover:text-slate-500 transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 text-[#136f42] shadow-inner">
                    <CheckCircle size={48} strokeWidth={2.5} />
                </div>

                <h3 className="text-xl font-[1000] text-slate-800 uppercase tracking-tight mb-2">
                    {title}
                </h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8 px-2 lowercase">
                    {message}
                </p>

                <Button
                    onClick={onClose}
                    className="w-full bg-[#136f42] text-white font-bold py-4 rounded-2xl shadow-lg shadow-green-900/20 active:scale-95 transition-all uppercase text-xs tracking-widest"
                >
                    Tutup
                </Button>
            </div>
        </div>
    );
};
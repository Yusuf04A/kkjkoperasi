import React from 'react';
import { CheckCircle, X, XCircle, Download } from 'lucide-react';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';

interface SuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type?: 'success' | 'error';
    actionLabel?: string; // 🔥 Label untuk tombol unduh struk
    onAction?: () => void; // 🔥 Fungsi untuk eksekusi unduh struk
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
    isOpen,
    onClose,
    title,
    message,
    type = 'success',
    actionLabel,
    onAction
}) => {
    if (!isOpen) return null;

    const isError = type === 'error';

    return (
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

                {/* ICON BERDASARKAN TYPE */}
                <div className={cn(
                    "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner",
                    isError ? "bg-rose-50 text-rose-500" : "bg-green-50 text-[#136f42]"
                )}>
                    {isError ? (
                        <XCircle size={48} strokeWidth={2.5} className="animate-in zoom-in duration-300" />
                    ) : (
                        <CheckCircle size={48} strokeWidth={2.5} className="animate-in zoom-in duration-300" />
                    )}
                </div>

                <h3 className={cn(
                    "text-xl font-[1000] tracking-tight mb-2",
                    isError ? "text-rose-600" : "text-slate-800"
                )}>
                    {title}
                </h3>

                <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8 px-2">
                    {message}
                </p>

                <div className="space-y-3">
                    {/* 🔥 TOMBOL UNDUH STRUK (HANYA MUNCUL JIKA ADA PROPS) */}
                    {!isError && actionLabel && onAction && (
                        <Button
                            onClick={onAction}
                            className="w-full bg-blue-50 text-blue-600 font-bold py-4 rounded-2xl hover:bg-blue-100 active:scale-95 transition-all uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-2"
                        >
                            <Download size={16} />
                            {actionLabel}
                        </Button>
                    )}

                    {/* TOMBOL TUTUP */}
                    <Button
                        onClick={onClose}
                        className={cn(
                            "w-full text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all uppercase text-xs tracking-widest",
                            isError
                                ? "bg-rose-600 shadow-rose-900/20 hover:bg-rose-700"
                                : "bg-[#136f42] shadow-green-900/20 hover:bg-[#0f5c35]"
                        )}
                    >
                        {isError ? "Coba Lagi" : "Selesai"}
                    </Button>
                </div>
            </div>
        </div>
    );
};
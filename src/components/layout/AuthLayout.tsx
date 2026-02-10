import React from 'react';
import { ShieldCheck } from 'lucide-react'; // Placeholder Logo

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
    return (
        <div className="min-h-screen w-full flex bg-gray-50">
            {/* LEFT SIDE: Branding (Hanya muncul di Desktop 'lg') */}
            <div className="hidden lg:flex lg:w-1/2 bg-kkj-blue relative overflow-hidden flex-col justify-between p-12 text-white">
                {/* Background Pattern Abstrak */}
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

                {/* Content */}
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-white/10 rounded-lg">
                            <ShieldCheck size={32} className="text-kkj-gold" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-wider">KOPERASI KKJ</h1>
                    </div>
                    <h2 className="text-4xl font-bold leading-tight mb-4">
                        Berkoperasi Demi Wujud <span className="text-kkj-gold">Kesejahteraan Bersama</span>
                    </h2>
                    <p className="text-blue-100 text-lg max-w-md">
                        Platform digital terpadu untuk layanan simpanan, pembiayaan, dan transaksi yang aman & transparan.
                    </p>
                </div>

                <div className="relative z-10 text-sm text-blue-200">
                    © 2026 Koperasi Pemasaran Karya Kita Jaya. All rights reserved.
                </div>
            </div>

            {/* RIGHT SIDE: Form Area (Full width di mobile, 1/2 di desktop) */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 bg-white">
                <div className="w-full max-w-md space-y-8">
                    {/* Header Mobile Only */}
                    <div className="lg:hidden text-center mb-8">
                        <div className="inline-flex p-3 bg-kkj-blue rounded-xl mb-4">
                            <ShieldCheck size={32} className="text-kkj-gold" />
                        </div>
                        <h2 className="text-2xl font-bold text-kkj-blue">Koperasi KKJ</h2>
                    </div>

                    {/* Title Section */}
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
                        <p className="mt-2 text-gray-600">{subtitle}</p>
                    </div>

                    {/* Form Content */}
                    {children}
                </div>
            </div>
        </div>
    );
};
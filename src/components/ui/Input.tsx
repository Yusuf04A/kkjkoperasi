import React from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, icon, ...props }, ref) => {
        return (
            <div className="w-full space-y-1">
                {label && <label className="text-xs font-semibold text-gray-600 ml-1">{label}</label>}
                <div className="relative">
                    <input
                        ref={ref}
                        className={cn(
                            "w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-kkj-blue focus:border-transparent outline-none transition-all",
                            icon && "pl-10",
                            error && "border-red-500 focus:ring-red-200",
                            className
                        )}
                        {...props}
                    />
                    {icon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            {icon}
                        </div>
                    )}
                </div>
                {error && <p className="text-xs text-red-500 ml-1">{error}</p>}
            </div>
        );
    }
);
import React from "react";
import { cn } from "../../lib/utils";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline" | "ghost";
    isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    className,
    variant = "primary",
    isLoading,
    children,
    ...props
}) => {
    const variants = {
        primary: "bg-kkj-blue text-white hover:bg-kkj-lightBlue shadow-md",
        secondary: "bg-kkj-gold text-kkj-blue hover:bg-yellow-400 font-semibold",
        outline: "border-2 border-kkj-blue text-kkj-blue hover:bg-blue-50",
        ghost: "bg-transparent text-gray-600 hover:bg-gray-100",
    };

    return (
        <button
            className={cn(
                "flex items-center justify-center w-full px-4 py-3 rounded-xl transition-all active:scale-[0.98]",
                "disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium",
                variants[variant],
                className
            )}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : null}
            {children}
        </button>
    );
};
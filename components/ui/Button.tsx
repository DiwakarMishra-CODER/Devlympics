"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "accent" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg" | "xl";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const base =
  "inline-flex select-none items-center justify-center gap-2 rounded-full font-semibold tracking-tightish transition-colors duration-150 focus-ring disabled:pointer-events-none disabled:opacity-50";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-forest text-ivory hover:bg-forest-600 active:bg-forest-800",
  accent: "bg-saffron text-forest-900 hover:bg-saffron-600 active:bg-saffron-700",
  outline:
    "border border-forest/20 bg-white text-forest hover:bg-forest-50 active:bg-forest-100",
  ghost: "text-forest hover:bg-forest-50 active:bg-forest-100",
  danger: "bg-alert-500 text-white hover:bg-alert-600 active:bg-alert-700",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-[0.95rem]",
  lg: "h-14 px-7 text-lg",
  xl: "min-h-[4.5rem] px-8 text-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = "primary",
    size = "md",
    fullWidth = false,
    type = "button",
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        base,
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    />
  );
});

import React from "react";
import { cn } from "@/lib/utils";
import { SYMBOLS } from "@/lib/currency";
import type { Currency as CurrencyType } from "@/lib/types";
import Decimal from "decimal.js";

interface CurrencyProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: number | string | Decimal;
  currency: CurrencyType;
  showSign?: boolean;
  compact?: boolean;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
}

export const Currency = React.forwardRef<HTMLSpanElement, CurrencyProps>(
  ({ value, currency, showSign = false, compact = false, size = "md", className, ...props }, ref) => {
    const decValue = new Decimal(value);
    const isNegative = decValue.lt(0);
    const absValue = decValue.abs();
    
    const symbol = SYMBOLS[currency] || currency;
    
    // Formatting for the number part
    const formattedNumber = new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: compact && absValue.gte(1000) ? 0 : 2,
      maximumFractionDigits: compact && absValue.gte(1000) ? 1 : 2,
      notation: compact ? "compact" : "standard",
    }).format(absValue.toNumber());

    const sizeClasses = {
      xs: "text-[10px]",
      sm: "text-xs",
      md: "text-sm",
      lg: "text-base",
      xl: "text-lg",
      "2xl": "text-2xl",
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-baseline font-display font-bold whitespace-nowrap tabular-nums tracking-tight",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {isNegative && <span className="mr-0.5">−</span>}
        {!isNegative && showSign && decValue.gt(0) && <span className="mr-0.5">+</span>}
        
        {/* Symbol with proper spacing */}
        <span className={cn(
          "mr-1 select-none opacity-80 font-medium",
          // Special adjustment for Rupee symbol to prevent overlap
          currency === "INR" && "ml-0.5"
        )}>
          {symbol}
        </span>
        
        {/* Number */}
        <span className="leading-none">
          {formattedNumber}
        </span>
      </span>
    );
  }
);

Currency.displayName = "Currency";

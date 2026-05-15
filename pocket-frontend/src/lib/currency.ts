import Decimal from "decimal.js";
import type { Currency } from "./types";

export const SYMBOLS: Record<Currency, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  INR: "₹",
};

/**
 * Converts an amount from USD to the target currency.
 * Note: These are static fallback rates. In a real application, 
 * you would likely fetch live exchange rates from an API.
 */
export function convertFromUSD(amount: number | string | Decimal, currency: Currency): number {
  const rates: Record<Currency, number> = {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    INR: 83.12,
  };
  const rate = rates[currency] || 1;
  return new Decimal(amount).mul(rate).toNumber();
}

/**
 * Formats a numeric amount into a localized currency string.
 * @param amount The value to format (assumed to be in the target currency).
 * @param currency The currency code (e.g., 'INR', 'USD').
 * @param opts Formatting options.
 */
export function formatCurrency(
  amount: number | string | Decimal,
  currency: Currency,
  opts?: { compact?: boolean; signed?: boolean }
): string {
  const value = new Decimal(amount);
  const abs = value.abs();
  
  const formatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: opts?.compact && abs.gte(1000) ? 1 : 2,
    minimumFractionDigits: opts?.compact && abs.gte(1000) ? 0 : 2,
    notation: opts?.compact && abs.gte(1000) ? "compact" : "standard",
  });

  // Intl.NumberFormat often adds a non-breaking space or other characters.
  // We format the absolute value and handle the sign ourselves for consistency.
  const formatted = formatter.format(abs.toNumber());
  
  const sign = opts?.signed ? (value.gt(0) ? "+" : value.lt(0) ? "−" : "") : (value.lt(0) ? "−" : "");
  
  // Clean up any double signs or issues with Intl formatting
  return `${sign}${formatted.replace(/[−-]/, "")}`;
}

/**
 * Sanitizes and parses a currency input string to a Decimal.
 */
export function parseCurrencyInput(input: string): Decimal {
  const sanitized = input.replace(/[^0-9.-]/g, "");
  try {
    return new Decimal(sanitized || "0");
  } catch {
    return new Decimal("0");
  }
}

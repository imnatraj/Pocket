import type { Category, Currency, Transaction } from "./types";
import { convertFromUSD } from "./currency";
import { format } from "date-fns";

export function exportTransactionsCSV(
  transactions: Transaction[],
  categories: Category[],
  currency: Currency
) {
  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const header = ["Date", "Title", "Category", "Type", `Amount (${currency})`, "Note"];
  const rows = transactions.map((t) => [
    format(new Date(t.date), "yyyy-MM-dd"),
    escape(t.title),
    escape(catMap.get(t.categoryId) ?? ""),
    t.type,
    convertFromUSD(t.amount, currency).toFixed(2),
    escape(t.note ?? ""),
  ]);
  const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `transactions-${format(new Date(), "yyyy-MM-dd")}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escape(v: string) {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

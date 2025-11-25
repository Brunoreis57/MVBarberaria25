import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBRL(value: number | string) {
  if (typeof value === "string") {
    let s = value.trim().replace(/[^0-9.,-]/g, "");
    if (s.includes(",")) {
      s = s.replace(/\./g, "").replace(",", ".");
    }
    const n = Number(s);
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(isNaN(n) ? 0 : n);
  }
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
}

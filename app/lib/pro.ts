export const PRO_KEY = "cashly_pro";
export const FREE_INVOICE_LIMIT = 5;

export function isPro(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(PRO_KEY) === "true";
}

export function activatePro(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PRO_KEY, "true");
}

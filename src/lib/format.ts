export function formatCFA(amount: number): string {
  const rounded = Math.round(amount);
  return `${rounded.toLocaleString("fr-FR").replace(/ /g, " ")} FCFA`;
}

export function formatNumber(n: number): string {
  return n.toLocaleString("fr-FR").replace(/ /g, " ");
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatPercent(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

export function whatsappLink(phone: string | null | undefined, message: string): string {
  if (!phone) return "#";
  const digits = phone.replace(/[^0-9]/g, "");
  const intl = digits.startsWith("221") ? digits : `221${digits}`;
  return `https://wa.me/${intl}?text=${encodeURIComponent(message)}`;
}

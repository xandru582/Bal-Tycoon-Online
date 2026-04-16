// ============================================================
// NEXUS: Imperio del Mercado — Formatting Utilities
// ============================================================

import type { EconomicPhase } from "@/types/index";
import { PHASE_LABELS, PHASE_COLORS, COLORS } from "@/utils/constants";

// ─── Currency ─────────────────────────────────────────────

/**
 * Format a number as Euro currency.
 * compact=true → "€1.2M", "€45.3K"
 */
export function formatCurrency(
  amount: number,
  compact = false,
  showSign = false
): string {
  const sign = showSign && amount > 0 ? "+" : "";
  if (compact) {
    if (Math.abs(amount) >= 1_000_000)
      return `${sign}€${(amount / 1_000_000).toFixed(1)}M`;
    if (Math.abs(amount) >= 1_000)
      return `${sign}€${(amount / 1_000).toFixed(1)}K`;
  }
  const formatted = new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
  return `${sign}${amount < 0 ? "-" : ""}€${formatted}`;
}

/**
 * Format with + prefix for positive amounts.
 */
export function formatCurrencyDelta(amount: number): string {
  return formatCurrency(amount, false, true);
}

// ─── Percentage ───────────────────────────────────────────

export function formatPercent(value: number, decimals = 1): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

export function formatPercentAbs(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// ─── Date ─────────────────────────────────────────────────

const MONTHS_ES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];
const MONTHS_FULL_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

/**
 * Convert game day number (1-based) to a Date object starting from 1 Jan 2025.
 */
export function gameDayToDate(day: number): Date {
  const base = new Date(2025, 0, 1);
  base.setDate(base.getDate() + day - 1);
  return base;
}

export function formatDate(day: number): string {
  const d = gameDayToDate(day);
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS_ES[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateFull(day: number): string {
  const d = gameDayToDate(day);
  return `${d.getDate()} de ${MONTHS_FULL_ES[d.getMonth()]} de ${d.getFullYear()}`;
}

export function formatDayMonth(day: number): string {
  const d = gameDayToDate(day);
  return `${d.getDate()} ${MONTHS_ES[d.getMonth()]}`;
}

export function formatRelativeTime(days: number): string {
  if (days === 0) return "hoy";
  if (days === 1) return "hace 1 día";
  if (days < 7) return `hace ${days} días`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return "hace 1 semana";
  if (weeks < 4) return `hace ${weeks} semanas`;
  const months = Math.floor(days / 30);
  if (months === 1) return "hace 1 mes";
  return `hace ${months} meses`;
}

// ─── Season ───────────────────────────────────────────────

export function getSeason(day: number): string {
  const d = gameDayToDate(day);
  const m = d.getMonth();
  if (m >= 2 && m <= 4) return "Primavera";
  if (m >= 5 && m <= 7) return "Verano";
  if (m >= 8 && m <= 10) return "Otoño";
  return "Invierno";
}

export function getSeasonIcon(day: number): string {
  const season = getSeason(day);
  const icons: Record<string, string> = {
    Primavera: "🌸",
    Verano: "☀️",
    Otoño: "🍂",
    Invierno: "❄️",
  };
  return icons[season] ?? "🌍";
}

// ─── Colors for values ────────────────────────────────────

export function getChangeColor(change: number): string {
  if (change > 0) return COLORS.SUCCESS;
  if (change < 0) return COLORS.DANGER;
  return COLORS.TEXT2;
}

export function getChangeArrow(change: number): string {
  if (change > 0) return "▲";
  if (change < 0) return "▼";
  return "─";
}

export function getChangeEmoji(change: number): string {
  if (change > 2) return "🚀";
  if (change > 0) return "📈";
  if (change < -2) return "💥";
  if (change < 0) return "📉";
  return "➡️";
}

// ─── Economic Phase ───────────────────────────────────────

export function getEconomicPhaseLabel(phase: EconomicPhase): string {
  return PHASE_LABELS[phase] ?? phase;
}

export function getEconomicPhaseColor(phase: EconomicPhase): string {
  return PHASE_COLORS[phase] ?? COLORS.TEXT2;
}

// ─── Sector ───────────────────────────────────────────────

export function formatSector(sector: string): string {
  const map: Record<string, string> = {
    moda: "Moda",
    alimentacion: "Alimentación",
    tecnologia: "Tecnología",
    finanzas: "Finanzas",
    energia: "Energía",
    inmobiliario: "Inmobiliario",
    entretenimiento: "Entretenimiento",
    salud: "Salud",
    materias_primas: "Materias Primas",
    mercado_gris: "Mercado Gris",
  };
  return map[sector] ?? sector.charAt(0).toUpperCase() + sector.slice(1).replace("_", " ");
}

// ─── Numbers ──────────────────────────────────────────────

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

export function formatLargeNumber(n: number): string {
  if (Math.abs(n) >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(0);
}

// ─── Color utilities ──────────────────────────────────────

/**
 * Parse hex color to [r, g, b].
 */
export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return [r, g, b];
}

/**
 * Add alpha to a hex color → "rgba(r,g,b,a)"
 */
export function hexAlpha(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Linearly interpolate between two hex colors.
 */
export function interpolateColor(from: string, to: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(from);
  const [r2, g2, b2] = hexToRgb(to);
  const r = Math.round(lerp(r1, r2, t));
  const g = Math.round(lerp(g1, g2, t));
  const b = Math.round(lerp(b1, b2, t));
  return `rgb(${r}, ${g}, ${b})`;
}

// ─── Price history generator (for UI previews) ────────────

/**
 * Generate fake price history data for charts.
 */
export function generatePriceHistory(
  basePrice: number,
  days: number,
  volatility = 0.05
): { day: number; price: number; date: string }[] {
  const history: { day: number; price: number; date: string }[] = [];
  let price = basePrice * (0.8 + Math.random() * 0.4);

  for (let i = 0; i < days; i++) {
    const change = (Math.random() - 0.5) * 2 * volatility;
    const meanReversion = (basePrice - price) / basePrice * 0.1;
    price = Math.max(basePrice * 0.2, price * (1 + change + meanReversion));
    history.push({
      day: i + 1,
      price: roundTo(price, 2),
      date: formatDayMonth(i + 1),
    });
  }

  return history;
}

// ─── Playtime formatter ───────────────────────────────────

export function formatPlaytime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// ─── Ordinal ──────────────────────────────────────────────

export function ordinal(n: number): string {
  return `#${n}`;
}

// ─── ESG Score ────────────────────────────────────────────

export function formatESG(score: number): string {
  if (score >= 7) return "🌿 Excelente";
  if (score >= 4) return "♻️ Bueno";
  if (score >= 0) return "⚡ Neutro";
  if (score >= -4) return "⚠️ Bajo";
  return "☠️ Crítico";
}

export function getESGColor(score: number): string {
  if (score >= 7) return COLORS.SUCCESS;
  if (score >= 4) return "#4caf50";
  if (score >= 0) return COLORS.TEXT2;
  if (score >= -4) return COLORS.WARNING;
  return COLORS.DANGER;
}

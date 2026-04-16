// ============================================================
// NEXUS: Imperio del Mercado — Game Constants
// ============================================================

import type { EconomicPhase, ProductCategory } from "@/types/index";

// ─── Color Palette ────────────────────────────────────────
export const COLORS = {
  BG:        "#0a0e1a",
  SURFACE:   "#111827",
  SURFACE2:  "#1a2235",
  BORDER:    "#1e2d47",
  PRIMARY:   "#00c9ff",
  SECONDARY: "#7b2fff",
  GOLD:      "#ffd700",
  SUCCESS:   "#00e676",
  DANGER:    "#ff1744",
  WARNING:   "#ff9800",
  TEXT:      "#e8f4fd",
  TEXT2:     "#7b8fa8",
  TEXT3:     "#3d5166",
} as const;

// ─── Sector / Category Colors ────────────────────────────
export const SECTOR_COLORS: Record<string, string> = {
  moda:           "#ff6eb4",
  alimentacion:   "#4caf50",
  tecnologia:     "#00c9ff",
  finanzas:       "#7b2fff",
  energia:        "#ffd700",
  inmobiliario:   "#ff9800",
  entretenimiento:"#e040fb",
  salud:          "#00e676",
  materias_primas:"#8d6e63",
  mercado_gris:   "#546e7a",
  startup:        "#00c9ff",
  sme:            "#7b2fff",
  corporation:    "#ffd700",
};

// ─── Sector Display Names ─────────────────────────────────
export const SECTOR_NAMES: Record<string, string> = {
  moda:           "Moda",
  alimentacion:   "Alimentación",
  tecnologia:     "Tecnología",
  finanzas:       "Finanzas",
  energia:        "Energía",
  inmobiliario:   "Inmobiliario",
  entretenimiento:"Entretenimiento",
  salud:          "Salud",
  materias_primas:"Materias Primas",
  mercado_gris:   "Mercado Gris",
};

// ─── Sector Icons ─────────────────────────────────────────
export const SECTOR_ICONS: Record<string, string> = {
  moda:           "👗",
  alimentacion:   "🍽️",
  tecnologia:     "💻",
  finanzas:       "💹",
  energia:        "⚡",
  inmobiliario:   "🏠",
  entretenimiento:"🎭",
  salud:          "🏥",
  materias_primas:"⚙️",
  mercado_gris:   "🌑",
};

// ─── Economic Phase Labels & Colors ──────────────────────
export const PHASE_LABELS: Record<string, string> = {
  boom:       "Boom",
  growth:     "Crecimiento",
  stable:     "Estable",
  slowdown:   "Desaceleración",
  recession:  "Recesión",
  crisis:     "Crisis",
};

export const PHASE_COLORS: Record<string, string> = {
  boom:       "#00e676",
  growth:     "#4caf50",
  stable:     "#00c9ff",
  slowdown:   "#ff9800",
  recession:  "#ff6d00",
  crisis:     "#ff1744",
};

// ─── Game Configuration ───────────────────────────────────
export const GAME_CONFIG = {
  WIDTH:         1280,
  HEIGHT:        800,
  TARGET_FPS:    60,
  REAL_SECS_PER_DAY: 45,   // 45 real seconds = 1 in-game day
  MAX_SAVE_SLOTS: 3,
  MAX_NOTIFICATIONS: 50,
  MAX_NEWS_ITEMS:    50,
  PRICE_HISTORY_DAYS: 365,
  MAX_WORKERS:        50,
  MAX_FACILITIES:     20,
  BANKRUPTCY_CASH:    -10_000,  // game over threshold
  WIN_NET_WORTH:      1_000_000, // 1M€ win condition
} as const;

// ─── Worker Types ─────────────────────────────────────────
export const WORKER_TYPES = {
  junior:     { label: "Junior",      monthlyCost: 800,  productionBonus: 1.0 },
  senior:     { label: "Senior",      monthlyCost: 2000, productionBonus: 1.8 },
  manager:    { label: "Manager",     monthlyCost: 3500, productionBonus: 2.5 },
  specialist: { label: "Especialista", monthlyCost: 4500, productionBonus: 3.2 },
} as const;

// ─── Facility Templates ───────────────────────────────────
export const FACILITY_TEMPLATES = {
  taller_pequeno: {
    label: "Taller Pequeño",
    cost: 5_000,
    capacity: 10,
    maintenanceCost: 200,
    icon: "🔧",
  },
  oficina: {
    label: "Oficina",
    cost: 8_000,
    capacity: 20,
    maintenanceCost: 350,
    icon: "🏢",
  },
  almacen: {
    label: "Almacén",
    cost: 15_000,
    capacity: 50,
    maintenanceCost: 500,
    icon: "📦",
  },
  laboratorio: {
    label: "Laboratorio",
    cost: 20_000,
    capacity: 15,
    maintenanceCost: 800,
    icon: "🔬",
  },
  fabrica: {
    label: "Fábrica",
    cost: 25_000,
    capacity: 100,
    maintenanceCost: 1_200,
    icon: "🏭",
  },
} as const;

// ─── Districts ────────────────────────────────────────────
export const DISTRICTS = {
  norte: {
    id: "norte",
    name: "Distrito Norte",
    sector: "moda" as ProductCategory,
    color: "#ff6eb4",
    description: "El corazón de la moda y los medios de comunicación.",
    position: { x: 0.65, y: 0.1 },
  },
  financiero: {
    id: "financiero",
    name: "Distrito Financiero",
    sector: "finanzas" as ProductCategory,
    color: "#7b2fff",
    description: "Bancos, fondos de inversión y la bolsa de valores.",
    position: { x: 0.5, y: 0.15 },
  },
  sur: {
    id: "sur",
    name: "Barrio Sur",
    sector: "alimentacion" as ProductCategory,
    color: "#4caf50",
    description: "Mercados locales, restaurantes y economía popular.",
    position: { x: 0.2, y: 0.75 },
  },
  tecnologico: {
    id: "tecnologico",
    name: "Parque Tecnológico",
    sector: "tecnologia" as ProductCategory,
    color: "#00c9ff",
    description: "Startups, I+D y la vanguardia digital.",
    position: { x: 0.15, y: 0.2 },
  },
  industrial: {
    id: "industrial",
    name: "Puerto Industrial",
    sector: "energia" as ProductCategory,
    color: "#ffd700",
    description: "Energía, materias primas y logística.",
    position: { x: 0.8, y: 0.75 },
  },
  centro: {
    id: "centro",
    name: "Centro Comercial",
    sector: "entretenimiento" as ProductCategory,
    color: "#e040fb",
    description: "Entretenimiento, retail y turismo.",
    position: { x: 0.5, y: 0.5 },
  },
} as const;

// ─── Keyboard Shortcuts ───────────────────────────────────
export const SHORTCUTS = [
  { key: "Escape",     action: "Volver / Cerrar" },
  { key: "F11",        action: "Pantalla completa" },
  { key: "Space",      action: "Pausar / Continuar" },
  { key: "M",          action: "Ir a Mercados" },
  { key: "E",          action: "Ir a Empresa" },
  { key: "P",          action: "Ir a Cartera" },
  { key: "1–9",        action: "Acceso rápido a menús" },
] as const;

// ─── Achievement Categories ───────────────────────────────
export const ACHIEVEMENT_CATEGORY_LABELS: Record<string, string> = {
  company:    "Empresa",
  market:     "Mercado",
  story:      "Historia",
  rival:      "Rivales",
  finance:    "Finanzas",
  milestone:  "Hitos",
  secret:     "Secreto",
};

// ─── Category Colors (alias for scenes) ──────────────────
export const MARKET_COLORS = SECTOR_COLORS;

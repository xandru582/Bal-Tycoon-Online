/**
 * LORE PROFUNDO DE NEXUS V2
 * Contexto Tycoon: Ya no creas camisetas, controlas sindicatos de datos en un año 2284 oscuro.
 */

export const FACTIONS = [
  {
    id: "aetheria",
    name: "Sindicato Aetheria",
    focus: "Tecnología Quantum y Mercados de Información",
    color: "hsl(var(--c-primary))",
    buff_desc: "+20% velocidad de análisis de mercado",
  },
  {
    id: "obsidian",
    name: "Obsidian Logistics",
    focus: "Manufactura Industrial Naval Espacial",
    color: "hsl(var(--c-warning))",
    buff_desc: "-15% costes de instalación y transporte",
  },
  {
    id: "chroma",
    name: "Chroma Bioscience",
    focus: "Alimentación Sintética y Aumentos Médicos",
    color: "hsl(var(--c-success))",
    buff_desc: "+30% reputación generada por venta",
  }
];

export const PRODUCTS_LORE = [
  { id: "p1", name: "Raciones de Síntesis", basePrice: 25, type: "Bio" },
  { id: "p2", name: "Núcleos de Procesamiento", basePrice: 850, type: "Quantum" },
  { id: "p3", name: "Fibras de Carbono Óptico", basePrice: 420, type: "Industrial" }
];

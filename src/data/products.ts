// ============================================================
// NEXUS: Imperio del Mercado — Product Catalog
// ============================================================

import { ProductCategory, WorkerSkill } from "../types";
import type { Product, ProductionChain } from "../types";

// ─── Category Metadata ────────────────────────────────────────

export const CATEGORY_DISPLAY_NAMES: Record<ProductCategory, string> = {
  [ProductCategory.Moda]: "Moda & Estilo",
  [ProductCategory.Alimentacion]: "Alimentación",
  [ProductCategory.Tecnologia]: "Tecnología",
  [ProductCategory.Finanzas]: "Servicios Financieros",
  [ProductCategory.Energia]: "Energía",
  [ProductCategory.Inmobiliario]: "Inmobiliario",
  [ProductCategory.Entretenimiento]: "Entretenimiento",
  [ProductCategory.Salud]: "Salud & Bienestar",
  [ProductCategory.MateriasPrimas]: "Materias Primas",
  [ProductCategory.MercadoGris]: "Mercado Gris",
};

export const CATEGORY_COLORS: Record<ProductCategory, string> = {
  [ProductCategory.Moda]: "#E91E8C",
  [ProductCategory.Alimentacion]: "#FF6F00",
  [ProductCategory.Tecnologia]: "#1565C0",
  [ProductCategory.Finanzas]: "#4A148C",
  [ProductCategory.Energia]: "#F9A825",
  [ProductCategory.Inmobiliario]: "#37474F",
  [ProductCategory.Entretenimiento]: "#AD1457",
  [ProductCategory.Salud]: "#00695C",
  [ProductCategory.MateriasPrimas]: "#4E342E",
  [ProductCategory.MercadoGris]: "#212121",
};

export const CATEGORY_ICONS: Record<ProductCategory, string> = {
  [ProductCategory.Moda]: "👗",
  [ProductCategory.Alimentacion]: "🍽️",
  [ProductCategory.Tecnologia]: "💻",
  [ProductCategory.Finanzas]: "📈",
  [ProductCategory.Energia]: "⚡",
  [ProductCategory.Inmobiliario]: "🏢",
  [ProductCategory.Entretenimiento]: "🎭",
  [ProductCategory.Salud]: "⚕️",
  [ProductCategory.MateriasPrimas]: "🏭",
  [ProductCategory.MercadoGris]: "🌑",
};

// ─── Production Chain Helpers ─────────────────────────────────

const noChain: ProductionChain | undefined = undefined;

function makeChain(
  inputs: { productId: string; quantity: number }[],
  outputProductId: string,
  outputQuantity: number,
  timeInDays: number,
  facilityRequired: string,
  skillRequired: WorkerSkill,
  energyCost: number
): ProductionChain {
  return { inputs, outputProductId, outputQuantity, timeInDays, facilityRequired, skillRequired, energyCost };
}

// ─── Product Definitions ──────────────────────────────────────

export const PRODUCTS: Record<string, Product> = {

  // ── MODA ────────────────────────────────────────────────────

  ropa_basica: {
    id: "ropa_basica",
    name: "Ropa Básica",
    category: ProductCategory.Moda,
    basePrice: 35,
    minPrice: 15,
    maxPrice: 80,
    volatility: 0.15,
    demand: 0.85,
    supply: 0.80,
    productionCost: 18,
    esgScore: 1,
    exportValue: 0.9,
    tags: ["consumo_masivo", "textil", "bajo_margen"],
    description: "Camisetas, pantalones y ropa básica de uso diario. Alta rotación, bajo margen unitario. La columna vertebral del comercio textil en Nueva Vista.",
    icon: "👕",
    unlockLevel: 1,
    isIllegal: false,
    productionChain: makeChain(
      [{ productId: "textiles", quantity: 2 }],
      "ropa_basica", 10, 2, "factory", WorkerSkill.Operations, 5
    ),
  },

  ropa_lujo: {
    id: "ropa_lujo",
    name: "Ropa de Lujo",
    category: ProductCategory.Moda,
    basePrice: 450,
    minPrice: 200,
    maxPrice: 1200,
    volatility: 0.35,
    demand: 0.45,
    supply: 0.30,
    productionCost: 150,
    esgScore: 3,
    exportValue: 1.8,
    tags: ["premium", "textil", "alto_margen", "exclusivo"],
    description: "Prendas de diseñador confeccionadas con materiales premium. Demanda sensible a reputación y ciclos económicos. Margen excepcional cuando el mercado acompaña.",
    icon: "👔",
    unlockLevel: 2,
    isIllegal: false,
    productionChain: makeChain(
      [{ productId: "textiles", quantity: 3 }, { productId: "accesorios", quantity: 1 }],
      "ropa_lujo", 5, 7, "factory", WorkerSkill.Creative, 10
    ),
  },

  accesorios: {
    id: "accesorios",
    name: "Accesorios de Moda",
    category: ProductCategory.Moda,
    basePrice: 120,
    minPrice: 40,
    maxPrice: 600,
    volatility: 0.40,
    demand: 0.60,
    supply: 0.50,
    productionCost: 45,
    esgScore: 2,
    exportValue: 1.4,
    tags: ["complemento", "textil", "tendencia"],
    description: "Bolsos, cinturones, joyería de moda y complementos. Muy sensibles a tendencias y campañas de marketing. Excelente margen con la red social adecuada.",
    icon: "👜",
    unlockLevel: 1,
    isIllegal: false,
    productionChain: makeChain(
      [{ productId: "textiles", quantity: 1 }, { productId: "plastico", quantity: 1 }],
      "accesorios", 8, 3, "factory", WorkerSkill.Creative, 4
    ),
  },

  perfumes: {
    id: "perfumes",
    name: "Perfumes y Fragancias",
    category: ProductCategory.Moda,
    basePrice: 280,
    minPrice: 60,
    maxPrice: 900,
    volatility: 0.30,
    demand: 0.55,
    supply: 0.40,
    productionCost: 80,
    esgScore: 0,
    exportValue: 2.0,
    tags: ["premium", "consumible", "regalo", "lujo"],
    description: "Fragancias premium con identidad de marca. Alto valor exportable y excelente posición como producto de regalo. Requiere fuerte inversión en branding.",
    icon: "🌸",
    unlockLevel: 2,
    isIllegal: false,
    productionChain: noChain,
  },

  calzado: {
    id: "calzado",
    name: "Calzado",
    category: ProductCategory.Moda,
    basePrice: 95,
    minPrice: 30,
    maxPrice: 500,
    volatility: 0.20,
    demand: 0.75,
    supply: 0.65,
    productionCost: 40,
    esgScore: 1,
    exportValue: 1.2,
    tags: ["textil", "consumo_medio", "masivo"],
    description: "Desde zapatillas urbanas hasta zapatos de diseño. Demanda estable con picos estacionales. Terreno competido pero con nichos rentables.",
    icon: "👟",
    unlockLevel: 1,
    isIllegal: false,
    productionChain: makeChain(
      [{ productId: "textiles", quantity: 2 }, { productId: "plastico", quantity: 1 }],
      "calzado", 8, 4, "factory", WorkerSkill.Operations, 6
    ),
  },

  // ── ALIMENTACIÓN ────────────────────────────────────────────

  comida_rapida: {
    id: "comida_rapida",
    name: "Comida Rápida",
    category: ProductCategory.Alimentacion,
    basePrice: 12,
    minPrice: 6,
    maxPrice: 25,
    volatility: 0.10,
    demand: 0.95,
    supply: 0.90,
    productionCost: 5,
    esgScore: -3,
    exportValue: 0.5,
    tags: ["consumo_diario", "alto_volumen", "local"],
    description: "Cadenas de comida rápida, food trucks y puestos callejeros. Demanda casi inelástica, márgenes ajustados pero volumen extraordinario.",
    icon: "🍔",
    unlockLevel: 1,
    isIllegal: false,
    productionChain: noChain,
  },

  restaurante: {
    id: "restaurante",
    name: "Restaurante Gourmet",
    category: ProductCategory.Alimentacion,
    basePrice: 65,
    minPrice: 25,
    maxPrice: 200,
    volatility: 0.25,
    demand: 0.65,
    supply: 0.50,
    productionCost: 28,
    esgScore: 4,
    exportValue: 0.3,
    tags: ["servicio", "experiencia", "reputacion"],
    description: "Restaurante de cocina elaborada con identidad propia. La reputación es el activo principal. Un buen año puede disparar los ingresos; un escándalo alimentario, hundirlos.",
    icon: "🍽️",
    unlockLevel: 2,
    isIllegal: false,
    productionChain: noChain,
  },

  productos_organicos: {
    id: "productos_organicos",
    name: "Productos Orgánicos",
    category: ProductCategory.Alimentacion,
    basePrice: 48,
    minPrice: 20,
    maxPrice: 120,
    volatility: 0.20,
    demand: 0.60,
    supply: 0.35,
    productionCost: 22,
    esgScore: 8,
    exportValue: 1.5,
    tags: ["sostenible", "premium", "tendencia", "esg"],
    description: "Alimentos ecológicos certificados, superalimentos y productos de origen trazable. Demanda creciente impulsada por tendencias de bienestar. Alto ESG.",
    icon: "🥗",
    unlockLevel: 1,
    isIllegal: false,
    productionChain: noChain,
  },

  bebidas: {
    id: "bebidas",
    name: "Bebidas y Refrescos",
    category: ProductCategory.Alimentacion,
    basePrice: 8,
    minPrice: 3,
    maxPrice: 20,
    volatility: 0.12,
    demand: 0.90,
    supply: 0.85,
    productionCost: 3,
    esgScore: -1,
    exportValue: 0.8,
    tags: ["consumo_diario", "volumen", "marca"],
    description: "Agua embotellada, refrescos, bebidas energéticas y zumos. Mercado dominado por grandes marcas pero con espacio para marcas locales con buena distribución.",
    icon: "🥤",
    unlockLevel: 1,
    isIllegal: false,
    productionChain: noChain,
  },

  catering: {
    id: "catering",
    name: "Servicios de Catering",
    category: ProductCategory.Alimentacion,
    basePrice: 850,
    minPrice: 300,
    maxPrice: 5000,
    volatility: 0.35,
    demand: 0.50,
    supply: 0.40,
    productionCost: 350,
    esgScore: 2,
    exportValue: 0.2,
    tags: ["b2b", "eventos", "servicio", "contratos"],
    description: "Servicio de catering para eventos corporativos, bodas y celebraciones privadas. Alta variabilidad, pero los contratos con empresas ofrecen ingresos recurrentes.",
    icon: "🥂",
    unlockLevel: 2,
    isIllegal: false,
    productionChain: noChain,
  },

  // ── TECNOLOGÍA ──────────────────────────────────────────────

  smartphones: {
    id: "smartphones",
    name: "Smartphones",
    category: ProductCategory.Tecnologia,
    basePrice: 380,
    minPrice: 150,
    maxPrice: 1100,
    volatility: 0.30,
    demand: 0.80,
    supply: 0.70,
    productionCost: 200,
    esgScore: -2,
    exportValue: 1.6,
    tags: ["electronica", "consumo", "tecnologia"],
    description: "Teléfonos inteligentes de gama media y alta. Ciclos de renovación cortos, alto volumen de ventas. Competencia global intensa pero mercado local protegido por distribución.",
    icon: "📱",
    unlockLevel: 3,
    isIllegal: false,
    productionChain: makeChain(
      [{ productId: "componentes", quantity: 5 }, { productId: "software", quantity: 1 }],
      "smartphones", 20, 14, "factory", WorkerSkill.Tech, 25
    ),
  },

  software: {
    id: "software",
    name: "Software Empresarial",
    category: ProductCategory.Tecnologia,
    basePrice: 1200,
    minPrice: 200,
    maxPrice: 8000,
    volatility: 0.45,
    demand: 0.70,
    supply: 0.50,
    productionCost: 400,
    esgScore: 5,
    exportValue: 2.5,
    tags: ["saas", "b2b", "recurrente", "margen_alto"],
    description: "Soluciones de software para gestión empresarial, ERP, CRM y herramientas de productividad. Márgenes elevadísimos una vez amortizado el desarrollo. Modelo de suscripción ideal.",
    icon: "💾",
    unlockLevel: 2,
    isIllegal: false,
    productionChain: noChain,
  },

  hardware: {
    id: "hardware",
    name: "Hardware Industrial",
    category: ProductCategory.Tecnologia,
    basePrice: 650,
    minPrice: 200,
    maxPrice: 3000,
    volatility: 0.25,
    demand: 0.65,
    supply: 0.60,
    productionCost: 350,
    esgScore: -1,
    exportValue: 1.3,
    tags: ["b2b", "infraestructura", "ciclico"],
    description: "Servidores, routers, equipos de red y hardware de oficina. Demanda ligada al ciclo de inversión empresarial. Contratos de mantenimiento aseguran ingresos recurrentes.",
    icon: "🖥️",
    unlockLevel: 2,
    isIllegal: false,
    productionChain: makeChain(
      [{ productId: "componentes", quantity: 4 }],
      "hardware", 15, 10, "factory", WorkerSkill.Tech, 20
    ),
  },

  ia_servicios: {
    id: "ia_servicios",
    name: "Servicios de IA",
    category: ProductCategory.Tecnologia,
    basePrice: 2500,
    minPrice: 500,
    maxPrice: 15000,
    volatility: 0.60,
    demand: 0.55,
    supply: 0.25,
    productionCost: 800,
    esgScore: 3,
    exportValue: 3.0,
    tags: ["vanguardia", "b2b", "alto_margen", "futuro"],
    description: "Desarrollo e integración de soluciones de inteligencia artificial para empresas. Sector en explosión. Quienes entren primero dominarán el mercado. Alta volatilidad.",
    icon: "🤖",
    unlockLevel: 4,
    isIllegal: false,
    productionChain: noChain,
  },

  ciberseguridad: {
    id: "ciberseguridad",
    name: "Ciberseguridad",
    category: ProductCategory.Tecnologia,
    basePrice: 1800,
    minPrice: 400,
    maxPrice: 9000,
    volatility: 0.40,
    demand: 0.60,
    supply: 0.30,
    productionCost: 600,
    esgScore: 6,
    exportValue: 2.2,
    tags: ["b2b", "contratos", "defensivo", "regulado"],
    description: "Auditorías de seguridad, protección de datos y respuesta a incidentes. La demanda crece con cada escándalo de hacking en las noticias. Contratos anuales con grandes empresas.",
    icon: "🔒",
    unlockLevel: 3,
    isIllegal: false,
    productionChain: noChain,
  },

  // ── FINANZAS ────────────────────────────────────────────────

  prestamos: {
    id: "prestamos",
    name: "Préstamos y Créditos",
    category: ProductCategory.Finanzas,
    basePrice: 5000,
    minPrice: 500,
    maxPrice: 100000,
    volatility: 0.20,
    demand: 0.75,
    supply: 0.65,
    productionCost: 1000,
    esgScore: -2,
    exportValue: 0.5,
    tags: ["servicios_financieros", "regulado", "recurrente"],
    description: "Líneas de crédito y préstamos para empresas y particulares. Ingresos predecibles via tipos de interés. Muy regulado. El riesgo es la morosidad en recesión.",
    icon: "💳",
    unlockLevel: 3,
    isIllegal: false,
    productionChain: noChain,
  },

  seguros: {
    id: "seguros",
    name: "Seguros",
    category: ProductCategory.Finanzas,
    basePrice: 800,
    minPrice: 100,
    maxPrice: 10000,
    volatility: 0.15,
    demand: 0.70,
    supply: 0.60,
    productionCost: 200,
    esgScore: 2,
    exportValue: 0.7,
    tags: ["servicios_financieros", "recurrente", "regulado"],
    description: "Pólizas de seguros de vida, hogar, empresa y salud. Ingresos recurrentes con primas mensuales. El negocio es la gestión del riesgo: si siniestros son altos, las pérdidas duelen.",
    icon: "🛡️",
    unlockLevel: 3,
    isIllegal: false,
    productionChain: noChain,
  },

  fondos_inversion: {
    id: "fondos_inversion",
    name: "Fondos de Inversión",
    category: ProductCategory.Finanzas,
    basePrice: 10000,
    minPrice: 1000,
    maxPrice: 500000,
    volatility: 0.50,
    demand: 0.50,
    supply: 0.40,
    productionCost: 2000,
    esgScore: 1,
    exportValue: 1.5,
    tags: ["alta_gestion", "b2b", "ciclo_mercado"],
    description: "Gestión de carteras y fondos de inversión para clientes institucionales y de alto patrimonio. Las comisiones de gestión son el negocio real. Volátil con el ciclo de mercado.",
    icon: "📊",
    unlockLevel: 4,
    isIllegal: false,
    productionChain: noChain,
  },

  crypto: {
    id: "crypto",
    name: "Criptoactivos",
    category: ProductCategory.Finanzas,
    basePrice: 2200,
    minPrice: 100,
    maxPrice: 50000,
    volatility: 0.90,
    demand: 0.55,
    supply: 0.45,
    productionCost: 500,
    esgScore: -4,
    exportValue: 2.8,
    tags: ["especulativo", "digital", "regulacion_incierta"],
    description: "Trading e infraestructura de criptoactivos. Volatilidad extrema. Puede triplicar la inversión en una semana o hundirla. La regulación de Nueva Vista es aún incierta.",
    icon: "₿",
    unlockLevel: 3,
    isIllegal: false,
    productionChain: noChain,
  },

  consultoria_financiera: {
    id: "consultoria_financiera",
    name: "Consultoría Financiera",
    category: ProductCategory.Finanzas,
    basePrice: 3500,
    minPrice: 500,
    maxPrice: 20000,
    volatility: 0.25,
    demand: 0.65,
    supply: 0.45,
    productionCost: 900,
    esgScore: 3,
    exportValue: 1.1,
    tags: ["b2b", "servicios", "reputacion"],
    description: "Asesoría en fusiones, adquisiciones y reestructuración financiera. Los clientes pagan por el nombre y el historial. Construir reputación lleva tiempo, perderla es cuestión de horas.",
    icon: "📋",
    unlockLevel: 2,
    isIllegal: false,
    productionChain: noChain,
  },

  // ── ENERGÍA ─────────────────────────────────────────────────

  paneles_solares: {
    id: "paneles_solares",
    name: "Energía Solar",
    category: ProductCategory.Energia,
    basePrice: 8000,
    minPrice: 3000,
    maxPrice: 25000,
    volatility: 0.20,
    demand: 0.65,
    supply: 0.40,
    productionCost: 4000,
    esgScore: 10,
    exportValue: 1.8,
    tags: ["renovable", "esg", "inversion", "infraestructura"],
    description: "Instalación de plantas solares y paneles para empresas. Proyecto de largo plazo con retornos estables. Muy valorado por inversores ESG. Requiere capital inicial elevado.",
    icon: "☀️",
    unlockLevel: 3,
    isIllegal: false,
    productionChain: makeChain(
      [{ productId: "componentes", quantity: 8 }, { productId: "acero", quantity: 3 }],
      "paneles_solares", 5, 30, "factory", WorkerSkill.Operations, 40
    ),
  },

  petroleo: {
    id: "petroleo",
    name: "Petróleo y Derivados",
    category: ProductCategory.Energia,
    basePrice: 320,
    minPrice: 80,
    maxPrice: 800,
    volatility: 0.65,
    demand: 0.80,
    supply: 0.70,
    productionCost: 120,
    esgScore: -8,
    exportValue: 2.0,
    tags: ["commodities", "volatil", "politico", "alto_volumen"],
    description: "Trading de crudo y productos derivados. Afectado masivamente por geopolítica global. Enorme potencial de beneficio y pérdida. ESG muy negativo: presión de reguladores creciente.",
    icon: "🛢️",
    unlockLevel: 4,
    isIllegal: false,
    productionChain: noChain,
  },

  gas: {
    id: "gas",
    name: "Gas Natural",
    category: ProductCategory.Energia,
    basePrice: 180,
    minPrice: 50,
    maxPrice: 500,
    volatility: 0.55,
    demand: 0.75,
    supply: 0.65,
    productionCost: 70,
    esgScore: -5,
    exportValue: 1.7,
    tags: ["commodities", "volatil", "infraestructura"],
    description: "Gas natural para uso industrial y residencial. Menos volátil que el petróleo pero igualmente sensible a crisis geopolíticas y climáticas.",
    icon: "🔥",
    unlockLevel: 3,
    isIllegal: false,
    productionChain: noChain,
  },

  electricidad_renovable: {
    id: "electricidad_renovable",
    name: "Electricidad Renovable",
    category: ProductCategory.Energia,
    basePrice: 950,
    minPrice: 400,
    maxPrice: 3000,
    volatility: 0.18,
    demand: 0.70,
    supply: 0.35,
    productionCost: 380,
    esgScore: 9,
    exportValue: 1.5,
    tags: ["renovable", "esg", "contratos", "regulado"],
    description: "Generación y distribución de electricidad a partir de fuentes renovables (eólica, solar, hidráulica). Contratos a largo plazo con el gobierno. Altísimo ESG score.",
    icon: "🌱",
    unlockLevel: 4,
    isIllegal: false,
    productionChain: makeChain(
      [{ productId: "paneles_solares", quantity: 2 }],
      "electricidad_renovable", 100, 60, "factory", WorkerSkill.Operations, 15
    ),
  },

  // ── INMOBILIARIO ────────────────────────────────────────────

  apartamentos: {
    id: "apartamentos",
    name: "Apartamentos Residenciales",
    category: ProductCategory.Inmobiliario,
    basePrice: 95000,
    minPrice: 40000,
    maxPrice: 350000,
    volatility: 0.15,
    demand: 0.80,
    supply: 0.55,
    productionCost: 60000,
    esgScore: 0,
    exportValue: 0.3,
    tags: ["activo", "largo_plazo", "arrendamiento", "revalorizacion"],
    description: "Inmuebles residenciales para venta o alquiler. Activo refugio en épocas de incertidumbre. Los alquileres generan flujo constante. Vulnerable a subidas de tipos de interés.",
    icon: "🏠",
    unlockLevel: 3,
    isIllegal: false,
    productionChain: noChain,
  },

  oficinas: {
    id: "oficinas",
    name: "Espacios de Oficina",
    category: ProductCategory.Inmobiliario,
    basePrice: 180000,
    minPrice: 80000,
    maxPrice: 600000,
    volatility: 0.20,
    demand: 0.65,
    supply: 0.50,
    productionCost: 120000,
    esgScore: 1,
    exportValue: 0.2,
    tags: ["b2b", "contratos", "prime", "coworking"],
    description: "Plantas de oficina en el Distrito Financiero y Tecnológico. Contratos anuales con empresas. El auge del trabajo remoto ha sacudido el sector pero los mejores inmuebles siguen llenos.",
    icon: "🏢",
    unlockLevel: 4,
    isIllegal: false,
    productionChain: noChain,
  },

  locales_comerciales: {
    id: "locales_comerciales",
    name: "Locales Comerciales",
    category: ProductCategory.Inmobiliario,
    basePrice: 65000,
    minPrice: 25000,
    maxPrice: 220000,
    volatility: 0.25,
    demand: 0.70,
    supply: 0.60,
    productionCost: 40000,
    esgScore: 1,
    exportValue: 0.2,
    tags: ["retail", "ubicacion", "contratos"],
    description: "Locales en planta baja para comercio. La ubicación lo determina todo. Un local en zona de alto tráfico puede tener rentabilidades extraordinarias.",
    icon: "🏪",
    unlockLevel: 2,
    isIllegal: false,
    productionChain: noChain,
  },

  almacenes: {
    id: "almacenes",
    name: "Almacenes y Logística",
    category: ProductCategory.Inmobiliario,
    basePrice: 35000,
    minPrice: 15000,
    maxPrice: 120000,
    volatility: 0.10,
    demand: 0.85,
    supply: 0.70,
    productionCost: 22000,
    esgScore: -1,
    exportValue: 0.4,
    tags: ["logistica", "b2b", "demanda_estable"],
    description: "Naves industriales y almacenes logísticos. Demanda estable impulsada por el e-commerce. Rentabilidad moderada pero predecible. Claves en cadenas de suministro.",
    icon: "🏭",
    unlockLevel: 2,
    isIllegal: false,
    productionChain: noChain,
  },

  // ── ENTRETENIMIENTO ─────────────────────────────────────────

  musica: {
    id: "musica",
    name: "Producción Musical",
    category: ProductCategory.Entretenimiento,
    basePrice: 2500,
    minPrice: 200,
    maxPrice: 20000,
    volatility: 0.70,
    demand: 0.75,
    supply: 0.80,
    productionCost: 800,
    esgScore: 4,
    exportValue: 2.5,
    tags: ["cultura", "tendencia", "viral", "streaming"],
    description: "Producción y distribución musical, gestión de artistas y derechos. El hit correcto puede generar millones. Sin él, los costes fijos destruyen capital rápido.",
    icon: "🎵",
    unlockLevel: 2,
    isIllegal: false,
    productionChain: noChain,
  },

  videojuegos: {
    id: "videojuegos",
    name: "Videojuegos",
    category: ProductCategory.Entretenimiento,
    basePrice: 5500,
    minPrice: 1000,
    maxPrice: 40000,
    volatility: 0.65,
    demand: 0.70,
    supply: 0.55,
    productionCost: 2500,
    esgScore: 2,
    exportValue: 3.0,
    tags: ["digital", "exportable", "tendencia", "largo_desarrollo"],
    description: "Desarrollo y publicación de videojuegos para consola, PC y móvil. Ciclos de desarrollo largos con ingresos concentrados en el lanzamiento. Los éxitos globales son exponenciales.",
    icon: "🎮",
    unlockLevel: 3,
    isIllegal: false,
    productionChain: makeChain(
      [{ productId: "software", quantity: 1 }],
      "videojuegos", 1, 90, "lab", WorkerSkill.Creative, 30
    ),
  },

  cine: {
    id: "cine",
    name: "Producción Cinematográfica",
    category: ProductCategory.Entretenimiento,
    basePrice: 15000,
    minPrice: 3000,
    maxPrice: 100000,
    volatility: 0.75,
    demand: 0.60,
    supply: 0.30,
    productionCost: 8000,
    esgScore: 3,
    exportValue: 2.8,
    tags: ["cultura", "festival", "exportable", "alto_riesgo"],
    description: "Producción de largometrajes y contenido audiovisual. El negocio del riesgo máximo: un éxito de taquilla lo cambia todo. Los festivales abren puertas de distribución internacional.",
    icon: "🎬",
    unlockLevel: 4,
    isIllegal: false,
    productionChain: noChain,
  },

  eventos: {
    id: "eventos",
    name: "Eventos y Espectáculos",
    category: ProductCategory.Entretenimiento,
    basePrice: 4500,
    minPrice: 500,
    maxPrice: 30000,
    volatility: 0.45,
    demand: 0.65,
    supply: 0.50,
    productionCost: 2000,
    esgScore: 3,
    exportValue: 0.6,
    tags: ["efimero", "local", "reputacion", "experiencia"],
    description: "Organización de conciertos, festivales y eventos corporativos. Gran visibilidad de marca. Los eventos exitosos posicionan a la empresa en toda la ciudad.",
    icon: "🎪",
    unlockLevel: 2,
    isIllegal: false,
    productionChain: noChain,
  },

  streaming: {
    id: "streaming",
    name: "Plataforma de Streaming",
    category: ProductCategory.Entretenimiento,
    basePrice: 12000,
    minPrice: 3000,
    maxPrice: 80000,
    volatility: 0.50,
    demand: 0.75,
    supply: 0.40,
    productionCost: 5000,
    esgScore: 2,
    exportValue: 2.2,
    tags: ["digital", "recurrente", "escala", "contenido"],
    description: "Plataforma de suscripción para contenido de video o música. Una vez construida la base de suscriptores, los ingresos son predecibles. Requiere inversión constante en contenido.",
    icon: "📺",
    unlockLevel: 4,
    isIllegal: false,
    productionChain: makeChain(
      [{ productId: "software", quantity: 2 }, { productId: "ia_servicios", quantity: 1 }],
      "streaming", 1, 45, "server_farm", WorkerSkill.Tech, 50
    ),
  },

  // ── SALUD ───────────────────────────────────────────────────

  farmaceutica: {
    id: "farmaceutica",
    name: "Productos Farmacéuticos",
    category: ProductCategory.Salud,
    basePrice: 3200,
    minPrice: 800,
    maxPrice: 15000,
    volatility: 0.30,
    demand: 0.85,
    supply: 0.65,
    productionCost: 1200,
    esgScore: 4,
    exportValue: 2.0,
    tags: ["regulado", "defensivo", "patentes", "i+d"],
    description: "Desarrollo y venta de medicamentos y productos sanitarios. Regulación estricta pero márgenes excepcionales con patentes. Demanda resistente a recesiones.",
    icon: "💊",
    unlockLevel: 4,
    isIllegal: false,
    productionChain: noChain,
  },

  clinicas: {
    id: "clinicas",
    name: "Clínicas y Salud Privada",
    category: ProductCategory.Salud,
    basePrice: 8500,
    minPrice: 2000,
    maxPrice: 40000,
    volatility: 0.15,
    demand: 0.80,
    supply: 0.45,
    productionCost: 4000,
    esgScore: 7,
    exportValue: 0.4,
    tags: ["servicio", "regulado", "local", "reputacion"],
    description: "Red de clínicas privadas con servicios médicos especializados. Ingresos estables y reputación como activo clave. La percepción de calidad es todo en este sector.",
    icon: "🏥",
    unlockLevel: 4,
    isIllegal: false,
    productionChain: noChain,
  },

  bienestar: {
    id: "bienestar",
    name: "Centros de Bienestar",
    category: ProductCategory.Salud,
    basePrice: 1200,
    minPrice: 300,
    maxPrice: 6000,
    volatility: 0.25,
    demand: 0.65,
    supply: 0.55,
    productionCost: 500,
    esgScore: 6,
    exportValue: 0.5,
    tags: ["lifestyle", "tendencia", "suscripcion"],
    description: "Spas, gimnasios premium, centros de yoga y meditación. La tendencia wellness impulsa la demanda entre las clases medias-altas. Alta retención de clientes con membresías.",
    icon: "🧘",
    unlockLevel: 2,
    isIllegal: false,
    productionChain: noChain,
  },

  suplementos: {
    id: "suplementos",
    name: "Suplementos Nutricionales",
    category: ProductCategory.Salud,
    basePrice: 65,
    minPrice: 20,
    maxPrice: 250,
    volatility: 0.30,
    demand: 0.70,
    supply: 0.60,
    productionCost: 22,
    esgScore: 2,
    exportValue: 1.4,
    tags: ["consumible", "tendencia", "online"],
    description: "Vitaminas, proteínas, adaptógenos y suplementos deportivos. Mercado en crecimiento con mucha competencia de marcas directas al consumidor. El marketing digital es clave.",
    icon: "💪",
    unlockLevel: 1,
    isIllegal: false,
    productionChain: noChain,
  },

  // ── MATERIAS PRIMAS ─────────────────────────────────────────

  acero: {
    id: "acero",
    name: "Acero Industrial",
    category: ProductCategory.MateriasPrimas,
    basePrice: 85,
    minPrice: 40,
    maxPrice: 200,
    volatility: 0.35,
    demand: 0.80,
    supply: 0.75,
    productionCost: 45,
    esgScore: -3,
    exportValue: 1.2,
    tags: ["commodity", "b2b", "construccion", "industria"],
    description: "Acero para construcción, fabricación y manufactura industrial. Precio muy ligado al ciclo económico global. Insumo esencial para múltiples sectores.",
    icon: "⚙️",
    unlockLevel: 1,
    isIllegal: false,
    productionChain: noChain,
  },

  plastico: {
    id: "plastico",
    name: "Plásticos y Polímeros",
    category: ProductCategory.MateriasPrimas,
    basePrice: 30,
    minPrice: 12,
    maxPrice: 80,
    volatility: 0.25,
    demand: 0.85,
    supply: 0.80,
    productionCost: 15,
    esgScore: -6,
    exportValue: 0.9,
    tags: ["commodity", "b2b", "manufactura", "esg_negativo"],
    description: "Materiales plásticos para manufactura. Demanda muy alta pero ESG muy negativo. Regulaciones de reciclaje en aumento pueden encarecer la producción.",
    icon: "🧴",
    unlockLevel: 1,
    isIllegal: false,
    productionChain: noChain,
  },

  madera: {
    id: "madera",
    name: "Madera y Derivados",
    category: ProductCategory.MateriasPrimas,
    basePrice: 55,
    minPrice: 25,
    maxPrice: 130,
    volatility: 0.20,
    demand: 0.75,
    supply: 0.70,
    productionCost: 28,
    esgScore: 0,
    exportValue: 1.0,
    tags: ["commodity", "construccion", "renovable"],
    description: "Madera certificada para construcción y fabricación de muebles. Con certificación forestal, el ESG mejora significativamente. Demanda estable ligada a la construcción.",
    icon: "🪵",
    unlockLevel: 1,
    isIllegal: false,
    productionChain: noChain,
  },

  textiles: {
    id: "textiles",
    name: "Materias Textiles",
    category: ProductCategory.MateriasPrimas,
    basePrice: 18,
    minPrice: 8,
    maxPrice: 50,
    volatility: 0.20,
    demand: 0.80,
    supply: 0.75,
    productionCost: 9,
    esgScore: -1,
    exportValue: 0.8,
    tags: ["commodity", "moda", "insumo"],
    description: "Telas, hilos y fibras para la industria textil y de confección. Insumo esencial para moda. El algodón orgánico premium mejora el ESG y permite cobrar más.",
    icon: "🧵",
    unlockLevel: 1,
    isIllegal: false,
    productionChain: noChain,
  },

  componentes: {
    id: "componentes",
    name: "Componentes Electrónicos",
    category: ProductCategory.MateriasPrimas,
    basePrice: 42,
    minPrice: 15,
    maxPrice: 120,
    volatility: 0.40,
    demand: 0.85,
    supply: 0.60,
    productionCost: 20,
    esgScore: -2,
    exportValue: 1.5,
    tags: ["tecnologia", "insumo", "supply_chain"],
    description: "Chips, circuitos y componentes electrónicos para manufactura tech. Crisis de semiconductores pueden disparar precios. Insumo crítico para múltiples industrias.",
    icon: "🔧",
    unlockLevel: 1,
    isIllegal: false,
    productionChain: noChain,
  },

  // ── MERCADO GRIS ────────────────────────────────────────────

  productos_falsificados: {
    id: "productos_falsificados",
    name: "Productos Falsificados",
    category: ProductCategory.MercadoGris,
    basePrice: 40,
    minPrice: 10,
    maxPrice: 200,
    volatility: 0.50,
    demand: 0.70,
    supply: 0.65,
    productionCost: 12,
    esgScore: -9,
    exportValue: 0.7,
    tags: ["ilegal", "riesgo", "grey_market", "moda"],
    description: "Imitaciones de marcas de lujo y productos falsificados. Márgenes altísimos con riesgo elevado: redadas, multas y hundimiento de reputación. Solo para los más arriesgados.",
    icon: "🎭",
    unlockLevel: 1,
    isIllegal: true,
    productionChain: makeChain(
      [{ productId: "textiles", quantity: 1 }],
      "productos_falsificados", 15, 1, "warehouse", WorkerSkill.Operations, 3
    ),
  },

  contrabando: {
    id: "contrabando",
    name: "Importación Ilegal",
    category: ProductCategory.MercadoGris,
    basePrice: 800,
    minPrice: 200,
    maxPrice: 5000,
    volatility: 0.70,
    demand: 0.65,
    supply: 0.40,
    productionCost: 300,
    esgScore: -10,
    exportValue: 0.5,
    tags: ["ilegal", "alto_riesgo", "grey_market"],
    description: "Mercancías importadas evadiendo aranceles y controles aduaneros. Beneficios rápidos y suculentos pero consecuencias devastadoras si las autoridades intervienen.",
    icon: "📦",
    unlockLevel: 1,
    isIllegal: true,
    productionChain: noChain,
  },

  hacking_servicios: {
    id: "hacking_servicios",
    name: "Servicios de Hacking",
    category: ProductCategory.MercadoGris,
    basePrice: 5000,
    minPrice: 1000,
    maxPrice: 50000,
    volatility: 0.80,
    demand: 0.40,
    supply: 0.20,
    productionCost: 1500,
    esgScore: -10,
    exportValue: 1.0,
    tags: ["ilegal", "digital", "alto_riesgo", "grey_market"],
    description: "Servicios de intrusión informática, robo de datos y espionaje corporativo. Solo los más conectados en el mercado gris tienen acceso. El riesgo de arresto es real y severo.",
    icon: "💀",
    unlockLevel: 1,
    isIllegal: true,
    productionChain: noChain,
  },
};

// ─── Helper Functions ─────────────────────────────────────────

export function getProductsByCategory(category: ProductCategory): Product[] {
  return Object.values(PRODUCTS).filter((p) => p.category === category);
}

export function getProductById(id: string): Product | undefined {
  return PRODUCTS[id];
}

export function getLegalProducts(): Product[] {
  return Object.values(PRODUCTS).filter((p) => !p.isIllegal);
}

export function getIllegalProducts(): Product[] {
  return Object.values(PRODUCTS).filter((p) => p.isIllegal);
}

export function getProductsByTag(tag: string): Product[] {
  return Object.values(PRODUCTS).filter((p) => p.tags.includes(tag));
}

export function getProductsByUnlockLevel(maxLevel: number): Product[] {
  return Object.values(PRODUCTS).filter((p) => p.unlockLevel <= maxLevel);
}

export function getHighVolatilityProducts(threshold = 0.5): Product[] {
  return Object.values(PRODUCTS).filter((p) => p.volatility >= threshold);
}

export function estimateProductionCost(productId: string, quantity: number): number {
  const product = PRODUCTS[productId];
  if (!product) return 0;

  let chainCost = 0;
  if (product.productionChain) {
    for (const input of product.productionChain.inputs) {
      const inputProduct = PRODUCTS[input.productId];
      if (inputProduct) {
        chainCost += inputProduct.basePrice * input.quantity * quantity;
      }
    }
    chainCost += product.productionChain.energyCost * quantity;
  }

  const baseCost = product.productionCost * quantity;
  return Math.max(baseCost, chainCost);
}

export function getProductionChain(productId: string): ProductionChain | undefined {
  return PRODUCTS[productId]?.productionChain;
}

export function getProfitMargin(productId: string): number {
  const p = PRODUCTS[productId];
  if (!p || p.productionCost === 0) return 0;
  return (p.basePrice - p.productionCost) / p.basePrice;
}

export function sortProductsByMargin(category?: ProductCategory): Product[] {
  const list = category ? getProductsByCategory(category) : Object.values(PRODUCTS);
  return list
    .filter((p) => !p.isIllegal)
    .sort((a, b) => getProfitMargin(b.id) - getProfitMargin(a.id));
}

export function getRelatedProducts(productId: string): Product[] {
  const product = PRODUCTS[productId];
  if (!product) return [];
  return Object.values(PRODUCTS).filter(
    (p) => p.id !== productId && p.category === product.category
  );
}

export function calculateMarketPrice(
  productId: string,
  demandShift = 0,
  supplyShift = 0,
  economyMultiplier = 1.0
): number {
  const p = PRODUCTS[productId];
  if (!p) return 0;

  const adjustedDemand = Math.min(1, Math.max(0, p.demand + demandShift));
  const adjustedSupply = Math.min(1, Math.max(0, p.supply + supplyShift));
  const supplyDemandRatio = adjustedDemand / Math.max(0.01, adjustedSupply);
  const rawPrice = p.basePrice * supplyDemandRatio * economyMultiplier;

  return Math.min(p.maxPrice, Math.max(p.minPrice, rawPrice));
}

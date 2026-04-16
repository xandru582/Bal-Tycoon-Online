// ============================================================
// NEXUS: Imperio del Mercado — Personal Life System v2
// ============================================================

export type AssetCategory = "realEstate" | "vehicle" | "luxury" | "art" | "experience";

export interface PersonalAsset {
  id: string;
  name: string;
  category: AssetCategory;
  description: string;
  cost: number;
  monthlyMaintenance: number;
  stressReliefPerTick: number;
  happinessBoost: number;
  icon: string;
  prestige: number;    // Social prestige points when owned
  unlockLevel?: number; // Min company level required
}

export type FamilyStatus = "single" | "dating" | "married" | "separated" | "divorced";

export interface ChildRecord {
  name: string;
  age: number;       // game years (1 year = 365 days)
  education: 'public' | 'private' | 'elite';
  monthlyCost: number;
  happinessBonus: number;
  dayBorn: number;
}

export interface Partner {
  name: string;
  personality: 'ambitious' | 'creative' | 'social' | 'homebody' | 'adventurous';
  satisfaction: number;  // 0–100 — drops if you neglect personal life
  monthlyExpenses: number;
  dayMet: number;
}

export interface SocialClub {
  id: string;
  name: string;
  description: string;
  icon: string;
  joinFee: number;
  monthlyFee: number;
  prestige: number;
  perks: string[];
  stressRelief: number;   // per month
  happinessBoost: number; // on join
  minPrestige: number;    // required to join
}

export interface LuxuryExperience {
  id: string;
  name: string;
  description: string;
  icon: string;
  cost: number;
  happinessBoost: number;
  stressRelief: number;
  prestige: number;
  cooldownDays: number;  // Days before you can do it again
}

export interface LifeEvent {
  day: number;
  icon: string;
  text: string;
  category: 'family' | 'asset' | 'club' | 'experience' | 'crisis';
}

export interface PersonalLifeState {
  cash: number;
  stress: number;
  happiness: number;
  prestige: number;
  assets: string[];
  socialClubs: string[];
  experienceCooldowns: Record<string, number>; // expId -> last day used
  family: {
    status: FamilyStatus;
    partner?: Partner;
    kids: ChildRecord[];
  };
  salary: number;
  lifeEvents: LifeEvent[];
}

// ─────────────────────────────────────────────────────────────
// SOCIAL CLUBS
// ─────────────────────────────────────────────────────────────
export const SOCIAL_CLUBS: SocialClub[] = [
  {
    id: 'sc_golf',
    name: 'Club de Golf Nueva Vista',
    description: 'El deporte de ejecutivos. Donde se cierran los tratos reales.',
    icon: '⛳',
    joinFee: 50000,
    monthlyFee: 5000,
    prestige: 20,
    perks: ['Descuento 10% contratos', 'Contactos ejecutivos', 'Acceso a torneos'],
    stressRelief: 5,
    happinessBoost: 10,
    minPrestige: 0,
  },
  {
    id: 'sc_yacht',
    name: 'Real Club Náutico Aetheria',
    description: 'La élite marítima de la ciudad. Regatas y cenas de gala.',
    icon: '⚓',
    joinFee: 200000,
    monthlyFee: 20000,
    prestige: 50,
    perks: ['Amarres privados', 'Red de inversores', 'Eventos VIP semanales'],
    stressRelief: 8,
    happinessBoost: 15,
    minPrestige: 30,
  },
  {
    id: 'sc_arts',
    name: 'Fundación Mecenas de las Artes',
    description: 'Patrocinadores de cultura. Abre puertas en medios y política.',
    icon: '🎭',
    joinFee: 100000,
    monthlyFee: 10000,
    prestige: 35,
    perks: ['Imagen corporativa +15%', 'Acceso a prensa favorable', 'Vernissages privados'],
    stressRelief: 4,
    happinessBoost: 12,
    minPrestige: 20,
  },
  {
    id: 'sc_tech',
    name: 'Nexus Founders Circle',
    description: 'La fraternidad de los magnates tecnológicos. Sinergias e inversiones.',
    icon: '💡',
    joinFee: 500000,
    monthlyFee: 50000,
    prestige: 80,
    perks: ['Intel de mercado exclusiva', 'Co-inversiones', 'Acceso a startups tier-1'],
    stressRelief: 3,
    happinessBoost: 8,
    minPrestige: 60,
  },
  {
    id: 'sc_hunt',
    name: 'Orden de la Caza Primordial',
    description: 'Sociedad secreta de ultra-ricos. Nadie habla de lo que pasa aquí.',
    icon: '🦁',
    joinFee: 2000000,
    monthlyFee: 200000,
    prestige: 150,
    perks: ['Contratos exclusivos tier-S', 'Inmunidad reputacional', 'Red de influencia global'],
    stressRelief: 10,
    happinessBoost: 20,
    minPrestige: 120,
  },
  {
    id: 'sc_space',
    name: 'Consorcio Orbital Privado',
    description: 'Solo los más ricos del mundo pueden aspirar a la membresía.',
    icon: '🚀',
    joinFee: 50000000,
    monthlyFee: 5000000,
    prestige: 500,
    perks: ['Lanzamientos privados', 'Acceso a estación orbital', 'Estatus de leyenda mundial'],
    stressRelief: 20,
    happinessBoost: 50,
    minPrestige: 400,
  },
];

// ─────────────────────────────────────────────────────────────
// LUXURY EXPERIENCES (one-shot with cooldown)
// ─────────────────────────────────────────────────────────────
export const LUXURY_EXPERIENCES: LuxuryExperience[] = [
  {
    id: 'exp_spa',
    name: 'Spa Termal Exclusivo',
    description: 'Un día entero en el spa más caro de Aetheria. Masajes, baños termales y silencio.',
    icon: '🧖',
    cost: 5000,
    happinessBoost: 8,
    stressRelief: 15,
    prestige: 2,
    cooldownDays: 7,
  },
  {
    id: 'exp_vacation',
    name: 'Vacaciones VIP Internacionales',
    description: 'Primera clase, hotel 7 estrellas y mayordomo personal. El antídoto al burnout.',
    icon: '🏝️',
    cost: 25000,
    happinessBoost: 20,
    stressRelief: 35,
    prestige: 5,
    cooldownDays: 30,
  },
  {
    id: 'exp_chef',
    name: 'Cena con Chef Michelin',
    description: 'Una experiencia gastronómica de 12 platos que cuesta más que un coche.',
    icon: '🍽️',
    cost: 8000,
    happinessBoost: 12,
    stressRelief: 5,
    prestige: 8,
    cooldownDays: 14,
  },
  {
    id: 'exp_concert',
    name: 'Concierto Privado en Casa',
    description: 'Contrata a una banda mundialmente famosa para una noche solo para ti.',
    icon: '🎵',
    cost: 150000,
    happinessBoost: 25,
    stressRelief: 10,
    prestige: 15,
    cooldownDays: 60,
  },
  {
    id: 'exp_safari',
    name: 'Safari Africano Privado',
    description: 'Avión privado, lodge exclusivo y guías personales en reservas privadas.',
    icon: '🦁',
    cost: 500000,
    happinessBoost: 30,
    stressRelief: 20,
    prestige: 25,
    cooldownDays: 90,
  },
  {
    id: 'exp_space',
    name: 'Vuelo Suborbital Privado',
    description: '3 minutos de ingravidez absoluta. La experiencia más cara del planeta.',
    icon: '🌍',
    cost: 10000000,
    happinessBoost: 60,
    stressRelief: 40,
    prestige: 100,
    cooldownDays: 365,
  },
  {
    id: 'exp_art',
    name: 'Subasta Sotheby\'s Privada',
    description: 'Acceso VIP a subastas de arte con piezas únicas. El lujo de la cultura.',
    icon: '🖼️',
    cost: 1000000,
    happinessBoost: 15,
    stressRelief: 5,
    prestige: 50,
    cooldownDays: 120,
  },
  {
    id: 'exp_island',
    name: 'Alquiler de Isla Privada',
    description: 'Una semana completa en una isla privada del Pacífico. Solo tú y el océano.',
    icon: '🌺',
    cost: 2000000,
    happinessBoost: 40,
    stressRelief: 50,
    prestige: 60,
    cooldownDays: 180,
  },
];

// ─────────────────────────────────────────────────────────────
// PERSONAL ASSETS REGISTRY (30 items)
// ─────────────────────────────────────────────────────────────
export const PERSONAL_ASSETS: PersonalAsset[] = [
  // ── Real Estate (8 items) ───────────────────────────────────
  {
    id: 're_01', name: 'Piso en Centro Ciudad', category: 'realEstate',
    description: 'Un piso céntrico moderno. El primer paso del lujo.', icon: '🏙️',
    cost: 300000, monthlyMaintenance: 800, stressReliefPerTick: 0.05, happinessBoost: 3, prestige: 5,
  },
  {
    id: 're_02', name: 'Ático de Lujo', category: 'realEstate',
    description: 'Ático en el distrito financiero con vistas panorámicas.', icon: '🏢',
    cost: 800000, monthlyMaintenance: 2000, stressReliefPerTick: 0.1, happinessBoost: 6, prestige: 15,
  },
  {
    id: 're_03', name: 'Chalet en las Afueras', category: 'realEstate',
    description: 'Espacio, jardín y piscina. Para desconectar de la ciudad.', icon: '🏡',
    cost: 1500000, monthlyMaintenance: 5000, stressReliefPerTick: 0.25, happinessBoost: 8, prestige: 20,
  },
  {
    id: 're_04', name: 'Mansión en la Costa', category: 'realEstate',
    description: 'Refugio privado con seguridad 24h y piscina olímpica.', icon: '🏰',
    cost: 5000000, monthlyMaintenance: 15000, stressReliefPerTick: 0.5, happinessBoost: 12, prestige: 40,
  },
  {
    id: 're_05', name: 'Villa en el Mediterráneo', category: 'realEstate',
    description: 'Segunda residencia en las Baleares. El sueño europeo.', icon: '🌅',
    cost: 15000000, monthlyMaintenance: 50000, stressReliefPerTick: 1.0, happinessBoost: 18, prestige: 70,
    unlockLevel: 5,
  },
  {
    id: 're_06', name: 'Rascacielos Privado', category: 'realEstate',
    description: 'Un piso entero en la torre más alta de Aetheria.', icon: '🗼',
    cost: 45000000, monthlyMaintenance: 100000, stressReliefPerTick: 2.0, happinessBoost: 25, prestige: 100,
    unlockLevel: 8,
  },
  {
    id: 're_07', name: 'Isla Privada', category: 'realEstate',
    description: 'Tu propio paraíso fiscal con pista de aterrizaje.', icon: '🏝️',
    cost: 150000000, monthlyMaintenance: 400000, stressReliefPerTick: 4.0, happinessBoost: 35, prestige: 200,
    unlockLevel: 12,
  },
  {
    id: 're_08', name: 'Estación Orbital Privada', category: 'realEstate',
    description: 'Propiedad en la exosfera terrestre. Literalmente el pináculo.', icon: '🛰️',
    cost: 5000000000, monthlyMaintenance: 15000000, stressReliefPerTick: 10.0, happinessBoost: 50, prestige: 500,
    unlockLevel: 18,
  },

  // ── Vehicles (7 items) ──────────────────────────────────────
  {
    id: 've_01', name: 'Deportivo GT', category: 'vehicle',
    description: 'Para los domingos. Potencia y estilo sin ostentación.', icon: '🏎️',
    cost: 150000, monthlyMaintenance: 1000, stressReliefPerTick: 0.05, happinessBoost: 4, prestige: 10,
  },
  {
    id: 've_02', name: 'Limousine Ejecutiva', category: 'vehicle',
    description: 'Chófer privado y cabina con bar. Impresiona a los clientes.', icon: '🚗',
    cost: 500000, monthlyMaintenance: 3000, stressReliefPerTick: 0.1, happinessBoost: 5, prestige: 20,
  },
  {
    id: 've_03', name: 'Hiperdeportivo Bólido', category: 'vehicle',
    description: '400 km/h. El mejor antidepresivo que el dinero puede comprar.', icon: '⚡',
    cost: 2500000, monthlyMaintenance: 5000, stressReliefPerTick: 0.2, happinessBoost: 8, prestige: 35,
  },
  {
    id: 've_04', name: 'Helicóptero Privado', category: 'vehicle',
    description: 'Olvida el tráfico. Aterriza en la azotea de tu oficina.', icon: '🚁',
    cost: 8000000, monthlyMaintenance: 30000, stressReliefPerTick: 0.6, happinessBoost: 12, prestige: 60,
    unlockLevel: 6,
  },
  {
    id: 've_05', name: 'Yate de Recreo 40m', category: 'vehicle',
    description: 'Fiestas corporativas flotantes. Un hotel en el mar.', icon: '🛥️',
    cost: 12000000, monthlyMaintenance: 50000, stressReliefPerTick: 0.8, happinessBoost: 15, prestige: 80,
    unlockLevel: 8,
  },
  {
    id: 've_06', name: 'Jet Privado G650', category: 'vehicle',
    description: 'Reuniones globales sin escalas. El tiempo es dinero.', icon: '🛩️',
    cost: 65000000, monthlyMaintenance: 200000, stressReliefPerTick: 1.5, happinessBoost: 22, prestige: 150,
    unlockLevel: 12,
  },
  {
    id: 've_07', name: 'Megayate Vanguardia 120m', category: 'vehicle',
    description: 'Una ciudad marítima completa. Submarino incluido.', icon: '🛳️',
    cost: 500000000, monthlyMaintenance: 1500000, stressReliefPerTick: 5.0, happinessBoost: 35, prestige: 300,
    unlockLevel: 16,
  },

  // ── Luxury & Collectibles (8 items) ────────────────────────
  {
    id: 'lux_01', name: 'Reloj Tourbillon Único', category: 'luxury',
    description: 'Una joya mecánica hiperprecisa. Solo 5 en el mundo.', icon: '⌚',
    cost: 250000, monthlyMaintenance: 500, stressReliefPerTick: 0.02, happinessBoost: 3, prestige: 15,
  },
  {
    id: 'lux_02', name: 'Colección de Vinos Premium', category: 'luxury',
    description: 'Bodegas privadas con etiquetas del siglo XX. Inversión líquida.', icon: '🍷',
    cost: 500000, monthlyMaintenance: 2000, stressReliefPerTick: 0.05, happinessBoost: 5, prestige: 20,
  },
  {
    id: 'lux_03', name: 'Colección de Arte Moderno', category: 'luxury',
    description: 'Warhols, Banskys y exclusivos. Arte que aumenta de valor.', icon: '🖼️',
    cost: 5000000, monthlyMaintenance: 10000, stressReliefPerTick: 0.3, happinessBoost: 10, prestige: 50,
    unlockLevel: 5,
  },
  {
    id: 'lux_04', name: 'Joyería Alta Costura', category: 'luxury',
    description: 'Diamantes rosas de Argyle y zafiros de Cachemira.', icon: '💎',
    cost: 2000000, monthlyMaintenance: 5000, stressReliefPerTick: 0.1, happinessBoost: 8, prestige: 35,
  },
  {
    id: 'lux_05', name: 'Caballos de Pura Sangre', category: 'luxury',
    description: 'Un establo de campeones mundiales de hipismo.', icon: '🐎',
    cost: 35000000, monthlyMaintenance: 80000, stressReliefPerTick: 1.2, happinessBoost: 18, prestige: 90,
    unlockLevel: 10,
  },
  {
    id: 'lux_06', name: 'Escudería de Fórmula 1', category: 'luxury',
    description: 'Tu propia escudería en la máxima categoría del motor.', icon: '🏁',
    cost: 300000000, monthlyMaintenance: 12000000, stressReliefPerTick: 3.0, happinessBoost: 30, prestige: 250,
    unlockLevel: 14,
  },
  {
    id: 'lux_07', name: 'Bunker de Lujo Apocalíptico', category: 'luxury',
    description: 'Para cuando el mundo se acabe. Solo los mejores materiales.', icon: '🛡️',
    cost: 800000000, monthlyMaintenance: 3000000, stressReliefPerTick: 0.5, happinessBoost: 5, prestige: 150,
    unlockLevel: 15,
  },
  {
    id: 'lux_08', name: 'Cámara de Criogenia Médica', category: 'luxury',
    description: 'Para cuando quieras vivir mil años. Tecnología de vanguardia.',icon: '🧊',
    cost: 2000000000, monthlyMaintenance: 5000000, stressReliefPerTick: 8.0, happinessBoost: 40, prestige: 400,
    unlockLevel: 18,
  },

  // ── Art & Collections (4 items) ─────────────────────────────
  {
    id: 'art_01', name: 'Manuscritos Históricos', category: 'art',
    description: 'Textos originales del Renacimiento. Historia en tus manos.', icon: '📜',
    cost: 800000, monthlyMaintenance: 1000, stressReliefPerTick: 0.1, happinessBoost: 6, prestige: 30,
  },
  {
    id: 'art_02', name: 'Galería de Arte Privada', category: 'art',
    description: 'Un espacio dedicado a piezas únicas que aprecian en valor.', icon: '🎨',
    cost: 3000000, monthlyMaintenance: 8000, stressReliefPerTick: 0.4, happinessBoost: 10, prestige: 45,
  },
  {
    id: 'art_03', name: 'Escultura de Autor Mundialmente Conocido', category: 'art',
    description: 'Una pieza única que redefine el concepto de lujo artístico.', icon: '🗿',
    cost: 20000000, monthlyMaintenance: 20000, stressReliefPerTick: 0.8, happinessBoost: 15, prestige: 80,
    unlockLevel: 8,
  },
  {
    id: 'art_04', name: 'Colección de NFTs de Arte Generativo', category: 'art',
    description: 'El arte del futuro. Criticado por los puristas, adorado por los ricos.',icon: '🔮',
    cost: 50000000, monthlyMaintenance: 100000, stressReliefPerTick: 0.5, happinessBoost: 12, prestige: 100,
    unlockLevel: 10,
  },
];

// ─────────────────────────────────────────────────────────────
// PARTNER NAMES (Spanish)
// ─────────────────────────────────────────────────────────────
const PARTNER_NAMES = [
  'Valentina Ramos', 'Carlos Vega', 'Isabella Moreno', 'Alejandro Torres',
  'Natalia Reyes', 'Diego Castillo', 'Camila Herrera', 'Andrés Jiménez',
  'Sofía Mendoza', 'Julián Ortega', 'Valeria Cruz', 'Sebastián Núñez',
  'Mariana Delgado', 'Rafael Gutiérrez', 'Daniela Flores', 'Emilio Vargas',
];

const PARTNER_PERSONALITIES: Partner['personality'][] = [
  'ambitious', 'creative', 'social', 'homebody', 'adventurous'
];

const PERSONALITY_LABELS: Record<Partner['personality'], string> = {
  ambitious: 'Ambiciosa/o — Te impulsa pero exige lo mismo de ti',
  creative: 'Creativa/o — Trae equilibrio artístico a tu vida',
  social: 'Social — Amplía tu red de contactos naturalmente',
  homebody: 'Hogareña/o — Prefiere la tranquilidad del hogar',
  adventurous: 'Aventurera/o — Siempre lista para la próxima experiencia',
};

const CHILD_NAMES = [
  'Lucas', 'Mateo', 'Santiago', 'Sebastián', 'Nicolás',
  'Valentina', 'Sofía', 'Isabella', 'Camila', 'Valeria',
  'Emilio', 'Daniel', 'Alejandro', 'Gabriel', 'Adriana',
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─────────────────────────────────────────────────────────────
// PERSONAL LIFE MANAGER
// ─────────────────────────────────────────────────────────────
export class PersonalLifeManager {
  state: PersonalLifeState;

  constructor() {
    this.state = {
      cash: 0,
      stress: 0,
      happiness: 50,
      prestige: 0,
      assets: [],
      socialClubs: [],
      experienceCooldowns: {},
      family: {
        status: 'single',
        partner: undefined,
        kids: [],
      },
      salary: 5000,
      lifeEvents: [],
    };
  }

  // ── Derived getters ────────────────────────────────────────

  get ownedAssets(): PersonalAsset[] {
    return this.state.assets
      .map(id => PERSONAL_ASSETS.find(a => a.id === id)!)
      .filter(Boolean);
  }

  get joinedClubs(): SocialClub[] {
    return this.state.socialClubs
      .map(id => SOCIAL_CLUBS.find(c => c.id === id)!)
      .filter(Boolean);
  }

  get totalMaintenance(): number {
    return this.ownedAssets.reduce((sum, a) => sum + a.monthlyMaintenance, 0);
  }

  get totalClubFees(): number {
    return this.joinedClubs.reduce((sum, c) => sum + c.monthlyFee, 0);
  }

  get familyMonthlyCost(): number {
    let cost = 0;
    const status = this.state.family.status;
    if (status === 'dating') cost += 2000;
    if (status === 'married') cost += this.state.family.partner?.monthlyExpenses ?? 10000;
    if (status === 'separated') cost += 5000; // legal fees
    cost += this.state.family.kids.reduce((s, k) => s + k.monthlyCost, 0);
    return cost;
  }

  get totalMonthlyExpenses(): number {
    return this.totalMaintenance + this.totalClubFees + this.familyMonthlyCost;
  }

  // ── Life Events Log ───────────────────────────────────────

  private addEvent(icon: string, text: string, category: LifeEvent['category']) {
    const event: LifeEvent = {
      day: 0, // will be set by processMonth/tick
      icon,
      text,
      category,
    };
    this.state.lifeEvents = [event, ...this.state.lifeEvents.slice(0, 29)];
  }

  // ── Asset Management ──────────────────────────────────────

  buyAsset(assetId: string, companyLevel: number = 1): { success: boolean; message: string } {
    const asset = PERSONAL_ASSETS.find(a => a.id === assetId);
    if (!asset) return { success: false, message: 'Activo no encontrado.' };
    if (this.state.assets.includes(assetId)) return { success: false, message: 'Ya posees este activo.' };
    if (asset.unlockLevel && companyLevel < asset.unlockLevel)
      return { success: false, message: `Requiere nivel ${asset.unlockLevel} de empresa.` };
    if (this.state.cash < asset.cost)
      return { success: false, message: `Fondos personales insuficientes. Necesitas Đ${asset.cost.toLocaleString()}.` };

    this.state.cash -= asset.cost;
    this.state.assets.push(assetId);
    this.state.happiness = Math.min(100, this.state.happiness + asset.happinessBoost);
    this.state.prestige += asset.prestige;
    this.addEvent(asset.icon, `Adquirido: ${asset.name}`, 'asset');

    return { success: true, message: `Has comprado: ${asset.name}` };
  }

  // ── Social Clubs ──────────────────────────────────────────

  joinClub(clubId: string): { success: boolean; message: string } {
    const club = SOCIAL_CLUBS.find(c => c.id === clubId);
    if (!club) return { success: false, message: 'Club no encontrado.' };
    if (this.state.socialClubs.includes(clubId)) return { success: false, message: 'Ya eres miembro.' };
    if (this.state.prestige < club.minPrestige)
      return { success: false, message: `Requieres ${club.minPrestige} de prestigio (tienes ${Math.floor(this.state.prestige)}).` };
    if (this.state.cash < club.joinFee)
      return { success: false, message: `Cuota de ingreso insuficiente. Necesitas Đ${club.joinFee.toLocaleString()}.` };

    this.state.cash -= club.joinFee;
    this.state.socialClubs.push(clubId);
    this.state.happiness = Math.min(100, this.state.happiness + club.happinessBoost);
    this.state.prestige += club.prestige;
    this.addEvent(club.icon, `Ingresado en: ${club.name}`, 'club');

    return { success: true, message: `¡Bienvenido a ${club.name}!` };
  }

  quitClub(clubId: string): { success: boolean; message: string } {
    const idx = this.state.socialClubs.indexOf(clubId);
    if (idx === -1) return { success: false, message: 'No eres miembro.' };
    const club = SOCIAL_CLUBS.find(c => c.id === clubId)!;
    this.state.socialClubs.splice(idx, 1);
    this.state.prestige = Math.max(0, this.state.prestige - club.prestige * 0.5);
    this.addEvent(club.icon, `Abandonado: ${club.name}`, 'club');
    return { success: true, message: `Has dejado ${club.name}.` };
  }

  // ── Luxury Experiences ─────────────────────────────────────

  buyExperience(expId: string, currentDay: number): { success: boolean; message: string } {
    const exp = LUXURY_EXPERIENCES.find(e => e.id === expId);
    if (!exp) return { success: false, message: 'Experiencia no encontrada.' };

    const lastUsed = this.state.experienceCooldowns[expId] ?? 0;
    const daysLeft = exp.cooldownDays - (currentDay - lastUsed);
    if (daysLeft > 0)
      return { success: false, message: `Disponible en ${Math.ceil(daysLeft)} días.` };
    if (this.state.cash < exp.cost)
      return { success: false, message: `Fondos insuficientes. Necesitas Đ${exp.cost.toLocaleString()}.` };

    this.state.cash -= exp.cost;
    this.state.happiness = Math.min(100, this.state.happiness + exp.happinessBoost);
    this.state.stress = Math.max(0, this.state.stress - exp.stressRelief);
    this.state.prestige += exp.prestige;
    this.state.experienceCooldowns[expId] = currentDay;
    this.addEvent(exp.icon, exp.name, 'experience');

    return { success: true, message: `Experiencia disfrutada: ${exp.name}` };
  }

  // ── Family Management ─────────────────────────────────────

  setSalary(newSalary: number) {
    this.state.salary = Math.max(0, newSalary);
  }

  proposePartner(): { success: boolean; message: string } {
    if (this.state.family.status !== 'single' && this.state.family.status !== 'divorced')
      return { success: false, message: 'Ya estás en una relación.' };
    if (this.state.cash < 50000)
      return { success: false, message: 'Necesitas Đ50,000 para citas de lujo.' };

    this.state.cash -= 50000;
    this.state.family.status = 'dating';
    const personality = randomFrom(PARTNER_PERSONALITIES);
    this.state.family.partner = {
      name: randomFrom(PARTNER_NAMES),
      personality,
      satisfaction: 70,
      monthlyExpenses: personality === 'social' ? 15000 : personality === 'ambitious' ? 20000 : personality === 'adventurous' ? 18000 : 10000,
      dayMet: 0,
    };
    this.state.happiness = Math.min(100, this.state.happiness + 15);
    this.addEvent('💌', `Nueva relación con ${this.state.family.partner.name}`, 'family');

    return { success: true, message: `¡Estás saliendo con ${this.state.family.partner.name}!` };
  }

  marry(): { success: boolean; message: string } {
    if (this.state.family.status !== 'dating')
      return { success: false, message: 'Primero necesitas salir con alguien.' };
    if (this.state.cash < 200000)
      return { success: false, message: 'La boda de tus sueños cuesta Đ200,000.' };

    this.state.cash -= 200000;
    this.state.family.status = 'married';
    this.state.happiness = Math.min(100, this.state.happiness + 20);
    this.state.prestige += 10;
    const partnerName = this.state.family.partner?.name ?? 'tu pareja';
    this.addEvent('💍', `¡Boda con ${partnerName}!`, 'family');

    return { success: true, message: `¡Felicidades! Te has casado con ${partnerName}.` };
  }

  divorce(): { success: boolean; message: string } {
    if (this.state.family.status !== 'married' && this.state.family.status !== 'dating')
      return { success: false, message: 'No hay relación que terminar.' };

    const divorceCost = this.state.family.status === 'married'
      ? Math.min(this.state.cash * 0.3, 500000)
      : 0;

    this.state.cash = Math.max(0, this.state.cash - divorceCost);
    const oldStatus = this.state.family.status;
    this.state.family.status = oldStatus === 'married' ? 'divorced' : 'single';
    this.state.happiness = Math.max(0, this.state.happiness - 20);
    this.state.stress = Math.min(100, this.state.stress + 15);
    this.state.prestige = Math.max(0, this.state.prestige - 5);
    const partnerName = this.state.family.partner?.name ?? 'tu pareja';
    this.state.family.partner = undefined;
    this.addEvent('💔', `Separación de ${partnerName}`, 'family');

    return { success: true, message: `Separación tramitada. Coste legal: Đ${divorceCost.toLocaleString()}` };
  }

  haveChild(): { success: boolean; message: string } {
    if (this.state.family.status !== 'married')
      return { success: false, message: 'Primero debes casarte.' };
    if (this.state.cash < 100000)
      return { success: false, message: 'Necesitas Đ100,000 para gastos médicos y cunas de diseño.' };
    if (this.state.family.kids.length >= 5)
      return { success: false, message: 'Ya tienes 5 hijos. El techo del hogar tiene límite.' };

    this.state.cash -= 100000;
    const name = randomFrom(CHILD_NAMES);
    const child: ChildRecord = {
      name,
      age: 0,
      education: 'public',
      monthlyCost: 5000,
      happinessBonus: 5,
      dayBorn: 0,
    };
    this.state.family.kids.push(child);
    this.state.happiness = Math.min(100, this.state.happiness + 10);
    this.state.stress = Math.min(100, this.state.stress + 10);
    this.addEvent('👶', `Nació ${name}`, 'family');

    return { success: true, message: `¡Bienvenido al mundo, ${name}! Tienes ${this.state.family.kids.length} hijo/s.` };
  }

  upgradeChildEducation(childIndex: number): { success: boolean; message: string } {
    const child = this.state.family.kids[childIndex];
    if (!child) return { success: false, message: 'Hijo no encontrado.' };

    const costs: Record<string, { next: ChildRecord['education']; cost: number; monthly: number }> = {
      public: { next: 'private', cost: 20000, monthly: 15000 },
      private: { next: 'elite', cost: 100000, monthly: 50000 },
    };
    const upgrade = costs[child.education];
    if (!upgrade) return { success: false, message: `${child.name} ya tiene la mejor educación.` };
    if (this.state.cash < upgrade.cost) return { success: false, message: `Necesitas Đ${upgrade.cost.toLocaleString()}.` };

    this.state.cash -= upgrade.cost;
    child.education = upgrade.next;
    child.monthlyCost = upgrade.monthly;
    child.happinessBonus = upgrade.next === 'elite' ? 15 : 10;
    this.addEvent('🎓', `${child.name}: educación mejorada a ${upgrade.next}`, 'family');

    return { success: true, message: `${child.name} ahora estudia en colegio ${upgrade.next}.` };
  }

  // ── Legacy ─────────────────────────────────────────────────
  takeVacation(): { success: boolean; message: string } {
    return this.buyExperience('exp_vacation', 0);
  }

  // ── Tick (called every frame) ─────────────────────────────

  tick(companyRevenue: number, companySize: number, delta: number, currentDay: number) {
    // Stress gain from company operations
    const baseStressGain = (companySize * 0.05 + Math.log10(Math.max(1, companyRevenue)) * 0.2) * delta;

    // Stress relief from assets
    const assetRelief = this.ownedAssets.reduce((s, a) => s + a.stressReliefPerTick, 0) * delta;

    // Club monthly stress relief (spread over days)
    const clubRelief = this.joinedClubs.reduce((s, c) => s + c.stressRelief / 30, 0) * delta;

    // Family relief/stress
    const status = this.state.family.status;
    const familyRelief = (status === 'dating' ? 0.5 : status === 'married' ? 1.5 : status === 'divorced' ? -0.3 : 0) * delta;

    // Kids add stress but also happiness
    const kidStress = this.state.family.kids.length * 0.2 * delta;
    const kidHappiness = this.state.family.kids.reduce((s, k) => s + k.happinessBonus / 30, 0) * delta;

    this.state.stress = Math.max(0, Math.min(100,
      this.state.stress + baseStressGain - assetRelief - clubRelief - familyRelief + kidStress
    ));

    // Happiness decay towards 50
    if (this.state.happiness > 50) {
      this.state.happiness = Math.max(50, this.state.happiness - 0.3 * delta);
    } else if (this.state.happiness < 50) {
      this.state.happiness = Math.min(50, this.state.happiness + 0.3 * delta);
    }
    this.state.happiness = Math.min(100, this.state.happiness + kidHappiness);

    // Partner satisfaction decay
    if (this.state.family.partner) {
      const neglect = this.state.stress > 70 ? 0.3 : this.state.stress > 50 ? 0.1 : 0;
      this.state.family.partner.satisfaction = Math.max(0, Math.min(100,
        this.state.family.partner.satisfaction - neglect * delta
      ));
    }

    // Age children (1 game day = 1 day, 365 days = 1 year)
    for (const kid of this.state.family.kids) {
      kid.age = Math.floor((currentDay - kid.dayBorn) / 365);
    }
  }

  // ── Monthly Processing ─────────────────────────────────────

  processMonth(companyCash: number, currentDay: number): { netSalary: number; maintenance: number; success: boolean } {
    const requestedSalary = this.state.salary;
    const actualSalary = Math.min(requestedSalary, companyCash);
    this.state.cash += actualSalary;

    const totalExpenses = this.totalMonthlyExpenses;

    if (this.state.cash >= totalExpenses) {
      this.state.cash -= totalExpenses;

      // Club monthly happiness
      for (const club of this.joinedClubs) {
        this.state.stress = Math.max(0, this.state.stress - club.stressRelief);
      }
    } else {
      // Default — can't pay lifestyle
      this.state.cash = 0;
      this.state.stress = Math.min(100, this.state.stress + 30);
      this.state.happiness = Math.max(0, this.state.happiness - 20);
      this.addEvent('🚨', 'No has podido pagar el mantenimiento de tu estilo de vida', 'crisis');
    }

    // Partner dissatisfaction event
    if (this.state.family.partner && this.state.family.partner.satisfaction < 20) {
      this.state.family.partner.satisfaction = 25;
      this.state.stress = Math.min(100, this.state.stress + 10);
      this.addEvent('💔', `${this.state.family.partner.name} está muy insatisfecha/o contigo`, 'family');
    }

    return { netSalary: actualSalary, maintenance: totalExpenses, success: this.state.cash >= 0 };
  }

  // ── Serialization ─────────────────────────────────────────

  getPrestigeTitle(): string {
    const p = this.state.prestige;
    if (p >= 500) return 'Magnate Legendario';
    if (p >= 250) return 'Tycoon Global';
    if (p >= 150) return 'Empresario de Élite';
    if (p >= 80) return 'Alto Ejecutivo';
    if (p >= 40) return 'Director Respetado';
    if (p >= 20) return 'Gerente Próspero';
    if (p >= 5) return 'Emprendedor';
    return 'CEO Emergente';
  }

  getPersonalityLabel(personality: Partner['personality']): string {
    return PERSONALITY_LABELS[personality] ?? personality;
  }
}

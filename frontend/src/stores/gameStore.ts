import { create } from 'zustand';
import { EconomyEngine } from '../core/economy/EconomyEngine';
import { Company } from '../core/economy/Company';
import { StockMarket } from '../core/economy/Stocks';
import { ContractManager } from '../core/economy/Contracts';
import { RivalManager } from '../core/economy/Rivals';
import { PersonalLifeManager } from '../core/economy/PersonalLife';
import { GameEventsManager, GameEvent } from '../core/economy/GameEvents';
import { ProductCategory } from '../types';
import api from '../lib/api';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UPGRADE TIERS (Cookie-Clicker style exponential curve)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface SyndicateUpgrade {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  cost: number;
  cpsEach: number;
  purchased: number;
  icon: string;
  tier: number;
}

// Balance v2: early game más fluido, multiplicador 1.15× en lugar de 1.18×
const UPGRADES: SyndicateUpgrade[] = [
  { id:'u01', name:'Script Kiddie',      description:'Bot básico que escanea puertos abiertos.',         baseCost:15,          cost:15,          cpsEach:0.2,      purchased:0, icon:'🖱️', tier:0 },
  { id:'u02', name:'Nodo de Minería',    description:'Minero de datos pasivo en la darknet.',            baseCost:100,         cost:100,         cpsEach:1.2,      purchased:0, icon:'⛏️', tier:0 },
  { id:'u03', name:'Proxy Farm',         description:'Red de proxies para multiplicar extracción.',      baseCost:1100,        cost:1100,        cpsEach:9,        purchased:0, icon:'🌐', tier:1 },
  { id:'u04', name:'Granja Cuántica',    description:'Computación cuántica para descifrar datos.',       baseCost:12000,       cost:12000,       cpsEach:50,       purchased:0, icon:'💠', tier:1 },
  { id:'u05', name:'Cluster Neural',     description:'Red neuronal que aprende patrones de mercado.',    baseCost:130000,      cost:130000,      cpsEach:280,      purchased:0, icon:'🧠', tier:2 },
  { id:'u06', name:'Satélite Espía',     description:'Acceso orbital a comunicaciones corporativas.',    baseCost:1400000,     cost:1400000,     cpsEach:1500,     purchased:0, icon:'🛰️', tier:2 },
  { id:'u07', name:'Agente de Campo',    description:'Operativos encubiertos infiltrados en rivales.',   baseCost:20000000,    cost:20000000,    cpsEach:7800,     purchased:0, icon:'🕵️', tier:3 },
  { id:'u08', name:'Centro de Mando',    description:'Control centralizado de todas las operaciones.',   baseCost:330000000,   cost:330000000,   cpsEach:44000,    purchased:0, icon:'🏛️', tier:3 },
  { id:'u09', name:'Cable Submarino',    description:'Interceptas todo el ancho de banda transoceánico.',baseCost:5100000000,  cost:5100000000,  cpsEach:260000,   purchased:0, icon:'🌊', tier:4 },
  { id:'u10', name:'IA Omnisciente',     description:'Superinteligencia artificial autónoma.',           baseCost:75000000000, cost:75000000000, cpsEach:1600000,  purchased:0, icon:'🤖', tier:4 },
  { id:'u11', name:'Esfera de Dyson',    description:'Estrellas enteras puramente para minar cripto.',   baseCost:1000000000000, cost:1000000000000, cpsEach:10000000, purchased:0, icon:'☀️', tier:5 },
  { id:'u12', name:'Motor de Materia',   description:'Convierte materia inerte en oro virtual.',         baseCost:14000000000000, cost:14000000000000, cpsEach:65000000, purchased:0, icon:'⚛️', tier:5 },
  { id:'u13', name:'Computadora Galáctica', description:'Toda la Vía Láctea es un procesador.',          baseCost:170000000000000, cost:170000000000000, cpsEach:430000000, purchased:0, icon:'🌌', tier:6 },
  { id:'u14', name:'Manipulador Temporal',  description:'Invierte en el pasado con rendimientos futuros.', baseCost:2100000000000000, cost:2100000000000000, cpsEach:2900000000, purchased:0, icon:'⏳', tier:6 },
  { id:'u15', name:'Mente Colmena',      description:'Cada intelecto del planeta conectado a tu red.',   baseCost:2.6e16, cost:2.6e16, cpsEach:21000000000, purchased:0, icon:'🐝', tier:7 },
  { id:'u16', name:'Agujero Negro',      description:'Extrae energía infinita comprimiendo tiempo/espacio.', baseCost:3.1e17, cost:3.1e17, cpsEach:150000000000, purchased:0, icon:'🕳️', tier:7 },
  { id:'u17', name:'Multiverso',         description:'Por qué tener un mercado cuando puedes tener infinitos.', baseCost:7e18, cost:7e18, cpsEach:1100000000000, purchased:0, icon:'🔮', tier:8 },
  { id:'u18', name:'Simulación Madre',   description:'Tú eres el que ejecuta la simulación.',            baseCost:1.2e20, cost:1.2e20, cpsEach:8500000000000, purchased:0, icon:'💻', tier:8 },
  { id:'u19', name:'El Vacío',           description:'No queda nada, solo números ascendiendo.',         baseCost:2.5e21, cost:2.5e21, cpsEach:64000000000000, purchased:0, icon:'🌌', tier:9 },
  { id:'u20', name:'Singularidad',       description:'Has trascendido. Todo es tuyo.',                   baseCost:5e22, cost:5e22, cpsEach:500000000000000, purchased:0, icon:'✨', tier:9 },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ACHIEVEMENTS (40 achievements)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'click' | 'income' | 'wealth' | 'production' | 'corporate' | 'market' | 'social' | 'time' | 'secret';
  reward: number;
  unlocked: boolean;
  unlockedAt?: number;
}

const ACHIEVEMENTS: Achievement[] = [
  // Clicking (5)
  { id:'a01', title:'Primer Hack',         description:'Ejecuta tu primer hack manual.',               icon:'🖱️', category:'click',      reward:50,           unlocked:false },
  { id:'a02', title:'Hacker Novato',        description:'100 hacks manuales.',                          icon:'⚡', category:'click',      reward:500,          unlocked:false },
  { id:'a03', title:'Hacker Veterano',      description:'1.000 hacks manuales.',                        icon:'🔥', category:'click',      reward:5000,         unlocked:false },
  { id:'a04', title:'Hacker Legendario',    description:'10.000 hacks manuales.',                       icon:'💀', category:'click',      reward:100000,       unlocked:false },
  { id:'a05', title:'Dios del Click',       description:'100.000 hacks manuales.',                      icon:'⚔️', category:'click',      reward:5000000,      unlocked:false },
  // Income (5)
  { id:'a06', title:'Primeros Ingresos',    description:'Alcanza 10 Đ/seg.',                            icon:'📈', category:'income',     reward:200,          unlocked:false },
  { id:'a07', title:'Corriente Estable',    description:'Alcanza 1.000 Đ/seg.',                         icon:'💰', category:'income',     reward:10000,        unlocked:false },
  { id:'a08', title:'Río de Datos',         description:'Alcanza 100.000 Đ/seg.',                       icon:'🌊', category:'income',     reward:500000,       unlocked:false },
  { id:'a09', title:'Tsunami Financiero',   description:'Alcanza 10M Đ/seg.',                           icon:'🌪️', category:'income',     reward:50000000,     unlocked:false },
  { id:'a10', title:'Singularidad Económica',description:'Alcanza 1B Đ/seg.',                           icon:'🌌', category:'income',     reward:5000000000,   unlocked:false },
  // Wealth (5)
  { id:'a11', title:'Clase Media',          description:'Acumula 10.000 Đ.',                            icon:'💵', category:'wealth',     reward:1000,         unlocked:false },
  { id:'a12', title:'Primer Millón',        description:'Acumula 1.000.000 Đ.',                         icon:'💎', category:'wealth',     reward:100000,       unlocked:false },
  { id:'a13', title:'Multi-Millonario',     description:'Acumula 1.000.000.000 Đ.',                     icon:'👑', category:'wealth',     reward:100000000,    unlocked:false },
  { id:'a14', title:'Trillonario',          description:'Acumula 1T Đ.',                                icon:'🏆', category:'wealth',     reward:100000000000, unlocked:false },
  { id:'a15', title:'Infinito',             description:'Acumula 1Q Đ.',                                icon:'♾️', category:'wealth',     reward:1e15,         unlocked:false },
  // Production (5)
  { id:'a16', title:'Primera Compra',       description:'Compra tu primera mejora.',                    icon:'🛒', category:'production', reward:100,          unlocked:false },
  { id:'a17', title:'Diversificado',        description:'Posee 5 tipos distintos de mejoras.',          icon:'🎯', category:'production', reward:500000,       unlocked:false },
  { id:'a18', title:'Automatizado',         description:'Posee 50 mejoras en total.',                   icon:'🤖', category:'production', reward:1000000,      unlocked:false },
  { id:'a19', title:'Industrial',           description:'Posee 100 mejoras en total.',                  icon:'🏭', category:'production', reward:50000000,     unlocked:false },
  { id:'a20', title:'Monopolista',          description:'Posee 200 mejoras en total.',                  icon:'🌍', category:'production', reward:1000000000,   unlocked:false },
  // Corporate (5)
  { id:'a21', title:'Primer Empleado',      description:'Contrata a tu primer trabajador.',             icon:'👤', category:'corporate',  reward:1000,         unlocked:false },
  { id:'a22', title:'Pequeña Empresa',      description:'10 empleados y 2 instalaciones.',              icon:'🏢', category:'corporate',  reward:50000,        unlocked:false },
  { id:'a23', title:'Corporación',          description:'25 empleados y 5 instalaciones.',              icon:'🏛️', category:'corporate',  reward:500000,       unlocked:false },
  { id:'a24', title:'Nivel 5',              description:'Alcanza nivel 5 de empresa.',                  icon:'⭐', category:'corporate',  reward:250000,       unlocked:false },
  { id:'a25', title:'Nivel 10',             description:'Alcanza nivel 10 de empresa.',                 icon:'🌟', category:'corporate',  reward:10000000,     unlocked:false },
  // Market (5)
  { id:'a26', title:'Primer Bróker',        description:'Compra tus primeras acciones.',                icon:'📊', category:'market',     reward:5000,         unlocked:false },
  { id:'a27', title:'Lobo de Wall Street',  description:'Portfolio de 100.000 Đ en acciones.',          icon:'🐺', category:'market',     reward:50000,        unlocked:false },
  { id:'a28', title:'Dividendista',         description:'Recibe tu primer dividendo.',                  icon:'💸', category:'market',     reward:10000,        unlocked:false },
  { id:'a29', title:'Primer Contrato',      description:'Acepta tu primer contrato B2B.',               icon:'📋', category:'market',     reward:5000,         unlocked:false },
  { id:'a30', title:'Proveedor Fiable',     description:'Completa 5 contratos con éxito.',              icon:'🤝', category:'market',     reward:100000,       unlocked:false },
  // Social (5)
  { id:'a31', title:'Rival Declarado',      description:'Declara rivalidad a una empresa.',             icon:'⚔️', category:'social',     reward:10000,        unlocked:false },
  { id:'a32', title:'Espía Corporativo',    description:'Compra un informe de inteligencia.',           icon:'🔍', category:'social',     reward:5000,         unlocked:false },
  { id:'a33', title:'Diplomático',          description:'Mejora relación con un rival a >50.',          icon:'🕊️', category:'social',     reward:25000,        unlocked:false },
  { id:'a34', title:'Top 3',               description:'Entra en el top 3 del ranking.',               icon:'🥉', category:'social',     reward:500000,       unlocked:false },
  { id:'a35', title:'Número 1',             description:'Alcanza el puesto #1 del ranking.',            icon:'🥇', category:'social',     reward:5000000,      unlocked:false },
  // Time (5)
  { id:'a36', title:'Superviviente',        description:'Sobrevive 100 días.',                          icon:'🗓️', category:'time',       reward:25000,        unlocked:false },
  { id:'a37', title:'Veterano',             description:'Sobrevive 365 días.',                          icon:'📅', category:'time',       reward:250000,       unlocked:false },
  { id:'a38', title:'Leyenda',              description:'Sobrevive 1.000 días.',                        icon:'🏅', category:'time',       reward:2500000,      unlocked:false },
  { id:'a39', title:'Eterno',               description:'Sobrevive 3.000 días.',                        icon:'♾️', category:'time',       reward:25000000,     unlocked:false },
  { id:'a40', title:'Primer Trading',       description:'Compra algo en el mercado global.',            icon:'🛍️', category:'market',     reward:500,          unlocked:false },
  // Contracts (4)
  { id:'a41', title:'Negociador',           description:'Firma 5 contratos B2B.',                       icon:'✍️', category:'market',     reward:75000,        unlocked:false },
  { id:'a42', title:'Malabarista',          description:'Ten 3 contratos activos simultáneamente.',     icon:'🤹', category:'market',     reward:200000,       unlocked:false },
  { id:'a43', title:'Joint Venture',        description:'Completa un contrato de joint venture.',       icon:'🔗', category:'market',     reward:500000,       unlocked:false },
  { id:'a44', title:'Millón de Contratos',  description:'Gana 1.000.000 Đ en pagos de contratos.',     icon:'💼', category:'market',     reward:1000000,      unlocked:false },
  // Stocks (3)
  { id:'a45', title:'Primer Trade',         description:'Ejecuta tu primera operación bursátil.',       icon:'📊', category:'market',     reward:5000,         unlocked:false },
  { id:'a46', title:'Portfolio de Élite',   description:'Ten un portfolio en bolsa de 100.000 Đ.',      icon:'💹', category:'market',     reward:100000,       unlocked:false },
  { id:'a47', title:'Supera el Mercado',    description:'Obtén rentabilidad positiva en bolsa.',        icon:'🐂', category:'market',     reward:250000,       unlocked:false },
  // Rivals (2)
  { id:'a48', title:'Gran Hermano',         description:'Espía a todos los rivales al menos una vez.',  icon:'👁️', category:'social',     reward:300000,       unlocked:false },
  { id:'a49', title:'El Dominante',         description:'Ocupa el puesto #1 del ranking de riqueza.',   icon:'🏆', category:'social',     reward:10000000,     unlocked:false },
  // Social (3)
  { id:'a50', title:'Icono Social',         description:'Alcanza 100 puntos de prestigio personal.',    icon:'✨', category:'social',     reward:500000,       unlocked:false },
  { id:'a51', title:'Miembro Élite',        description:'Únete a 3 clubes sociales.',                   icon:'🎖️', category:'social',     reward:1000000,      unlocked:false },
  { id:'a52', title:'Vida Social Activa',   description:'Asiste a 10 experiencias de lujo.',            icon:'🥂', category:'social',     reward:250000,       unlocked:false },
  // Personal (2)
  { id:'a53', title:'El Gran Señor',        description:'Posee una mansión y un yate.',                 icon:'🏰', category:'social',     reward:2000000,      unlocked:false },
  { id:'a54', title:'Amor Eterno',          description:'Mantén la satisfacción de tu pareja al 90+.',  icon:'💖', category:'social',     reward:500000,       unlocked:false },
  // Company (3)
  { id:'a55', title:'Gran Empleador',       description:'Ten 10 trabajadores en plantilla.',            icon:'👥', category:'corporate',  reward:150000,       unlocked:false },
  { id:'a56', title:'Imperio Industrial',   description:'Construye 5 instalaciones.',                   icon:'🏗️', category:'corporate',  reward:500000,       unlocked:false },
  { id:'a57', title:'Corporación Nivel 10', description:'Alcanza el nivel 10 de empresa.',              icon:'🌟', category:'corporate',  reward:5000000,      unlocked:false },
  // Market (2)
  { id:'a58', title:'Acaparador',           description:'Acumula 1.000 unidades de cualquier producto.',icon:'📦', category:'market',     reward:300000,       unlocked:false },
  { id:'a59', title:'Árbitro del Mercado',  description:'Vende un producto con beneficio neto.',        icon:'🔄', category:'market',     reward:50000,        unlocked:false },
  // Milestones (1)
  { id:'a60', title:'Billonario Total',     description:'Gana 1.000.000.000.000 Đ en total.',           icon:'💰', category:'wealth',     reward:500000000000, unlocked:false },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// NOTIFICATION SYSTEM
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface Notification {
  id: string;
  type: 'success' | 'warning' | 'danger' | 'info' | 'achievement';
  title: string;
  message: string;
  icon: string;
  timestamp: number;
  read: boolean;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GAME STATE (Complete)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface GameState {
  // Core resources
  credits: number;
  totalCreditsEarned: number;
  influence: number;
  creditsPerSecond: number;
  clickPower: number;
  totalClicks: number;

  // Progression
  upgrades: SyndicateUpgrade[];
  achievements: Achievement[];
  completedContracts: number;

  // Engines
  engine: EconomyEngine;
  stockMarket: StockMarket;
  contractManager: ContractManager;
  rivalManager: RivalManager;
  personalManager: PersonalLifeManager;
  gameEvents: GameEventsManager;

  // Game state
  currentDay: number;
  gameSpeed: number;
  paused: boolean;
  _rev: number; // incremented on engine mutations to force Zustand re-render
  lastEventRealTime: number; // Date.now() timestamp of last forced event

  // Notifications
  notifications: Notification[];
  toastQueue: Notification[];

  // Actions
  click: () => void;
  buyUpgrade: (id: string) => void;
  tick: (deltaSeconds: number) => void;
  buyFromMarket: (productId: string, quantity: number) => void;
  sellFromMarket: (productId: string, quantity: number) => void;
  hireWorker: (type: string) => void;
  fireWorker: (workerId: string) => void;
  addFacility: (templateId: string) => void;
  upgradeFacility: (facilityId: string) => void;
  queueProduction: (productId: string, quantity: number, facilityId: string) => void;
  buyShares: (ticker: string, shares: number) => void;
  sellShares: (ticker: string, shares: number) => void;
  acceptContract: (offerId: string) => void;
  breachContract: (contractId: string) => void;
  fulfillDelivery: (contractId: string, quantity: number) => void;
  buyIntelligence: (rivalId: string, cost: number) => void;
  declareRivalry: (rivalId: string) => void;
  proposeAlliance: (rivalId: string, cost: number) => void;
  sabotageRival: (rivalId: string, cost: number) => void;
  setGameSpeed: (speed: number) => void;
  togglePause: () => void;
  dismissToast: () => void;
  dismissNotification: (id: string) => void;

  // Personal Life
  buyPersonalAsset: (assetId: string) => void;
  setPersonalSalary: (amount: number) => void;
  proposePartner: () => void;
  marry: () => void;
  divorce: () => void;
  haveChild: () => void;
  upgradeChildEducation: (childIndex: number) => void;
  takeVacation: () => void;
  joinSocialClub: (clubId: string) => void;
  quitSocialClub: (clubId: string) => void;
  buyExperience: (expId: string) => void;

  // Events
  pendingEvent: GameEvent | null;
  triggerEventChoice: (event: GameEvent, choiceIndex: number) => void;
  dismissEvent: () => void;

  // Multiplayer sync
  setServerState: (partial: Record<string, any>) => void;
  addNotification: (notif: any) => void;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELPERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function upgradeCost(base: number, owned: number): number {
  return Math.floor(base * Math.pow(1.15, owned));
}

function makeNotification(type: Notification['type'], title: string, message: string, icon: string): Notification {
  return { id: `n_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, type, title, message, icon, timestamp: Date.now(), read: false };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ACHIEVEMENT CHECKER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function checkAchievements(state: GameState): { achievements: Achievement[], bonus: number, toasts: Notification[] } {
  const achs = [...state.achievements];
  let bonus = 0;
  const toasts: Notification[] = [];

  const ctx = {
    clicks: state.totalClicks,
    cps: state.creditsPerSecond,
    total: state.totalCreditsEarned,
    totalUpgrades: state.upgrades.reduce((s, u) => s + u.purchased, 0),
    uniqueUpgrades: state.upgrades.filter(u => u.purchased > 0).length,
    workers: state.engine.playerCompany?.workers.length ?? 0,
    facilities: state.engine.playerCompany?.facilities.length ?? 0,
    portfolio: state.stockMarket.getPortfolioValue(),
    days: state.currentDay,
    level: state.engine.playerCompany?.level ?? 1,
    contracts: state.completedContracts,
    credits: state.credits,
  };

  // Extra context for new achievements
  const activeContracts = state.contractManager.active.length;
  const totalContracts = state.completedContracts + activeContracts;
  const personalState = state.personalManager.state;
  const hasMansion = personalState.assets.some(id => id === 're_04' || id === 're_05' || id === 're_06' || id === 're_07' || id === 're_08');
  const hasYacht = personalState.assets.some(id => id === 've_05' || id === 've_06' || id === 've_07');
  const partnerSatisfaction = personalState.family.partner?.satisfaction ?? 0;
  const rivalsTotal = state.rivalManager.rivals.length;
  const spiedRivals = state.rivalManager.rivals.filter(r => r.lastIntelligenceDay > 0).length;
  const rankings = state.rivalManager.getRankings(state.credits, 'player');
  const playerRank = rankings.find(r => r.isPlayer)?.rank ?? 999;
  const experienceCount = Object.keys(personalState.experienceCooldowns).length;
  const clubCount = personalState.socialClubs.length;
  const contractEarnings = state.contractManager.history.reduce((s: number, c: any) => s + (c.totalPaid ?? 0), 0);
  // Max inventory across all products
  let maxInventory = 0;
  if (state.engine.playerCompany) {
    state.engine.playerCompany.inventory.forEach((v) => { if (v > maxInventory) maxInventory = v; });
  }

  const checks: Record<string, boolean> = {
    a01: ctx.clicks >= 1, a02: ctx.clicks >= 100, a03: ctx.clicks >= 1000, a04: ctx.clicks >= 10000, a05: ctx.clicks >= 100000,
    a06: ctx.cps >= 10, a07: ctx.cps >= 1000, a08: ctx.cps >= 100000, a09: ctx.cps >= 10000000, a10: ctx.cps >= 1000000000,
    a11: ctx.total >= 10000, a12: ctx.total >= 1000000, a13: ctx.total >= 1e9, a14: ctx.total >= 1e12, a15: ctx.total >= 1e15,
    a16: ctx.totalUpgrades >= 1, a17: ctx.uniqueUpgrades >= 5, a18: ctx.totalUpgrades >= 50, a19: ctx.totalUpgrades >= 100, a20: ctx.totalUpgrades >= 200,
    a21: ctx.workers >= 1, a22: ctx.workers >= 10 && ctx.facilities >= 2, a23: ctx.workers >= 25 && ctx.facilities >= 5,
    a24: ctx.level >= 5, a25: ctx.level >= 10,
    a26: ctx.portfolio > 0, a27: ctx.portfolio >= 100000,
    a29: state.contractManager.active.length > 0 || state.completedContracts > 0,
    a30: state.completedContracts >= 5,
    a36: ctx.days >= 100, a37: ctx.days >= 365, a38: ctx.days >= 1000, a39: ctx.days >= 3000,
    // New achievements (a41-a60)
    a41: totalContracts >= 5,
    a42: activeContracts >= 3,
    a43: state.contractManager.history.some((c: any) => c.type === 'joint_venture' || c.contractType === 'joint_venture'),
    a44: contractEarnings >= 1000000,
    a45: ctx.portfolio > 0,
    a46: ctx.portfolio >= 100000,
    a47: state.stockMarket.getPortfolioReturn() > 0,
    a48: rivalsTotal > 0 && spiedRivals >= rivalsTotal,
    a49: playerRank === 1,
    a50: personalState.prestige >= 100,
    a51: clubCount >= 3,
    a52: experienceCount >= 10,
    a53: hasMansion && hasYacht,
    a54: partnerSatisfaction >= 90,
    a55: ctx.workers >= 10,
    a56: ctx.facilities >= 5,
    a57: ctx.level >= 10,
    a58: maxInventory >= 1000,
    a59: state.completedContracts > 0,
    a60: ctx.total >= 1e12,
  };

  for (let i = 0; i < achs.length; i++) {
    if (achs[i].unlocked) continue;
    const met = checks[achs[i].id];
    if (met) {
      achs[i] = { ...achs[i], unlocked: true, unlockedAt: state.currentDay };
      bonus += achs[i].reward;
      toasts.push(makeNotification('achievement', achs[i].title, achs[i].description, achs[i].icon));
    }
  }
  return { achievements: achs, bonus, toasts };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ENGINE INITIALIZATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const coreEngine = new EconomyEngine();
const globalStockMarket = new StockMarket();
const globalContractManager = new ContractManager();
const globalRivalManager = new RivalManager();
const globalPersonalManager = new PersonalLifeManager();
const globalGameEvents = new GameEventsManager();
coreEngine.playerCompany = new Company("player", "Aetheria Syndicate", "nexus_char", ProductCategory.Tecnologia, 500);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STORE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const useGameStore = create<GameState>((set, _get) => ({
  credits: 500,
  totalCreditsEarned: 500,
  influence: 0,
  creditsPerSecond: 0,
  clickPower: 1,
  totalClicks: 0,
  upgrades: UPGRADES.map(u => ({ ...u })),
  achievements: ACHIEVEMENTS.map(a => ({ ...a })),
  completedContracts: 0,
  engine: coreEngine,
  stockMarket: globalStockMarket,
  contractManager: globalContractManager,
  rivalManager: globalRivalManager,
  personalManager: globalPersonalManager,
  gameEvents: globalGameEvents,
  pendingEvent: null,
  currentDay: 1,
  gameSpeed: 1,
  paused: false,
  _rev: 0,
  lastEventRealTime: Date.now(),
  notifications: [],
  toastQueue: [],

  // ━━ CLICK ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  click: () => {
    // Optimistic local update for instant feedback
    set((state) => {
      const earned = state.clickPower + state.creditsPerSecond * 0.05;
      const nc = state.totalClicks + 1;
      const base = {
        credits: state.credits + earned,
        totalCreditsEarned: state.totalCreditsEarned + earned,
        totalClicks: nc,
        clickPower: state.clickPower + (nc % 50 === 0 ? 1 : 0),
      };
      const ach = checkAchievements({ ...state, ...base });
      return { ...base, achievements: ach.achievements, credits: base.credits + ach.bonus, totalCreditsEarned: base.totalCreditsEarned + ach.bonus, toastQueue: [...state.toastQueue, ...ach.toasts] };
    });
    // Tell server about the click so next game:tick includes it in credits
    api.post('/game/action', { type: 'click' }).catch(() => {});
  },

  // ━━ BUY UPGRADE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  buyUpgrade: (id) => {
    // Optimistic local update first (instant feedback)
    set((state) => {
      const idx = state.upgrades.findIndex(u => u.id === id);
      if (idx === -1) return state;
      const ug = state.upgrades[idx];
      if (state.credits < ug.cost) return state;
      const nc = state.credits - ug.cost;
      const np = ug.purchased + 1;
      const newUpgrades = state.upgrades.map((u, i) => i === idx ? { ...u, purchased: np, cost: upgradeCost(u.baseCost, np) } : u);
      const newCPS = newUpgrades.reduce((a, u) => a + u.purchased * u.cpsEach, 0);
      const base = { credits: nc, upgrades: newUpgrades, creditsPerSecond: newCPS, _rev: state._rev + 1 };
      const ach = checkAchievements({ ...state, ...base });
      return { ...base, achievements: ach.achievements, credits: base.credits + ach.bonus, totalCreditsEarned: state.totalCreditsEarned + ach.bonus, toastQueue: [...state.toastQueue, ...ach.toasts] };
    });
    // Persist to server (authoritative save — never lose a purchase)
    api.post('/game/action', { type: 'buy_upgrade', payload: { id } })
      .then(res => {
        if (res.data.success && res.data.delta) {
          useGameStore.getState().setServerState(res.data.delta);
        }
      })
      .catch(err => console.error('buyUpgrade server sync failed:', err));
  },

  // ━━ MARKET ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  buyFromMarket: (productId, quantity) => set((state) => {
    for (const market of state.engine.markets.values()) {
      const p = market.getProductState(productId);
      if (p) {
        const cost = p.currentPrice * quantity;
        if (state.credits >= cost && state.engine.playerCompany) {
          market.buyProduct(productId, quantity, 0);
          const inv = state.engine.playerCompany.inventory.get(productId) ?? 0;
          state.engine.playerCompany.inventory.set(productId, inv + quantity);
          const base = { credits: state.credits - cost, _rev: state._rev + 1 };
          const ach = checkAchievements({ ...state, ...base, achievements: state.achievements.map(a => a.id === 'a40' && !a.unlocked ? { ...a, unlocked: true, unlockedAt: state.currentDay } : a) });
          const toasts = state.achievements.find(a => a.id === 'a40' && !a.unlocked) ? [makeNotification('achievement', 'Primer Trading', 'Compra algo en el mercado global.', '🛍️')] : [];
          return { ...base, achievements: ach.achievements, credits: base.credits + ach.bonus, toastQueue: [...state.toastQueue, ...toasts, ...ach.toasts] };
        }
        return { notifications: [...state.notifications, makeNotification('danger', 'Sin Fondos', `Necesitas Đ${Math.ceil(p.currentPrice * quantity).toLocaleString()}`, '💸')] };
      }
    }
    return state;
  }),

  sellFromMarket: (productId, quantity) => set((state) => {
    if (!state.engine.playerCompany) return state;
    const held = state.engine.playerCompany.inventory.get(productId) ?? 0;
    if (held < quantity) return { notifications: [...state.notifications, makeNotification('danger', 'Inventario insuficiente', `Solo tienes ${held} unidades`, '📦')] };
    for (const market of state.engine.markets.values()) {
      const p = market.getProductState(productId);
      if (p) {
        const revenue = p.currentPrice * quantity;
        market.sellProduct(productId, quantity, 0);
        state.engine.playerCompany.inventory.set(productId, held - quantity);
        return { credits: state.credits + revenue, totalCreditsEarned: state.totalCreditsEarned + revenue, influence: state.influence + Math.floor(revenue / 10000), _rev: state._rev + 1 };
      }
    }
    return state;
  }),

  // ━━ HR ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  hireWorker: (type: any) => set((state) => {
    if (!state.engine.playerCompany) return state;
    state.engine.playerCompany.cash = state.credits;
    const res = state.engine.playerCompany.hireWorker(type);
    if (res.success) {
      const nc = state.engine.playerCompany.cash;
      const notif = makeNotification('success', 'Empleado Contratado', res.message, '👤');
      const base = { credits: nc, _rev: state._rev + 1, notifications: [...state.notifications, notif] };
      const ach = checkAchievements({ ...state, ...base });
      return { ...base, achievements: ach.achievements, credits: base.credits + ach.bonus, toastQueue: [...state.toastQueue, ...ach.toasts] };
    }
    return { notifications: [...state.notifications, makeNotification('danger', 'Error', res.message, '❌')] };
  }),

  fireWorker: (workerId) => set((state) => {
    if (!state.engine.playerCompany) return state;
    state.engine.playerCompany.cash = state.credits;
    const res = state.engine.playerCompany.fireWorker(workerId);
    if (res.success) {
      return { credits: state.engine.playerCompany.cash, _rev: state._rev + 1, notifications: [...state.notifications, makeNotification('warning', 'Empleado Despedido', res.message, '🚪')] };
    }
    return { notifications: [...state.notifications, makeNotification('danger', 'Error', res.message, '❌')] };
  }),

  // ━━ FACILITIES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  addFacility: (templateId) => set((state) => {
    if (!state.engine.playerCompany) return state;
    state.engine.playerCompany.cash = state.credits;
    const res = state.engine.playerCompany.addFacility(templateId);
    if (res.success) {
      const nc = state.engine.playerCompany.cash;
      const notif = makeNotification('success', 'Instalación Adquirida', res.message, '🏭');
      const base = { credits: nc, _rev: state._rev + 1, notifications: [...state.notifications, notif] };
      const ach = checkAchievements({ ...state, ...base });
      return { ...base, achievements: ach.achievements, credits: base.credits + ach.bonus, toastQueue: [...state.toastQueue, ...ach.toasts] };
    }
    return { notifications: [...state.notifications, makeNotification('danger', 'Error', res.message, '❌')] };
  }),

  upgradeFacility: (facilityId: string) => set((state) => {
    if (!state.engine.playerCompany) return state;
    state.engine.playerCompany.cash = state.credits;
    const res = state.engine.playerCompany.upgradeFacility(facilityId);
    if (res.success) {
      const nc = state.engine.playerCompany.cash;
      return { credits: nc, _rev: state._rev + 1, notifications: [...state.notifications, makeNotification('success', 'Instalación Mejorada', res.message, '🔧')] };
    }
    return { notifications: [...state.notifications, makeNotification('danger', 'Error', res.message, '❌')] };
  }),

  queueProduction: (productId, quantity, facilityId) => set((state) => {
    if (!state.engine.playerCompany) return state;
    const res = state.engine.playerCompany.queueProduction(productId, quantity, facilityId);
    if (res.success) {
      return { _rev: state._rev + 1, notifications: [...state.notifications, makeNotification('success', 'Producción Iniciada', res.message, '⚙️')] };
    }
    return { notifications: [...state.notifications, makeNotification('danger', 'Error de Producción', res.message, '❌')] };
  }),

  // ━━ STOCKS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  buyShares: (ticker, shares) => set((state) => {
    const res = state.stockMarket.buyShares(ticker, shares, state.credits);
    if (res.success) {
      const nc = state.credits - res.cost;
      if (state.engine.playerCompany) state.engine.playerCompany.cash = nc;
      const ach = checkAchievements({ ...state, credits: nc });
      return { credits: nc + ach.bonus, _rev: state._rev + 1, achievements: ach.achievements, toastQueue: [...state.toastQueue, ...ach.toasts], notifications: [...state.notifications, makeNotification('info', 'Compra Ejecutada', res.message, '📈')] };
    }
    return { notifications: [...state.notifications, makeNotification('danger', 'Error', res.message, '❌')] };
  }),

  sellShares: (ticker, shares) => set((state) => {
    const res = state.stockMarket.sellShares(ticker, shares);
    if (res.success) {
      const nc = state.credits + res.proceeds;
      if (state.engine.playerCompany) state.engine.playerCompany.cash = nc;
      return { credits: nc, _rev: state._rev + 1, totalCreditsEarned: state.totalCreditsEarned + Math.max(0, res.proceeds), influence: state.influence + (res.profit > 0 ? Math.floor(res.profit / 5000) : 0), notifications: [...state.notifications, makeNotification('success', 'Venta Ejecutada', res.message, '📉')] };
    }
    return { notifications: [...state.notifications, makeNotification('danger', 'Error', res.message, '❌')] };
  }),

  // ━━ CONTRACTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  acceptContract: (offerId) => set((state) => {
    const contract = state.contractManager.acceptContract(offerId, state.currentDay);
    if (contract) {
      const ach = checkAchievements(state);
      return { _rev: state._rev + 1, notifications: [...state.notifications, makeNotification('success', 'Contrato Aceptado', `Firmado con ${contract.counterpartyName}`, '📋')], achievements: ach.achievements, toastQueue: [...state.toastQueue, ...ach.toasts] };
    }
    return state;
  }),

  breachContract: (contractId) => set((state) => {
    const penalty = state.contractManager.breachContract(contractId);
    const nc = Math.max(0, state.credits - penalty);
    if (state.engine.playerCompany) state.engine.playerCompany.cash = nc;
    return {
      _rev: state._rev + 1,
      credits: nc,
      notifications: [...state.notifications, makeNotification('danger', 'Contrato Roto', `Penalización: Đ${Math.floor(penalty).toLocaleString()}`, '⚠️')],
    };
  }),

  fulfillDelivery: (contractId, quantity) => set((state) => {
    const company = state.engine.playerCompany;
    // Find the contract to get the product
    const contract = state.contractManager.active.find(c => c.id === contractId);
    if (!contract) return { notifications: [...state.notifications, makeNotification('danger', 'Error', 'Contrato no encontrado', '❌')] };
    // Check and deduct inventory
    if (contract.productId && company) {
      const held = company.inventory.get(contract.productId) ?? 0;
      if (held < quantity) {
        return { notifications: [...state.notifications, makeNotification('danger', 'Sin Inventario', `Necesitas ${quantity} uds de ${contract.productId.replace(/_/g, ' ')} pero solo tienes ${held}`, '📦')] };
      }
      const newQty = held - quantity;
      if (newQty <= 0) company.inventory.delete(contract.productId);
      else company.inventory.set(contract.productId, newQty);
    }
    const quality = company ? Math.min(100, 60 + (company.level ?? 1) * 5) : 80;
    const msg = state.contractManager.fulfillDelivery(contractId, quantity, quality, state.currentDay);
    return { _rev: state._rev + 1, notifications: [...state.notifications, makeNotification('success', 'Entrega Registrada', msg, '📦')] };
  }),

  // ━━ RIVALS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  buyIntelligence: (rivalId, cost) => set((state) => {
    if (state.credits < cost) return { notifications: [...state.notifications, makeNotification('danger', 'Sin Fondos', `Necesitas Đ${Math.ceil(cost).toLocaleString()} para comprar inteligencia.`, '❌')] };
    const report = state.rivalManager.getIntelligenceReport(rivalId);
    if (report) {
      const nc = state.credits - cost;
      if (state.engine.playerCompany) state.engine.playerCompany.cash = nc;
      const ach = checkAchievements({ ...state, credits: nc });
      const updatedAch = ach.achievements.map(a => a.id === 'a32' && !a.unlocked ? { ...a, unlocked: true, unlockedAt: state.currentDay } : a);
      const spyToast = state.achievements.find(a => a.id === 'a32' && !a.unlocked) ? [makeNotification('achievement', 'Espía Corporativo', 'Compra un informe de inteligencia.', '🔍')] : [];
      return { credits: nc, _rev: state._rev + 1, achievements: updatedAch, notifications: [...state.notifications, makeNotification('info', `Intel: ${report.summary.slice(0, 80)}...`, report.predictedNextMove, '🔍')], toastQueue: [...state.toastQueue, ...spyToast] };
    }
    return state;
  }),

  declareRivalry: (rivalId) => set((state) => {
    const events = state.rivalManager.declareRivalry(rivalId);
    const notifs = events.map(e => makeNotification('warning', 'Rivalidad Declarada', e, '⚔️'));
    const ach = state.achievements.map(a => a.id === 'a31' && !a.unlocked ? { ...a, unlocked: true, unlockedAt: state.currentDay } : a);
    const toast = state.achievements.find(a => a.id === 'a31' && !a.unlocked) ? [makeNotification('achievement', 'Rival Declarado', 'Declara rivalidad a una empresa.', '⚔️')] : [];
    return { _rev: state._rev + 1, achievements: ach, notifications: [...state.notifications, ...notifs], toastQueue: [...state.toastQueue, ...toast] };
  }),

  proposeAlliance: (rivalId, cost) => set((state) => {
    if (state.credits < cost) return { notifications: [...state.notifications, makeNotification('danger', 'Sin Fondos', `Necesitas Đ${Math.ceil(cost).toLocaleString()} para proponer una alianza.`, '❌')] };
    const rival = state.rivalManager.rivals.find(r => r.id === rivalId);
    if (!rival) return state;
    const msg = state.rivalManager.improveRelationship(rivalId, 25);
    const nc = state.credits - cost;
    if (state.engine.playerCompany) state.engine.playerCompany.cash = nc;
    return {
      credits: nc,
      _rev: state._rev + 1,
      notifications: [...state.notifications, makeNotification('success', 'Alianza Propuesta', `${msg} Coste: Đ${Math.ceil(cost).toLocaleString()}`, '🤝')],
    };
  }),

  sabotageRival: (rivalId, cost) => set((state) => {
    if (state.credits < cost) return { notifications: [...state.notifications, makeNotification('danger', 'Sin Fondos', `Necesitas Đ${Math.ceil(cost).toLocaleString()} para sabotear.`, '❌')] };
    const rival = state.rivalManager.rivals.find(r => r.id === rivalId);
    if (!rival) return state;
    const internalRival = (state.rivalManager as any)._rivals?.find((r: any) => r.id === rivalId);
    if (internalRival) {
      const damage = rival.netWorth * 0.05;
      internalRival.cash = Math.max(0, internalRival.cash - damage);
      internalRival.netWorth = Math.max(0, internalRival.netWorth - damage * 0.5);
      internalRival.reputation = Math.max(0, internalRival.reputation - 8);
      internalRival.relationship = Math.max(-100, internalRival.relationship - 20);
      internalRival.threatLevel = Math.max(0, internalRival.threatLevel - 5);
    }
    const nc = state.credits - cost;
    if (state.engine.playerCompany) state.engine.playerCompany.cash = nc;
    return {
      credits: nc,
      _rev: state._rev + 1,
      notifications: [...state.notifications, makeNotification('warning', 'Sabotaje Ejecutado', `Has causado daño financiero a ${rival.name}. Su reputación cae y su liquidez se reduce.`, '💣')],
    };
  }),

  // ━━ CONTROLS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  setGameSpeed: (speed) => set({ gameSpeed: speed }),
  togglePause: () => set((s) => ({ paused: !s.paused })),
  dismissToast: () => set((s) => ({ toastQueue: s.toastQueue.slice(1) })),
  dismissNotification: (id) => set((s) => ({ notifications: s.notifications.filter(n => n.id !== id) })),

  // ━━ MAIN TICK (multiplayer: cliente solo interpola CPS, servidor es autoridad) ━━
  tick: (deltaSeconds) => set((state) => {
    // Smooth CPS interpolation between server ticks — server is authoritative
    const earned = state.creditsPerSecond * deltaSeconds;
    const nc = state.credits + earned;
    const nt = state.totalCreditsEarned + Math.max(0, earned);

    // Game events: timed check (pure client-side UI)
    let newPendingEvent = state.pendingEvent;
    let newLastEventRealTime = state.lastEventRealTime;
    if (!state.pendingEvent) {
      const now = Date.now();
      if (now - state.lastEventRealTime >= 10 * 60 * 1000) {
        const forced = state.gameEvents.forceRandomEvent(state.currentDay);
        if (forced) newPendingEvent = forced;
        newLastEventRealTime = now;
      }
    }

    return {
      credits: nc,
      totalCreditsEarned: nt,
      pendingEvent: newPendingEvent,
      lastEventRealTime: newLastEventRealTime,
    };
  }),

  // ━━ PERSONAL LIFE ACTIONS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  buyPersonalAsset: (assetId) => set((state) => {
    // Personal assets deduct from personalManager.state.cash (personal budget), NOT company credits
    // We pass company level for unlock checks
    const companyLevel = state.engine.playerCompany?.level ?? 1;
    // Fund personal cash from company credits first
    state.personalManager.state.cash = state.credits;
    const res = state.personalManager.buyAsset(assetId, companyLevel);
    if (!res.success) return { notifications: [...state.notifications, makeNotification('warning', 'Compra Fallida', res.message, '⚠️')] };
    const nc = state.personalManager.state.cash;
    if (state.engine.playerCompany) state.engine.playerCompany.cash = nc;
    return { _rev: state._rev + 1, credits: nc, notifications: [...state.notifications, makeNotification('success', 'Nueva Propiedad', res.message, '💎')] };
  }),
  setPersonalSalary: (amount) => set((state) => {
    state.personalManager.setSalary(amount);
    return { _rev: state._rev + 1 };
  }),
  proposePartner: () => set((state) => {
    const res = state.personalManager.proposePartner();
    if (!res.success) return { notifications: [...state.notifications, makeNotification('warning', 'Rechazado', res.message, '💔')] };
    return { _rev: state._rev + 1, notifications: [...state.notifications, makeNotification('success', 'Nueva Relación', res.message, '💖')] };
  }),
  marry: () => set((state) => {
    const res = state.personalManager.marry();
    if (!res.success) return { notifications: [...state.notifications, makeNotification('warning', 'Problemas', res.message, '⚠️')] };
    return { _rev: state._rev + 1, notifications: [...state.notifications, makeNotification('success', 'Boda', res.message, '💍')] };
  }),
  haveChild: () => set((state) => {
    const res = state.personalManager.haveChild();
    if (!res.success) return { notifications: [...state.notifications, makeNotification('warning', 'No disponible', res.message, '⚠️')] };
    return { _rev: state._rev + 1, notifications: [...state.notifications, makeNotification('success', 'Nuevo Hijo', res.message, '👶')] };
  }),
  takeVacation: () => set((state) => {
    const res = state.personalManager.takeVacation();
    if (!res.success) return { notifications: [...state.notifications, makeNotification('warning', 'Fondos insuficientes', res.message, '⚠️')] };
    return { _rev: state._rev + 1, notifications: [...state.notifications, makeNotification('success', 'Vacaciones', res.message, '🏖️')] };
  }),
  divorce: () => set((state) => {
    const res = state.personalManager.divorce();
    if (!res.success) return { notifications: [...state.notifications, makeNotification('warning', 'Error', res.message, '⚠️')] };
    return { _rev: state._rev + 1, notifications: [...state.notifications, makeNotification('warning', 'Divorcio', res.message, '💔')] };
  }),
  upgradeChildEducation: (childIndex) => set((state) => {
    const res = state.personalManager.upgradeChildEducation(childIndex);
    if (!res.success) return { notifications: [...state.notifications, makeNotification('warning', 'Error', res.message, '⚠️')] };
    return { _rev: state._rev + 1, notifications: [...state.notifications, makeNotification('success', 'Educación Mejorada', res.message, '🎓')] };
  }),
  joinSocialClub: (clubId) => set((state) => {
    const res = state.personalManager.joinClub(clubId);
    if (!res.success) return { notifications: [...state.notifications, makeNotification('warning', 'Error', res.message, '⚠️')] };
    return { _rev: state._rev + 1, notifications: [...state.notifications, makeNotification('success', 'Club Unido', res.message, '🤝')] };
  }),
  quitSocialClub: (clubId) => set((state) => {
    const res = state.personalManager.quitClub(clubId);
    if (!res.success) return { notifications: [...state.notifications, makeNotification('warning', 'Error', res.message, '⚠️')] };
    return { _rev: state._rev + 1, notifications: [...state.notifications, makeNotification('info', 'Club Abandonado', res.message, '🚪')] };
  }),
  buyExperience: (expId) => set((state) => {
    const res = state.personalManager.buyExperience(expId, state.currentDay);
    if (!res.success) return { notifications: [...state.notifications, makeNotification('warning', 'No disponible', res.message, '⚠️')] };
    return { _rev: state._rev + 1, notifications: [...state.notifications, makeNotification('success', 'Experiencia', res.message, '✨')] };
  }),

  // ━━ GAME EVENTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  triggerEventChoice: (event, choiceIndex) => set((state) => {
    const result = state.gameEvents.applyEventChoice(event, choiceIndex, state.currentDay);
    let nc = state.credits + result.creditsDelta;
    if (nc < 0) nc = 0;
    const newInf = state.influence + result.influenceBonus;
    // Apply stress/happiness to personal manager
    if (result.stressDelta !== 0) {
      state.personalManager.state.stress = Math.max(0, Math.min(100, state.personalManager.state.stress + result.stressDelta));
    }
    if (result.happinessDelta !== 0) {
      state.personalManager.state.happiness = Math.max(0, Math.min(100, state.personalManager.state.happiness + result.happinessDelta));
    }
    const choice = event.choices?.[choiceIndex];
    const notif = makeNotification('info', `${event.icon} ${event.title}`, choice?.label ?? 'Decisión tomada', event.icon);
    return {
      credits: nc,
      influence: Math.max(0, newInf),
      pendingEvent: null,
      _rev: state._rev + 1,
      notifications: [...state.notifications, notif],
    };
  }),

  dismissEvent: () => set((state) => {
    if (state.pendingEvent) {
      state.gameEvents.dismissWithoutChoice(state.pendingEvent);
    }
    return { pendingEvent: null, _rev: state._rev + 1 };
  }),

  // ━━ SERVER SYNC (multiplayer) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  setServerState: (partial: Record<string, any>) => set((state) => {
    const next: any = { ...partial };
    // Merge upgrades: server data is authoritative for purchased/cost; keep local icons/descriptions
    if (partial.upgrades) {
      next.upgrades = (partial.upgrades as any[]).map((su: any) => {
        const local = state.upgrades.find(u => u.id === su.id);
        return local ? { ...local, purchased: su.purchased ?? local.purchased, cost: su.cost ?? local.cost } : su;
      });
    }
    // Merge achievements: only update unlocked/unlockedAt from server; preserve local definitions
    if (partial.achievements) {
      const serverMap = new Map((partial.achievements as any[]).map((a: any) => [a.id, a]));
      next.achievements = state.achievements.map(a => {
        const sv = serverMap.get(a.id);
        return sv ? { ...a, unlocked: sv.unlocked ?? a.unlocked, unlockedAt: sv.unlockedAt ?? a.unlockedAt } : a;
      });
    } else {
      // Don't overwrite local achievements if server doesn't send them
      delete next.achievements;
    }
    // Sync economy engine day if server sends it (advanceDay until caught up)
    if (partial.currentDay && partial.currentDay > state.currentDay) {
      try {
        const target = partial.currentDay as number;
        let d = state.currentDay;
        while (d < target && d < state.currentDay + 30) { state.engine.advanceDay(); d++; }
      } catch {}
    }
    return next;
  }),

  // Push a notification from the server
  addNotification: (notif: any) => set((state) => ({
    toastQueue: [...state.toastQueue, makeNotification(notif.type ?? 'info', notif.title ?? 'Notificación', notif.message ?? '', notif.icon ?? '🔔')],
  })),
}));

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FORMAT UTILITY (exported for all views)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function formatNumber(n: number): string {
  if (!isFinite(n) || isNaN(n)) return '0';
  if (n < 0) return '-' + formatNumber(-n);
  if (n >= 1e15) return (n / 1e15).toFixed(2) + "Q";
  if (n >= 1e12) return (n / 1e12).toFixed(2) + "T";
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  if (n < 1 && n > 0) return n.toFixed(2);
  return Math.floor(n).toLocaleString();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SAVE / LOAD SYSTEM (localStorage)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const SAVE_KEY = 'nexus_save_v1';

export interface SaveData {
  version: number;
  savedAt: number;
  credits: number;
  totalCreditsEarned: number;
  influence: number;
  creditsPerSecond: number;
  clickPower: number;
  totalClicks: number;
  completedContracts: number;
  currentDay: number;
  gameSpeed: number;
  upgrades: SyndicateUpgrade[];
  achievements: Achievement[];
  contractManager: object;
  personalLifeState: object;
  stockMarketData: object;
  rivalManagerData: object;
  companyData: object | null;
}

export function saveGame(): boolean {
  try {
    const state = useGameStore.getState();
    const data: SaveData = {
      version: 1,
      savedAt: Date.now(),
      credits: state.credits,
      totalCreditsEarned: state.totalCreditsEarned,
      influence: state.influence,
      creditsPerSecond: state.creditsPerSecond,
      clickPower: state.clickPower,
      totalClicks: state.totalClicks,
      completedContracts: state.completedContracts,
      currentDay: state.currentDay,
      gameSpeed: state.gameSpeed,
      upgrades: state.upgrades,
      achievements: state.achievements,
      contractManager: state.contractManager.toJSON(),
      personalLifeState: JSON.parse(JSON.stringify(state.personalManager.state)),
      stockMarketData: state.stockMarket.toJSON(),
      rivalManagerData: state.rivalManager.toJSON(),
      companyData: state.engine.playerCompany ? state.engine.playerCompany.toJSON() : null,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('saveGame failed:', e);
    return false;
  }
}

export function loadGame(): boolean {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const data: SaveData = JSON.parse(raw);
    if (!data || data.version !== 1) return false;

    const state = useGameStore.getState();

    // Restore contract manager
    const cm = ContractManager.fromJSON(data.contractManager as any);

    // Restore personal life state
    state.personalManager.state = data.personalLifeState as any;

    // Restore stock market
    const sm = StockMarket.fromJSON(data.stockMarketData);

    // Restore rival manager
    const rm = RivalManager.fromJSON(data.rivalManagerData as any);

    // Restore company
    if (data.companyData && state.engine.playerCompany) {
      const company = Company.fromJSON(data.companyData as any);
      // Sync internal day to avoid skipping days after load
      company.currentDay = data.currentDay;
      state.engine.playerCompany = company;
      // Also sync engine day tracker
      state.engine.totalDays = data.currentDay;
    }

    // Restore scalar state
    useGameStore.setState({
      credits: data.credits,
      totalCreditsEarned: data.totalCreditsEarned,
      influence: data.influence,
      creditsPerSecond: data.creditsPerSecond,
      clickPower: data.clickPower,
      totalClicks: data.totalClicks,
      completedContracts: data.completedContracts,
      currentDay: data.currentDay,
      gameSpeed: data.gameSpeed,
      upgrades: data.upgrades,
      achievements: data.achievements,
      contractManager: cm,
      stockMarket: sm,
      rivalManager: rm,
      _rev: 1,
    });

    return true;
  } catch (e) {
    console.error('loadGame failed:', e);
    return false;
  }
}

export function hasSaveGame(): boolean {
  return !!localStorage.getItem(SAVE_KEY);
}

export function deleteSaveGame(): void {
  localStorage.removeItem(SAVE_KEY);
}

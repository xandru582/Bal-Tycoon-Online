// ============================================================
// NEXUS: Imperio del Mercado — Core Type Definitions
// ============================================================

// ─── Enums ───────────────────────────────────────────────────

export enum CompanyType {
  Startup = "startup",
  SmallBusiness = "small_business",
  Corporation = "corporation",
  Conglomerate = "conglomerate",
}

export enum OrderType {
  Buy = "buy",
  Sell = "sell",
  Limit = "limit",
  StopLoss = "stop_loss",
}

export enum ProductCategory {
  Moda = "moda",
  Alimentacion = "alimentacion",
  Tecnologia = "tecnologia",
  Finanzas = "finanzas",
  Energia = "energia",
  Inmobiliario = "inmobiliario",
  Entretenimiento = "entretenimiento",
  Salud = "salud",
  MateriasPrimas = "materias_primas",
  MercadoGris = "mercado_gris",
}

export enum ContractType {
  Supply = "supply",
  Distribution = "distribution",
  Licensing = "licensing",
  Consulting = "consulting",
  Exclusivity = "exclusivity",
  Joint_Venture = "joint_venture",
}

export enum ContractStatus {
  Pending = "pending",
  Active = "active",
  Completed = "completed",
  Breached = "breached",
  Cancelled = "cancelled",
}

export enum EconomicPhase {
  Boom = "boom",
  Growth = "growth",
  Stable = "stable",
  Slowdown = "slowdown",
  Recession = "recession",
  Crisis = "crisis",
}

export enum AchievementCategory {
  Financial = "financial",
  Reputation = "reputation",
  Expansion = "expansion",
  Social = "social",
  Narrative = "narrative",
  Mastery = "mastery",
  Secret = "secret",
}

export enum NewsSeverity {
  Info = "info",
  Warning = "warning",
  Alert = "alert",
  Critical = "critical",
}

export enum NotificationType {
  Success = "success",
  Warning = "warning",
  Error = "error",
  Info = "info",
  Trade = "trade",
  Narrative = "narrative",
  Achievement = "achievement",
}

export enum WorkerSkill {
  Sales = "sales",
  Marketing = "marketing",
  Finance = "finance",
  Operations = "operations",
  Tech = "tech",
  Creative = "creative",
  Legal = "legal",
  Logistics = "logistics",
}

// ─── Characters ───────────────────────────────────────────────

export interface CharacterStats {
  negotiation: number;   // 1–10
  management: number;    // 1–10
  tech: number;          // 1–10
  charisma: number;      // 1–10
  streetwise: number;    // 1–10
}

export interface CharacterBonus {
  moda_rep_bonus?: number;
  alimentacion_rep_bonus?: number;
  finanzas_rep_bonus?: number;
  tech_rep_bonus?: number;
  negotiation_bonus?: number;
  trade_fee_reduction?: number;
  grey_market_access?: boolean;
  market_insight_bonus?: number;
  production_cost_reduction?: number;
  employee_morale_bonus?: number;
  viral_chance_bonus?: number;
  credit_rate_bonus?: number;
}

export interface Character {
  id: string;
  name: string;
  age: number;
  district: string;
  sector: ProductCategory;
  tagline: string;
  backstory: string;
  portrait: string;               // asset path
  stats: CharacterStats;
  starting_cash: number;
  starting_sector: string;
  special_ability: string;
  special_ability_description: string;
  special_bonus: CharacterBonus;
  intro_dialogues: DialogueLine[];
  color_primary: string;          // hex
  color_secondary: string;        // hex
}

// ─── Company ─────────────────────────────────────────────────

export interface Facility {
  id: string;
  name: string;
  type: "office" | "factory" | "warehouse" | "retail" | "lab" | "server_farm";
  location: string;
  capacity: number;
  currentUtilization: number;
  monthlyCost: number;
  productionBonus: number;    // multiplier, e.g. 1.2
  upgrades: string[];
  purchaseDate: number;       // game day
}

export interface Worker {
  id: string;
  name: string;
  role: string;
  primarySkill: WorkerSkill;
  secondarySkill?: WorkerSkill;
  skillLevel: number;         // 1–10
  salary: number;             // monthly
  morale: number;             // 0–100
  productivity: number;       // 0–100, derived
  hiredOn: number;            // game day
  isSpecialist: boolean;
  specialBonus?: Partial<CharacterBonus>;
  backstory?: string;
}

export interface Company {
  id: string;
  name: string;
  ownerId: string;            // character id
  type: CompanyType;
  sector: ProductCategory;
  reputation: number;         // 0–100
  esgScore: number;           // -100 to 100
  cash: number;
  totalAssets: number;
  totalLiabilities: number;
  revenue: number;            // current month
  expenses: number;           // current month
  netProfit: number;
  employees: Worker[];
  facilities: Facility[];
  inventory: Record<string, number>;   // productId → quantity
  activeContracts: string[];            // contract ids
  stockSymbol?: string;
  isPublic: boolean;
  foundedOn: number;          // game day
  level: number;              // 1–10, unlocks features
}

// ─── Market ──────────────────────────────────────────────────

export interface PricePoint {
  day: number;
  price: number;
  volume: number;
}

export interface MarketOrder {
  id: string;
  companyId: string;
  productId: string;
  type: OrderType;
  quantity: number;
  price: number;              // limit price or 0 for market order
  filled: number;
  createdAt: number;
  expiresAt?: number;
  isAI: boolean;
}

export interface Market {
  id: string;
  productId: string;
  currentPrice: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  volume24h: number;
  priceHistory: PricePoint[];
  pendingOrders: MarketOrder[];
  lastUpdated: number;
  trend: "rising" | "falling" | "stable";
  liquidityScore: number;     // 0–1
  isManipulated: boolean;     // grey market flag
}

// ─── Products ────────────────────────────────────────────────

export interface ProductionChain {
  inputs: { productId: string; quantity: number }[];
  outputProductId: string;
  outputQuantity: number;
  timeInDays: number;
  facilityRequired: string;
  skillRequired: WorkerSkill;
  energyCost: number;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  basePrice: number;
  minPrice: number;
  maxPrice: number;
  volatility: number;         // 0–1
  demand: number;             // 0–1
  supply: number;             // 0–1
  productionCost: number;
  esgScore: number;           // -10 to 10
  exportValue: number;        // multiplier for international sales
  tags: string[];
  description: string;
  icon: string;               // emoji
  unlockLevel: number;        // company level required
  isIllegal: boolean;
  productionChain?: ProductionChain;
}

// ─── Stocks ──────────────────────────────────────────────────

export interface Stock {
  symbol: string;
  companyName: string;
  sector: ProductCategory;
  price: number;
  previousClose: number;
  change: number;             // absolute
  changePercent: number;
  volume: number;
  marketCap: number;
  peRatio: number;
  dividendYield: number;
  priceHistory: PricePoint[];
  isPlayerOwned: boolean;
  sharesOwned: number;
  isCompetitor: boolean;
}

export interface StockIndex {
  name: string;
  symbol: string;
  value: number;
  change: number;
  changePercent: number;
  constituents: string[];     // stock symbols
  history: PricePoint[];
}

export interface StockOrder {
  id: string;
  symbol: string;
  type: OrderType;
  quantity: number;
  price: number;
  total: number;
  fee: number;
  executedAt: number;         // game day
  characterId: string;
}

// ─── Contracts ───────────────────────────────────────────────

export interface ContractTerm {
  key: string;
  value: string | number;
  unit?: string;
}

export interface Contract {
  id: string;
  type: ContractType;
  status: ContractStatus;
  partyA: string;             // company id
  partyB: string;             // company id or NPC id
  productId?: string;
  terms: ContractTerm[];
  valuePerMonth: number;
  durationDays: number;
  startDay: number;
  endDay: number;
  penaltyForBreach: number;
  reputationEffect: number;
  autoRenew: boolean;
  notes?: string;
}

// ─── Economy ─────────────────────────────────────────────────

export interface EconomicIndicators {
  gdpGrowth: number;              // % per year, e.g. 2.5
  inflation: number;              // % per year
  unemployment: number;           // %
  consumerConfidence: number;     // 0–100
  businessConfidence: number;     // 0–100
  interestRate: number;           // % central bank rate
  exchangeRate: number;           // vs. global currency
  stockIndexValue: number;        // NVX composite
  phase: EconomicPhase;
  weeklyReport: string;
  lastShockDay?: number;
  shockDescription?: string;
}

export interface MarketEvent {
  id: string;
  title: string;
  description: string;
  affectedCategories: ProductCategory[];
  priceMultiplier: number;
  demandShift: number;            // -1 to 1
  supplyShift: number;            // -1 to 1
  durationDays: number;
  startDay: number;
  severity: NewsSeverity;
  isActive: boolean;
}

// ─── Achievements ────────────────────────────────────────────

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  icon: string;                   // emoji
  condition: string;              // JS expression string referencing gameState
  reward: {
    cash?: number;
    reputationBonus?: number;
    unlockFeature?: string;
    specialItem?: string;
  };
  isSecret: boolean;
  unlockedOn?: number;            // game day, undefined if locked
  points: number;
}

// ─── Game State & Save System ─────────────────────────────────

export interface GameSettings {
  difficulty: "facil" | "normal" | "dificil" | "realista";
  language: "es" | "en";
  soundEnabled: boolean;
  musicEnabled: boolean;
  autosaveInterval: number;       // in game-days
  showTutorialHints: boolean;
  fastForwardSpeed: number;       // 1–5
  uiScale: number;                // 0.8–1.2
}

export interface GameState {
  id: string;
  version: string;
  characterId: string;
  company: Company;
  day: number;                    // current game day (starts at 1)
  hour: number;                   // 0–23 in-game
  cash: number;
  totalNetWorth: number;
  markets: Record<string, Market>;
  portfolio: Record<string, number>;     // symbol → shares
  economy: EconomicIndicators;
  activeEvents: MarketEvent[];
  completedNarrativeEvents: string[];
  activeNarrativeEventId?: string;
  achievements: Record<string, Achievement>;
  news: NewsItem[];
  notifications: UINotification[];
  relationships: Record<string, number>;  // npcId → relationship score 0–100
  unlockedFeatures: string[];
  settings: GameSettings;
  stats: {
    totalTrades: number;
    profitableTrades: number;
    totalRevenue: number;
    totalExpenses: number;
    contractsSigned: number;
    workersHired: number;
    facilitiesBought: number;
    marketCrashesWeathered: number;
    daysPlayed: number;
  };
  isPaused: boolean;
  isGameOver: boolean;
  gameOverReason?: string;
  createdAt: number;              // real timestamp
  lastSavedAt: number;            // real timestamp
}

export interface SaveSlot {
  slotId: number;
  isOccupied: boolean;
  characterId?: string;
  characterName?: string;
  companyName?: string;
  day?: number;
  netWorth?: number;
  lastSavedAt?: number;
  screenshotPath?: string;
}

// ─── News & Notifications ─────────────────────────────────────

export interface NewsItem {
  id: string;
  title: string;
  body: string;
  source: string;
  severity: NewsSeverity;
  category: ProductCategory | "general" | "political" | "social";
  publishedOn: number;            // game day
  expiresOn: number;
  affectedProductIds: string[];
  priceHint?: "up" | "down" | "volatile";
  isRead: boolean;
  isPlayerTriggered: boolean;
}

export interface UINotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  icon?: string;
  duration?: number;              // ms, undefined = persistent
  actionLabel?: string;
  actionScene?: SceneName;
  createdAt: number;
  isRead: boolean;
}

// ─── Narrative System ─────────────────────────────────────────

export interface DialogueLine {
  speakerId: string;              // character id or "narrator"
  text: string;
  emotion?: "neutral" | "happy" | "angry" | "worried" | "excited" | "sad" | "suspicious";
  pause?: number;                 // ms before auto-advance, undefined = wait for click
}

export interface Choice {
  id: string;
  label: string;
  description?: string;
  requiresReputation?: number;
  requiresCash?: number;
  requiresLevel?: number;
  isGreyMarket?: boolean;
  consequences: {
    cashDelta?: number;
    reputationDelta?: number;
    esgDelta?: number;
    relationshipDeltas?: Record<string, number>;
    unlockEventId?: string;
    triggerEventId?: string;
    newsItem?: Omit<NewsItem, "id" | "publishedOn" | "expiresOn" | "isRead" | "isPlayerTriggered">;
    narration?: string;
  };
}

export interface NarrativeEvent {
  id: string;
  characterIds: string[];         // which characters can trigger this
  title: string;
  description: string;
  backgroundScene?: SceneName;
  triggerCondition: string;       // JS expression referencing gameState
  priority: number;               // higher = checked first
  isRepeatable: boolean;
  cooldownDays?: number;
  dialogueLines: DialogueLine[];
  choices: Choice[];
  onTrigger?: {
    cashDelta?: number;
    reputationDelta?: number;
    pauseGame?: boolean;
  };
}

// ─── Scene Navigation ─────────────────────────────────────────

export type SceneName =
  | "MainMenu"
  | "CharacterSelect"
  | "GameIntro"
  | "Dashboard"
  | "MarketTrading"
  | "StockExchange"
  | "CompanyManagement"
  | "FacilityManager"
  | "WorkerManager"
  | "ContractOffice"
  | "NewsRoom"
  | "EconomyOverview"
  | "NarrativeEvent"
  | "AchievementsScreen"
  | "SettingsMenu"
  | "SaveLoadMenu"
  | "GameOver"
  | "Credits";

// ─── AI Rival ─────────────────────────────────────────────────

export interface AIRival {
  id: string;
  name: string;
  companyName: string;
  sector: ProductCategory;
  aggressionLevel: number;       // 0–1
  cashReserves: number;
  marketShare: Record<string, number>;  // productId → share 0–1
  reputation: number;
  strategy: "aggressive" | "defensive" | "opportunistic" | "diversified";
  relationships: Record<string, number>;
  lastAction?: string;
  lastActionDay?: number;
}

// ─── Re-exports convenience union ─────────────────────────────

export type AnyOrder = MarketOrder | StockOrder;
export type EntityId = string;
export type GameDay = number;
export type Percentage = number;    // 0–100
export type Multiplier = number;    // e.g. 1.0 = no change
export type Money = number;         // in game currency (NVX Pesos)

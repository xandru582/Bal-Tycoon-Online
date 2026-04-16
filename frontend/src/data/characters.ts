// ============================================================
// NEXUS: Imperio del Mercado — Character Definitions
// ============================================================

import type { Character, DialogueLine, ProductCategory } from "../types";
import { ProductCategory as PC } from "../types";

// ─── Sofia Reyes ─────────────────────────────────────────────

const sofia_intro: DialogueLine[] = [
  {
    speakerId: "sofia",
    text: "Nueva Vista. Llevo años mirando esta ciudad desde una ventana pequeña, viendo cómo otros construían sus imperios mientras yo sobrevivía con lo que tenía. Eso termina hoy.",
    emotion: "determined" as any,
  },
  {
    speakerId: "sofia",
    text: "Mi madre me enseñó a coser, mi tía me enseñó a vender, y la ciudad me enseñó que si no tienes nombre, tienes que fabricarlo. Bien. Empecemos a fabricar.",
    emotion: "excited",
  },
  {
    speakerId: "narrator",
    text: "El Distrito Norte amanece con ruido de obra y olor a café. Los puestos de moda callejera ya están abiertos, y en algún lugar de esa maraña, está la primera oportunidad de Sofia.",
    emotion: "neutral",
  },
  {
    speakerId: "sofia",
    text: "Tengo quince mil pesos, un teléfono con diez mil seguidores y más ambición que capital. En el mundo de la moda, eso no es una desventaja. Es exactamente la historia que la gente quiere escuchar.",
    emotion: "happy",
  },
  {
    speakerId: "sofia",
    text: "Primera regla: en moda, la percepción es la realidad. Segunda regla: yo controlo la percepción. ¿Estás listo para ver cómo funciona?",
    emotion: "excited",
  },
];

const sofia: Character = {
  id: "sofia",
  name: "Sofia Reyes",
  age: 28,
  district: "Distrito Norte",
  sector: PC.Moda,
  tagline: "La imagen lo es todo",
  backstory: `Sofia Reyes creció en el barrio de Las Costureras, un enclave del Distrito Norte donde las familias inmigrantes tejían no solo ropa, sino identidades enteras. Su madre, Carmen, dirigía un pequeño taller de confección que durante años sobrevivió cosiendo uniformes escolares y ropa de trabajo. Sofia aprendió a manejar una máquina de coser antes que una calculadora, y desarrolló desde pequeña un ojo casi sobrenatural para las tendencias, los colores y lo que la gente quería llevar puesto antes de saberlo ellos mismos.

A los diecinueve años, Sofia lanzó su primera colección cápsula con material reciclado del taller de su madre y la fotografió ella misma en las azoteas del Distrito Norte. Las fotos se hicieron virales en redes sociales con un presupuesto de cero pesos. Eso le enseñó la lección más importante de su vida: el relato vende más que el producto. Pasó los años siguientes colaborando con marcas de gama media, construyendo una red de contactos en el mundo de la moda, los medios y el entretenimiento, mientras ahorraba cada centavo para el momento en que pudiera actuar por su cuenta.

Ahora, con veintiocho años y quince mil pesos de ahorros, Sofia está lista para construir algo propio. No una línea de ropa más, sino un universo de marca que abarque moda, medios, eventos y cultura. Sabe que el camino no es fácil: los grandes conglomerados de moda de Nueva Vista no van a ceder terreno sin luchar, y hay rivales con diez veces su capital. Pero Sofia tiene algo que el dinero no puede comprar del todo: autenticidad percibida, una red social activa y la capacidad de convertir cada tropiezo en una historia que sus seguidores adoren.`,
  portrait: "assets/portraits/sofia.png",
  stats: {
    negotiation: 8,
    management: 6,
    tech: 5,
    charisma: 9,
    streetwise: 6,
  },
  starting_cash: 15000,
  starting_sector: "moda",
  special_ability: "Red Social",
  special_ability_description:
    "+20% de reputación en el sector moda cada semana. Las campañas de marketing cuestan un 15% menos. Alta probabilidad de eventos virales que impulsen ventas.",
  special_bonus: {
    moda_rep_bonus: 0.2,
    negotiation_bonus: 0.15,
    viral_chance_bonus: 0.25,
  },
  intro_dialogues: sofia_intro,
  color_primary: "#E91E8C",
  color_secondary: "#FF6EC7",
};

// ─── Marcus Webb ─────────────────────────────────────────────

const marcus_intro: DialogueLine[] = [
  {
    speakerId: "marcus",
    text: "He pasado quince años analizando mercados para que otros se hicieran ricos. Cada modelo que construí, cada predicción que acerté, fue dinero en el bolsillo de alguien más. Eso se acabó.",
    emotion: "neutral",
  },
  {
    speakerId: "marcus",
    text: "El Distrito Financiero de Nueva Vista es una jungla con trajes bien cortados. Conozco las reglas escritas y, más importante, conozco las no escritas. Sé dónde están las grietas.",
    emotion: "suspicious",
  },
  {
    speakerId: "narrator",
    text: "Los rascacielos del Distrito Financiero proyectan sombras largas sobre la avenida principal. En las plantas altas, se toman decisiones que sacuden mercados enteros. Marcus conoce esas plantas.",
    emotion: "neutral",
  },
  {
    speakerId: "marcus",
    text: "Veinticinco mil pesos. Parece poco para este barrio, pero sé exactamente en qué convertirlo. Los mercados son sistemas, y los sistemas tienen patrones. Solo hay que ser suficientemente frío para verlos.",
    emotion: "neutral",
  },
  {
    speakerId: "marcus",
    text: "La gente teme a los mercados porque no los entiende. Yo los temo porque sí los entiendo. Esa diferencia es mi ventaja. Vamos a trabajar.",
    emotion: "determined" as any,
  },
];

const marcus: Character = {
  id: "marcus",
  name: "Marcus Webb",
  age: 35,
  district: "Distrito Financiero",
  sector: PC.Finanzas,
  tagline: "Los números no mienten",
  backstory: `Marcus Webb llegó a Nueva Vista a los veintidós años con un título en matemáticas financieras, una deuda estudiantil considerable y la certeza de que el mercado era un sistema de ecuaciones que podía dominar. Durante los primeros años trabajó en la sala de operaciones de Banco Meridian, procesando órdenes de otros mientras aprendía los ritmos del mercado local. Era extraordinariamente bueno en su trabajo: su tasa de predicción en análisis de riesgos superaba a la de cualquier colega, pero en el mundo de las finanzas, ser bueno en el trabajo de otro no construye fortuna propia.

A los veintiocho años fue contratado como analista senior en Grupo Invictus, el mayor fondo de inversión privado del Distrito Financiero. Allí pasó siete años construyendo modelos cuantitativos que generaron retornos récord para los socios del fondo. Durante la gran corrección del mercado de Nueva Vista de hace tres años, sus modelos fueron los únicos que predijeron correctamente el desplome, salvando al fondo de pérdidas catastróficas. La recompensa fue un bono moderado y un correo de agradecimiento del CEO. No un asiento en la mesa donde se tomaban las decisiones reales.

Esa injusticia enquistada, combinada con una separación personal que lo dejó reflexivo y libre de ataduras, lo llevó a dar el paso que siempre había postergado. Marcus tiene treinta y cinco años, veinticinco mil pesos de capital propio, y un conocimiento del sistema financiero de Nueva Vista que ningún rival puede igualar. Su debilidad es la gente: prefiere los modelos a las conversaciones, los datos a las intuiciones. Pero ha aprendido, a su manera, que los mercados también tienen pulso humano, y está dispuesto a aprenderlo.`,
  portrait: "assets/portraits/marcus.png",
  stats: {
    negotiation: 7,
    management: 9,
    tech: 7,
    charisma: 6,
    streetwise: 5,
  },
  starting_cash: 25000,
  starting_sector: "finanzas",
  special_ability: "Analista Elite",
  special_ability_description:
    "Todas las operaciones de trading tienen un 10% menos de comisiones. Acceso a informes de mercado avanzados cada 3 días. Capacidad de detectar manipulaciones de mercado antes que el resto.",
  special_bonus: {
    trade_fee_reduction: 0.1,
    market_insight_bonus: 0.3,
    credit_rate_bonus: 0.12,
  },
  intro_dialogues: marcus_intro,
  color_primary: "#1565C0",
  color_secondary: "#42A5F5",
};

// ─── Kai Tanaka ──────────────────────────────────────────────

const kai_intro: DialogueLine[] = [
  {
    speakerId: "kai",
    text: "La gente del centro mira al Barrio Sur como un lugar donde las cosas se pudren. Nosotros lo miramos como un lugar donde las cosas empiezan. Hay una diferencia enorme.",
    emotion: "neutral",
  },
  {
    speakerId: "kai",
    text: "Ocho mil pesos. Sí, ocho. Menos de lo que otros tienen en gastos de representación mensuales. Pero yo conozco a las personas correctas, los lugares correctos y los momentos correctos. Eso vale más.",
    emotion: "happy",
  },
  {
    speakerId: "narrator",
    text: "El Barrio Sur despierta con olor a especias y el ruido de puestos callejeros que llevan funcionando desde antes del amanecer. Kai conoce cada rincón, cada vendedor, cada oportunidad escondida.",
    emotion: "neutral",
  },
  {
    speakerId: "kai",
    text: "Empecé vendiendo comida en la secundaria para pagar el bus. Luego aprendí código para automatizar el inventario del restaurante de mi padre. Luego me di cuenta de que la tecnología y la comida son lo mismo: las dos cosas la gente necesita todos los días sin falta.",
    emotion: "excited",
  },
  {
    speakerId: "kai",
    text: "Las reglas están escritas para los que pueden pagarlas. Yo voy a aprender las reglas, voy a respetarlas cuando convenga, y voy a encontrar los atajos cuando no. Bienvenido al Barrio Sur.",
    emotion: "suspicious",
  },
];

const kai: Character = {
  id: "kai",
  name: "Kai Tanaka",
  age: 24,
  district: "Barrio Sur",
  sector: PC.Alimentacion,
  tagline: "Desde abajo se ve todo",
  backstory: `Kai Tanaka es hijo de Hiroshi y Lupe Tanaka, quienes abrieron el restaurante Ramen & Sabores en el Barrio Sur cuando Kai tenía cuatro años. Creció entre la cocina del restaurante y las calles del barrio, desarrollando desde muy joven una doble fluencia: la del emprendedor que sobrevive con márgenes ajustados y la del nativo digital que ve en la tecnología una herramienta de democratización. Con quince años ya gestionaba el sistema de pedidos del restaurante con software que él mismo había parcheado. Con diecisiete, ayudó a tres negocios del barrio a establecer presencia online a cambio de comida y contactos.

El Barrio Sur tiene sus propias redes de distribución, sus propios mercados informales y sus propios códigos. Kai creció en ellos y los conoce mejor que nadie. No le son ajenos los negocios que operan en zonas grises: conoce a los distribuidores que consiguen ingredientes de importación sin pasar por los canales oficiales, a los técnicos que reparan teléfonos sin garantía oficial, a los programadores que trabajan para quien pague mejor sin preguntar mucho. No se enorgullece especialmente de ese mundo, pero tampoco lo juzga. Es parte del ecosistema.

Lo que impulsa a Kai a los veinticuatro años no es el dinero en sí, sino demostrar que el Barrio Sur puede producir algo más que mano de obra barata para el resto de la ciudad. Quiere construir una empresa que combine tecnología con negocios de alimentación, creando cadenas de suministro más eficientes, restaurantes con mejor margen y eventualmente una plataforma de distribución que cambie cómo funciona el sector. Ocho mil pesos es casi nada, pero Kai sabe que el capital social que tiene en el barrio, construido en veinte años de presencia y confianza, no aparece en ningún balance.`,
  portrait: "assets/portraits/kai.png",
  stats: {
    negotiation: 6,
    management: 5,
    tech: 9,
    charisma: 7,
    streetwise: 9,
  },
  starting_cash: 8000,
  starting_sector: "alimentacion",
  special_ability: "Conoce las Calles",
  special_ability_description:
    "Acceso al mercado gris desde el inicio del juego. Costes de producción en alimentación reducidos un 15%. Red de contactos que genera oportunidades exclusivas cada semana.",
  special_bonus: {
    grey_market_access: true,
    alimentacion_rep_bonus: 0.1,
    production_cost_reduction: 0.15,
    employee_morale_bonus: 0.1,
  },
  intro_dialogues: kai_intro,
  color_primary: "#2E7D32",
  color_secondary: "#66BB6A",
};

// ─── Character Registry ───────────────────────────────────────

export const CHARACTERS: Record<string, Character> = {
  sofia,
  marcus,
  kai,
};

// ─── Helper Functions ─────────────────────────────────────────

export function getAllCharacters(): Character[] {
  return Object.values(CHARACTERS);
}

export function getCharacter(id: string): Character | undefined {
  return CHARACTERS[id];
}

export function getCharactersByDistrict(district: string): Character[] {
  return getAllCharacters().filter((c) => c.district === district);
}

export function getCharactersBySector(sector: ProductCategory): Character[] {
  return getAllCharacters().filter((c) => c.sector === sector);
}

export function getStartingBonus(characterId: string): Record<string, number> {
  const char = getCharacter(characterId);
  if (!char) return {};
  const bonus: Record<string, number> = {};
  for (const [key, value] of Object.entries(char.special_bonus)) {
    if (typeof value === "number") {
      bonus[key] = value;
    }
  }
  return bonus;
}

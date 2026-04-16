// ============================================================
// NEXUS: Imperio del Mercado — Game Events System
// 1000+ random events that make the game feel alive
// ============================================================

import { EXTENDED_EVENTS } from './GameEventsCatalog';

// ─── Types ───────────────────────────────────────────────────

export interface EventChoice {
  label: string;
  icon: string;
  effect: {
    creditsMultiplier?: number;
    creditsDelta?: number;
    cpsMultiplier?: number;
    influenceBonus?: number;
    stressDelta?: number;
    happinessDelta?: number;
    durationDays?: number;
  };
  description?: string;
}

export interface GameEventEffect {
  creditsMultiplier?: number;   // e.g. 0.5 = -50% income
  cpsMultiplier?: number;       // e.g. 2.0 = double CPS
  influenceBonus?: number;      // immediate influence delta
  stressDelta?: number;         // immediate stress change
  creditsDelta?: number;        // immediate credits change (can be negative)
  happinessDelta?: number;
}

export type EventType = 'economic' | 'corporate' | 'personal' | 'political' | 'tech';

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: EventType;
  probability: number;   // 0-1 daily probability when eligible
  minDay: number;        // earliest day it can fire
  immediateEffect?: GameEventEffect;
  choices?: EventChoice[];
  duration?: number;     // days the effect lasts (for multipliers)
  // populated at runtime after firing
  firedOnDay?: number;
}

export interface ActiveEffect {
  eventId: string;
  title: string;
  icon: string;
  creditsMultiplier?: number;
  cpsMultiplier?: number;
  expiresOnDay: number;
}

// ─── Event Catalog ────────────────────────────────────────────

const EVENT_CATALOG: GameEvent[] = [

  // ══════════════════════════════════════════════════
  // ECONOMIC EVENTS
  // ══════════════════════════════════════════════════

  {
    id: 'eco_market_crash',
    title: 'Crash del Mercado',
    description: 'Los mercados financieros globales han colapsado repentinamente. El pánico se apodera de los inversores y los valores se desploman. La próxima semana será crítica para tu empresa.',
    icon: '📉',
    type: 'economic',
    probability: 0.003,
    minDay: 30,
    choices: [
      {
        label: 'Vender todo inmediatamente',
        icon: '💸',
        description: 'Liquidar posiciones para preservar capital',
        effect: { creditsDelta: 0, stressDelta: 20, cpsMultiplier: 0.7, durationDays: 14 }
      },
      {
        label: 'Mantener y aguantar',
        icon: '🤜',
        description: 'Confiar en que el mercado se recuperará',
        effect: { stressDelta: 15, cpsMultiplier: 0.5, durationDays: 21 }
      },
      {
        label: 'Comprar en la caída',
        icon: '📈',
        description: 'Inversión contraria de alto riesgo',
        effect: { creditsDelta: -50000, stressDelta: 30, cpsMultiplier: 1.8, durationDays: 30 }
      },
    ]
  },

  {
    id: 'eco_bull_run',
    title: 'Bull Run Económico',
    description: 'Los mercados están en euforia. La confianza del consumidor está por las nubes y los negocios florecen por todas partes. Es el momento perfecto para expandirse.',
    icon: '🐂',
    type: 'economic',
    probability: 0.004,
    minDay: 20,
    choices: [
      {
        label: 'Expandir agresivamente',
        icon: '🚀',
        description: 'Invertir en crecimiento masivo',
        effect: { creditsDelta: -30000, cpsMultiplier: 2.2, durationDays: 20, stressDelta: 10 }
      },
      {
        label: 'Consolidar beneficios',
        icon: '💰',
        description: 'Ahorrar mientras dura la bonanza',
        effect: { creditsMultiplier: 1.5, cpsMultiplier: 1.4, durationDays: 15 }
      },
      {
        label: 'Ignorar y seguir',
        icon: '😐',
        description: 'Mantener el rumbo actual',
        effect: { cpsMultiplier: 1.1, durationDays: 10 }
      },
    ]
  },

  {
    id: 'eco_inflation_spike',
    title: 'Pico de Inflación',
    description: 'La inflación ha alcanzado máximos históricos. Los precios de materias primas se han disparado un 40%. Los costes operativos de todas las empresas aumentan dramáticamente.',
    icon: '🔥',
    type: 'economic',
    probability: 0.004,
    minDay: 15,
    choices: [
      {
        label: 'Subir precios al cliente',
        icon: '💹',
        description: 'Trasladar el coste al consumidor',
        effect: { cpsMultiplier: 0.8, influenceBonus: -10, durationDays: 20 }
      },
      {
        label: 'Absorber el coste',
        icon: '🛡️',
        description: 'Proteger cuota de mercado sacrificando margen',
        effect: { cpsMultiplier: 0.6, influenceBonus: 15, durationDays: 20 }
      },
      {
        label: 'Renegociar contratos de suministro',
        icon: '🤝',
        description: 'Buscar proveedores más baratos',
        effect: { stressDelta: 15, cpsMultiplier: 0.9, durationDays: 10 }
      },
    ]
  },

  {
    id: 'eco_currency_devaluation',
    title: 'Devaluación de Moneda',
    description: 'El gobierno ha devaluado la moneda local un 25%. Las importaciones se encarecen brutalmente pero las exportaciones se vuelven más competitivas en mercados extranjeros.',
    icon: '💱',
    type: 'economic',
    probability: 0.003,
    minDay: 25,
    choices: [
      {
        label: 'Pivota a exportaciones',
        icon: '✈️',
        description: 'Aprovechar la ventaja competitiva exterior',
        effect: { cpsMultiplier: 1.6, stressDelta: 20, influenceBonus: 20, durationDays: 30 }
      },
      {
        label: 'Centrarse en mercado local',
        icon: '🏠',
        description: 'Evitar la exposición a divisas',
        effect: { cpsMultiplier: 0.85, durationDays: 15 }
      },
      {
        label: 'Cobertura de divisas',
        icon: '🔒',
        description: 'Protegerte con instrumentos financieros',
        effect: { creditsDelta: -20000, cpsMultiplier: 1.0, stressDelta: 5, durationDays: 20 }
      },
    ]
  },

  {
    id: 'eco_trade_war',
    title: 'Guerra Comercial',
    description: 'Dos grandes potencias económicas han iniciado una guerra de aranceles. Las cadenas de suministro globales están en caos. Los mercados se fragmentan por zonas geopolíticas.',
    icon: '⚔️',
    type: 'economic',
    probability: 0.003,
    minDay: 40,
    choices: [
      {
        label: 'Aprovechar el vacío de mercado',
        icon: '🎯',
        description: 'Tus rivales pierden mercado, tú ganas',
        effect: { influenceBonus: 30, cpsMultiplier: 1.4, stressDelta: 25, durationDays: 25 }
      },
      {
        label: 'Diversificar geografías',
        icon: '🌍',
        description: 'Reducir exposición a zonas afectadas',
        effect: { creditsDelta: -15000, cpsMultiplier: 1.1, durationDays: 20 }
      },
      {
        label: 'Lobby político',
        icon: '🏛️',
        description: 'Pagar para conseguir excepciones arancelarias',
        effect: { creditsDelta: -40000, cpsMultiplier: 1.25, influenceBonus: 25, durationDays: 30 }
      },
    ]
  },

  {
    id: 'eco_recession_signal',
    title: 'Señales de Recesión',
    description: 'Los indicadores macroeconómicos alertan de una posible recesión. El consumo cae, los inversores están nerviosos y los bancos restringen el crédito.',
    icon: '⚠️',
    type: 'economic',
    probability: 0.004,
    minDay: 35,
    choices: [
      {
        label: 'Reducir gastos drásticamente',
        icon: '✂️',
        description: 'Modo supervivencia: recorta todo lo no esencial',
        effect: { cpsMultiplier: 0.75, stressDelta: 20, durationDays: 30 }
      },
      {
        label: 'Inversión anticíclica',
        icon: '💡',
        description: 'Cuando otros retroceden, tú avanzas',
        effect: { creditsDelta: -60000, cpsMultiplier: 1.3, stressDelta: 35, durationDays: 40 }
      },
    ]
  },

  {
    id: 'eco_oil_shock',
    title: 'Crisis Energética',
    description: 'Un conflicto regional ha disparado el precio de la energía un 300%. Las empresas industriales y logísticas sufren un golpe devastador. El teletrabajo cobra nueva relevancia.',
    icon: '⛽',
    type: 'economic',
    probability: 0.003,
    minDay: 20,
    choices: [
      {
        label: 'Invertir en energías renovables',
        icon: '♻️',
        description: 'Transición energética costosa pero estratégica',
        effect: { creditsDelta: -80000, cpsMultiplier: 1.5, influenceBonus: 30, durationDays: 60 }
      },
      {
        label: 'Reducir consumo energético',
        icon: '💡',
        description: 'Eficiencia operativa para sobrevivir',
        effect: { cpsMultiplier: 0.7, stressDelta: 15, durationDays: 25 }
      },
      {
        label: 'Trasladar costes a clientes',
        icon: '💸',
        description: 'Que paguen el extra de energía',
        effect: { cpsMultiplier: 0.9, influenceBonus: -15, durationDays: 20 }
      },
    ]
  },

  // ══════════════════════════════════════════════════
  // CORPORATE EVENTS
  // ══════════════════════════════════════════════════

  {
    id: 'corp_data_breach',
    title: 'Brecha de Seguridad',
    description: 'Hackers han comprometido los sistemas de tu empresa. Datos sensibles de clientes están en la red oscura. La prensa está cubriendo el incidente. Tu reputación está en juego.',
    icon: '🔓',
    type: 'corporate',
    probability: 0.005,
    minDay: 15,
    choices: [
      {
        label: 'Transparencia total pública',
        icon: '📢',
        description: 'Comunicado honesto y plan de acción',
        effect: { creditsDelta: -25000, stressDelta: 30, influenceBonus: -10, cpsMultiplier: 0.85, durationDays: 14 }
      },
      {
        label: 'Tapar y silenciar',
        icon: '🤫',
        description: 'Pagar para que no salga en prensa',
        effect: { creditsDelta: -50000, stressDelta: 15, cpsMultiplier: 0.95, durationDays: 7 }
      },
      {
        label: 'Contratar expertos en ciberseguridad',
        icon: '🛡️',
        description: 'Blindar la empresa para el futuro',
        effect: { creditsDelta: -35000, stressDelta: 20, cpsMultiplier: 1.1, durationDays: 30 }
      },
    ]
  },

  {
    id: 'corp_viral_product',
    title: 'Producto Viral',
    description: '¡Tu último lanzamiento ha explotado en redes sociales! Millones de usuarios hablan de él. Los pedidos se han multiplicado por 10 en las últimas 48 horas. ¿Cómo respondes?',
    icon: '🔥',
    type: 'corporate',
    probability: 0.005,
    minDay: 20,
    choices: [
      {
        label: 'Escalar producción máximo',
        icon: '🏭',
        description: 'Satisfacer la demanda a toda costa',
        effect: { creditsDelta: -40000, cpsMultiplier: 3.0, stressDelta: 35, influenceBonus: 40, durationDays: 21 }
      },
      {
        label: 'Crear escasez artificial',
        icon: '💎',
        description: 'Limitar supply para aumentar valor percibido',
        effect: { cpsMultiplier: 2.0, influenceBonus: 50, stressDelta: 10, durationDays: 14 }
      },
      {
        label: 'Monetizar con edición premium',
        icon: '⭐',
        description: 'Lanzar versión de lujo del producto viral',
        effect: { creditsDelta: 80000, cpsMultiplier: 1.8, influenceBonus: 30, durationDays: 18 }
      },
    ]
  },

  {
    id: 'corp_government_contract',
    title: 'Contrato Gubernamental',
    description: 'El gobierno de Nueva Vista ha publicado una licitación exclusiva. El contrato incluye suministro para toda la administración pública durante 3 años. Es tu mayor oportunidad.',
    icon: '🏛️',
    type: 'corporate',
    probability: 0.004,
    minDay: 30,
    choices: [
      {
        label: 'Presentar oferta competitiva',
        icon: '📋',
        description: 'Precio bajo para ganar el contrato',
        effect: { creditsDelta: 150000, cpsMultiplier: 1.4, stressDelta: 25, influenceBonus: 50, durationDays: 45 }
      },
      {
        label: 'Oferta premium, máxima calidad',
        icon: '💎',
        description: 'Precio alto pero servicio excepcional',
        effect: { creditsDelta: 80000, cpsMultiplier: 1.6, influenceBonus: 70, stressDelta: 15, durationDays: 45 }
      },
      {
        label: 'Declinar la licitación',
        icon: '🚫',
        description: 'Evitar dependencia del sector público',
        effect: { stressDelta: -10, happinessDelta: 5 }
      },
    ]
  },

  {
    id: 'corp_acquisition_offer',
    title: 'Oferta de Adquisición',
    description: 'Un consorcio de inversores internacionales quiere comprar el 30% de tu empresa. La valoración propuesta es generosa pero implicaría ceder control y compartir decisiones estratégicas.',
    icon: '🤝',
    type: 'corporate',
    probability: 0.003,
    minDay: 50,
    choices: [
      {
        label: 'Aceptar la inversión',
        icon: '✅',
        description: 'Capital fresco y conexiones globales',
        effect: { creditsDelta: 500000, cpsMultiplier: 1.5, stressDelta: 10, influenceBonus: 80, durationDays: 60 }
      },
      {
        label: 'Negociar mejores términos',
        icon: '🔄',
        description: 'Contraoferta con más control para ti',
        effect: { creditsDelta: 300000, cpsMultiplier: 1.3, stressDelta: 20, influenceBonus: 60, durationDays: 40 }
      },
      {
        label: 'Rechazar la oferta',
        icon: '❌',
        description: 'Mantener el control absoluto de la empresa',
        effect: { influenceBonus: -20, stressDelta: 5, cpsMultiplier: 1.05, durationDays: 10 }
      },
    ]
  },

  {
    id: 'corp_key_employee_leaves',
    title: 'Fuga de Talento',
    description: 'Tu director de operaciones más valioso ha recibido una oferta irrechazable de un rival. Se lleva consigo conocimiento crítico y parte de tu red de contactos.',
    icon: '🚶',
    type: 'corporate',
    probability: 0.005,
    minDay: 20,
    choices: [
      {
        label: 'Contraoferta económica agresiva',
        icon: '💰',
        description: 'Retenerle a cualquier precio',
        effect: { creditsDelta: -30000, cpsMultiplier: 1.1, stressDelta: 10, durationDays: 20 }
      },
      {
        label: 'Dejarle ir con elegancia',
        icon: '🕊️',
        description: 'Mantener buenas relaciones para el futuro',
        effect: { cpsMultiplier: 0.75, stressDelta: 20, influenceBonus: 10, durationDays: 15 }
      },
      {
        label: 'Contratar headhunter premium',
        icon: '🎯',
        description: 'Sustituirle con alguien mejor',
        effect: { creditsDelta: -50000, cpsMultiplier: 1.2, stressDelta: 30, durationDays: 25 }
      },
    ]
  },

  {
    id: 'corp_whistleblower',
    title: 'Denunciante Interno',
    description: 'Un empleado descontento ha filtrado información sobre prácticas cuestionables de la empresa a los medios. Los periodistas ya están haciendo preguntas incómodas.',
    icon: '📰',
    type: 'corporate',
    probability: 0.003,
    minDay: 25,
    choices: [
      {
        label: 'Cooperar con la investigación',
        icon: '🤲',
        description: 'Transparencia y reforma interna',
        effect: { creditsDelta: -20000, stressDelta: 25, influenceBonus: 15, cpsMultiplier: 0.9, durationDays: 20 }
      },
      {
        label: 'Contratar abogados agresivos',
        icon: '⚖️',
        description: 'Silenciar la historia legalmente',
        effect: { creditsDelta: -60000, stressDelta: 15, cpsMultiplier: 0.95, durationDays: 10 }
      },
      {
        label: 'Despedir al denunciante',
        icon: '🔥',
        description: 'Acción draconiana pero rápida',
        effect: { creditsDelta: -10000, stressDelta: 10, influenceBonus: -30, cpsMultiplier: 0.8, durationDays: 14 }
      },
    ]
  },

  {
    id: 'corp_merger_opportunity',
    title: 'Oportunidad de Fusión',
    description: 'Una empresa complementaria a la tuya está en dificultades. Su CEO busca una fusión que salve a sus empleados y combine las fortalezas de ambas organizaciones.',
    icon: '🔗',
    type: 'corporate',
    probability: 0.003,
    minDay: 45,
    choices: [
      {
        label: 'Fusión total, control compartido',
        icon: '🤝',
        description: 'Unión de fuerzas al 50%',
        effect: { creditsDelta: -100000, cpsMultiplier: 1.9, influenceBonus: 60, stressDelta: 30, durationDays: 50 }
      },
      {
        label: 'Adquirir sus activos clave',
        icon: '🎯',
        description: 'Comprar solo lo que te interesa',
        effect: { creditsDelta: -80000, cpsMultiplier: 1.4, influenceBonus: 30, stressDelta: 15, durationDays: 30 }
      },
      {
        label: 'Rechazar con asesores',
        icon: '🚪',
        description: 'No es el momento ni la empresa adecuada',
        effect: { stressDelta: -5 }
      },
    ]
  },

  // ══════════════════════════════════════════════════
  // PERSONAL EVENTS
  // ══════════════════════════════════════════════════

  {
    id: 'pers_health_crisis',
    title: 'Crisis de Salud',
    description: 'El estrés acumulado te ha pasado factura. El médico recomienda reposo absoluto durante dos semanas. Continuar al mismo ritmo podría tener consecuencias graves para tu salud.',
    icon: '🏥',
    type: 'personal',
    probability: 0.004,
    minDay: 20,
    choices: [
      {
        label: 'Seguir el consejo médico',
        icon: '🛌',
        description: 'Descanso forzado pero necesario',
        effect: { cpsMultiplier: 0.5, stressDelta: -40, happinessDelta: 15, durationDays: 14 }
      },
      {
        label: 'Ignorar al médico',
        icon: '💪',
        description: 'El negocio no puede parar',
        effect: { stressDelta: 30, cpsMultiplier: 0.85, durationDays: 20 }
      },
      {
        label: 'Tratamiento privado premium',
        icon: '💊',
        description: 'El mejor tratamiento posible para recuperarte rápido',
        effect: { creditsDelta: -50000, stressDelta: -25, happinessDelta: 20, cpsMultiplier: 0.7, durationDays: 7 }
      },
    ]
  },

  {
    id: 'pers_luxury_opportunity',
    title: 'Villa en las Islas',
    description: 'Un contacto te ofrece una villa exclusiva en las Islas Doradas de Nueva Vista a precio de mercado. Solo disponible 48 horas. Una oportunidad única para el estatus y el estilo de vida.',
    icon: '🏝️',
    type: 'personal',
    probability: 0.004,
    minDay: 30,
    choices: [
      {
        label: 'Comprar la villa',
        icon: '🏡',
        description: 'Lujo, estatus y felicidad garantizada',
        effect: { creditsDelta: -250000, happinessDelta: 30, influenceBonus: 50, stressDelta: -20 }
      },
      {
        label: 'Alquilarla primero',
        icon: '🔑',
        description: 'Probar antes de comprometerte',
        effect: { creditsDelta: -10000, happinessDelta: 10, stressDelta: -10 }
      },
      {
        label: 'Declinar, enfocar en el negocio',
        icon: '💼',
        description: 'Las prioridades son claras',
        effect: { stressDelta: 5 }
      },
    ]
  },

  {
    id: 'pers_family_emergency',
    title: 'Emergencia Familiar',
    description: 'Un familiar cercano necesita atención médica urgente en el extranjero. Los costes son enormes y la situación emocional es muy difícil. El negocio tendrá que esperar.',
    icon: '👨‍👩‍👧',
    type: 'personal',
    probability: 0.004,
    minDay: 15,
    choices: [
      {
        label: 'Pagar todo sin mirar el coste',
        icon: '❤️',
        description: 'La familia es lo primero',
        effect: { creditsDelta: -80000, stressDelta: 10, happinessDelta: 25, cpsMultiplier: 0.75, durationDays: 14 }
      },
      {
        label: 'Buscar soluciones equilibradas',
        icon: '⚖️',
        description: 'Atender la emergencia sin arruinarse',
        effect: { creditsDelta: -30000, stressDelta: 25, cpsMultiplier: 0.85, durationDays: 10 }
      },
      {
        label: 'Delegar a equipo y atender personalmente',
        icon: '📞',
        description: 'Gestionar el negocio a distancia',
        effect: { stressDelta: 35, cpsMultiplier: 0.65, durationDays: 14 }
      },
    ]
  },

  {
    id: 'pers_mentor_opportunity',
    title: 'Mentor Legendario',
    description: 'Carlos Mendoza, el inversor más legendario de Nueva Vista, ha solicitado reunirse contigo. Podría convertirse en tu mentor. Una relación así vale más que cualquier capital.',
    icon: '🧓',
    type: 'personal',
    probability: 0.004,
    minDay: 25,
    choices: [
      {
        label: 'Aceptar el mentoring',
        icon: '🎓',
        description: 'Sabiduría priceless del mejor del sector',
        effect: { cpsMultiplier: 1.35, influenceBonus: 60, happinessDelta: 20, stressDelta: -15, durationDays: 30 }
      },
      {
        label: 'Proponer colaboración de negocio',
        icon: '🤝',
        description: 'Convertirlo en socio estratégico',
        effect: { creditsDelta: 100000, cpsMultiplier: 1.2, influenceBonus: 40, durationDays: 25 }
      },
      {
        label: 'Declinar por falta de tiempo',
        icon: '🚫',
        description: 'Demasiado ocupado para más compromisos',
        effect: { stressDelta: -5 }
      },
    ]
  },

  {
    id: 'pers_burnout_warning',
    title: 'Al Límite del Burnout',
    description: 'Tu psicólogo de empresa te advierte: estás al borde del colapso. Necesitas hacer cambios profundos en tu estilo de trabajo o las consecuencias serán severas.',
    icon: '🧠',
    type: 'personal',
    probability: 0.005,
    minDay: 30,
    choices: [
      {
        label: 'Retiro de bienestar completo',
        icon: '🧘',
        description: 'Una semana de desconexión total',
        effect: { creditsDelta: -15000, stressDelta: -50, happinessDelta: 35, cpsMultiplier: 0.6, durationDays: 7 }
      },
      {
        label: 'Delegar más responsabilidades',
        icon: '📋',
        description: 'Redistribuir carga de trabajo',
        effect: { creditsDelta: -20000, stressDelta: -20, cpsMultiplier: 0.9, durationDays: 15 }
      },
      {
        label: 'Ignorarlo, seguir trabajando',
        icon: '☕',
        description: 'Café, determinación y nada más',
        effect: { stressDelta: 40, cpsMultiplier: 1.1, durationDays: 14 }
      },
    ]
  },

  {
    id: 'pers_yacht_party',
    title: 'Fiesta en el Yate',
    description: 'La élite empresarial de Nueva Vista te ha invitado a una exclusiva fiesta en yate. Es la oportunidad perfecta para hacer contactos de alto nivel… o simplemente disfrutar.',
    icon: '⛵',
    type: 'personal',
    probability: 0.005,
    minDay: 20,
    choices: [
      {
        label: 'Ir y hacer networking intensivo',
        icon: '🍾',
        description: 'Trabajar la sala para conseguir contactos',
        effect: { creditsDelta: -5000, influenceBonus: 45, happinessDelta: 15, stressDelta: 5 }
      },
      {
        label: 'Ir y desconectar completamente',
        icon: '🌅',
        description: 'Solo disfrutar de la fiesta',
        effect: { creditsDelta: -5000, stressDelta: -25, happinessDelta: 30 }
      },
      {
        label: 'Declinar, demasiado trabajo',
        icon: '💼',
        description: 'El trabajo no espera',
        effect: { stressDelta: 10, happinessDelta: -5 }
      },
    ]
  },

  // ══════════════════════════════════════════════════
  // POLITICAL EVENTS
  // ══════════════════════════════════════════════════

  {
    id: 'pol_new_regulations',
    title: 'Nueva Regulación Sectorial',
    description: 'El Ministerio de Economía de Nueva Vista ha aprobado una regulación que afecta directamente a tu sector. Cumplir con ella requiere inversión pero también crea barreras para nuevos competidores.',
    icon: '📜',
    type: 'political',
    probability: 0.004,
    minDay: 20,
    choices: [
      {
        label: 'Cumplir rápidamente, ventaja competitiva',
        icon: '⚡',
        description: 'Ser el primero en cumplir la norma',
        effect: { creditsDelta: -40000, cpsMultiplier: 1.3, influenceBonus: 35, durationDays: 40 }
      },
      {
        label: 'Cumplimiento mínimo gradual',
        icon: '🐢',
        description: 'Adaptarse poco a poco sin grandes costes',
        effect: { creditsDelta: -15000, cpsMultiplier: 1.0, stressDelta: 10, durationDays: 20 }
      },
      {
        label: 'Lobby para modificar la ley',
        icon: '🏛️',
        description: 'Intentar que la ley se adapte a ti',
        effect: { creditsDelta: -60000, influenceBonus: 25, stressDelta: 15, durationDays: 25 }
      },
    ]
  },

  {
    id: 'pol_tax_increase',
    title: 'Subida de Impuestos Corporativos',
    description: 'El gobierno ha aprobado una subida del impuesto de sociedades del 8%. El impacto en el flujo de caja será inmediato. Los partidos de oposición prometen revertirlo si ganan las elecciones.',
    icon: '💸',
    type: 'political',
    probability: 0.004,
    minDay: 30,
    choices: [
      {
        label: 'Reestructurar holding fiscal',
        icon: '🔄',
        description: 'Optimización fiscal legal internacional',
        effect: { creditsDelta: -30000, cpsMultiplier: 0.95, stressDelta: 20, durationDays: 30 }
      },
      {
        label: 'Asumir el coste, no moverse',
        icon: '🧱',
        description: 'Pagar y seguir adelante',
        effect: { cpsMultiplier: 0.82, durationDays: 20 }
      },
      {
        label: 'Acelerar desgravaciones e inversiones',
        icon: '📊',
        description: 'Usar deducciones para compensar',
        effect: { creditsDelta: -50000, cpsMultiplier: 1.05, influenceBonus: 10, durationDays: 25 }
      },
    ]
  },

  {
    id: 'pol_diplomatic_incident',
    title: 'Incidente Diplomático',
    description: 'Un escándalo político entre dos países socios afecta directamente a tus acuerdos comerciales internacionales. Embajadas cerradas, contratos congelados y total incertidumbre.',
    icon: '🌍',
    type: 'political',
    probability: 0.003,
    minDay: 25,
    choices: [
      {
        label: 'Activar plan de contingencia',
        icon: '🚨',
        description: 'Proteger los activos existentes',
        effect: { creditsDelta: -20000, cpsMultiplier: 0.85, stressDelta: 20, durationDays: 15 }
      },
      {
        label: 'Explorar mercados alternativos',
        icon: '🗺️',
        description: 'Pivota a nuevas geografías rápidamente',
        effect: { creditsDelta: -35000, cpsMultiplier: 1.15, influenceBonus: 20, durationDays: 25 }
      },
      {
        label: 'Esperar que se resuelva',
        icon: '⏳',
        description: 'Los diplomáticos lo arreglarán',
        effect: { cpsMultiplier: 0.78, stressDelta: 15, durationDays: 18 }
      },
    ]
  },

  {
    id: 'pol_election_results',
    title: 'Cambio de Gobierno',
    description: 'Las elecciones han producido un cambio de gobierno sorpresivo. El nuevo partido tiene una agenda económica completamente diferente: más intervencionismo y nuevas oportunidades en sectores estratégicos.',
    icon: '🗳️',
    type: 'political',
    probability: 0.003,
    minDay: 40,
    choices: [
      {
        label: 'Alinearse con el nuevo gobierno',
        icon: '🤝',
        description: 'Adaptarte rápidamente al nuevo contexto',
        effect: { creditsDelta: -20000, cpsMultiplier: 1.25, influenceBonus: 40, stressDelta: 15, durationDays: 30 }
      },
      {
        label: 'Mantener perfil bajo, esperar',
        icon: '🔇',
        description: 'Neutralidad hasta ver cómo evoluciona',
        effect: { stressDelta: 10, durationDays: 15 }
      },
      {
        label: 'Financiar think-tank de presión',
        icon: '🏫',
        description: 'Influir en la agenda del nuevo gobierno',
        effect: { creditsDelta: -45000, influenceBonus: 70, stressDelta: 20, durationDays: 45 }
      },
    ]
  },

  {
    id: 'pol_subsidy_program',
    title: 'Programa de Subsidios',
    description: 'El gobierno lanza un ambicioso programa de subvenciones para empresas del sector tecnológico y de innovación. Las solicitudes se cierran en 72 horas. La competencia es feroz.',
    icon: '🏦',
    type: 'political',
    probability: 0.004,
    minDay: 25,
    choices: [
      {
        label: 'Solicitar subsidio máximo',
        icon: '📝',
        description: 'Maximizar el capital obtenido',
        effect: { creditsDelta: 120000, cpsMultiplier: 1.3, stressDelta: 15, influenceBonus: 20, durationDays: 30 }
      },
      {
        label: 'Subsidio moderado, menos burocracia',
        icon: '✍️',
        description: 'Menos dinero pero trámite más simple',
        effect: { creditsDelta: 50000, cpsMultiplier: 1.1, durationDays: 20 }
      },
      {
        label: 'No solicitar, evitar dependencia',
        icon: '🦅',
        description: 'Independencia del Estado a toda costa',
        effect: { influenceBonus: 10, stressDelta: -5 }
      },
    ]
  },

  // ══════════════════════════════════════════════════
  // TECH EVENTS
  // ══════════════════════════════════════════════════

  {
    id: 'tech_breakthrough',
    title: 'Avance Tecnológico Propio',
    description: 'Tu equipo de I+D ha logrado un avance inesperado. Una nueva tecnología propietaria podría revolucionar tus procesos productivos y darte una ventaja competitiva masiva sobre los rivales.',
    icon: '🔬',
    type: 'tech',
    probability: 0.004,
    minDay: 30,
    choices: [
      {
        label: 'Patentar y explotar internamente',
        icon: '🔒',
        description: 'Ventaja exclusiva durante años',
        effect: { creditsDelta: -30000, cpsMultiplier: 2.0, influenceBonus: 50, stressDelta: 20, durationDays: 40 }
      },
      {
        label: 'Licenciar a otras empresas',
        icon: '📜',
        description: 'Ingresos pasivos de la tecnología',
        effect: { creditsDelta: 80000, cpsMultiplier: 1.3, influenceBonus: 35, durationDays: 30 }
      },
      {
        label: 'Open source para ganar reputación',
        icon: '🌐',
        description: 'Liderazgo de mercado por reputación',
        effect: { influenceBonus: 100, cpsMultiplier: 1.4, happinessDelta: 20, durationDays: 35 }
      },
    ]
  },

  {
    id: 'tech_competitor_launch',
    title: 'Lanzamiento Rival Devastador',
    description: 'Un competidor acaba de presentar un producto que hace obsoleto directamente el tuyo. La prensa lo llama "el asesino de [tu producto]". Tus clientes están evaluando pasarse.',
    icon: '⚡',
    type: 'tech',
    probability: 0.005,
    minDay: 25,
    choices: [
      {
        label: 'Respuesta inmediata: superar el rival',
        icon: '🚀',
        description: 'Acelerar tu roadmap de producto',
        effect: { creditsDelta: -60000, cpsMultiplier: 1.6, stressDelta: 35, durationDays: 25 }
      },
      {
        label: 'Bajar precios agresivamente',
        icon: '💲',
        description: 'Competir en precio, no en features',
        effect: { cpsMultiplier: 0.85, influenceBonus: -10, durationDays: 20 }
      },
      {
        label: 'Pivotar a nicho diferente',
        icon: '🎯',
        description: 'Buscar un mercado donde no compitan directamente',
        effect: { creditsDelta: -25000, cpsMultiplier: 1.1, stressDelta: 20, durationDays: 30 }
      },
    ]
  },

  {
    id: 'tech_patent_dispute',
    title: 'Disputa de Patentes',
    description: 'Un gigante tecnológico te ha demandado alegando que tu producto infringe 3 de sus patentes. Los abogados advierten que el caso podría durar años y costar millones.',
    icon: '⚖️',
    type: 'tech',
    probability: 0.004,
    minDay: 30,
    choices: [
      {
        label: 'Litigar con todo',
        icon: '🏛️',
        description: 'Defender tu tecnología hasta el final',
        effect: { creditsDelta: -80000, cpsMultiplier: 0.9, stressDelta: 35, influenceBonus: 20, durationDays: 40 }
      },
      {
        label: 'Acuerdo extrajudicial',
        icon: '🤝',
        description: 'Pagar y seguir adelante',
        effect: { creditsDelta: -120000, stressDelta: 15, cpsMultiplier: 1.05, durationDays: 10 }
      },
      {
        label: 'Diseño alternativo para eludir patentes',
        icon: '🔧',
        description: 'Rediseñar el producto para evitar el problema',
        effect: { creditsDelta: -40000, stressDelta: 25, cpsMultiplier: 0.95, durationDays: 20 }
      },
    ]
  },

  {
    id: 'tech_ai_adoption',
    title: 'Revolución de la IA',
    description: 'Una nueva generación de herramientas de inteligencia artificial puede automatizar el 40% de tus procesos. La implementación es cara y disruptiva, pero el potencial es enorme.',
    icon: '🤖',
    type: 'tech',
    probability: 0.004,
    minDay: 35,
    choices: [
      {
        label: 'Implementación total acelerada',
        icon: '⚡',
        description: 'Adoptar IA en toda la organización',
        effect: { creditsDelta: -90000, cpsMultiplier: 2.5, stressDelta: 40, influenceBonus: 45, durationDays: 50 }
      },
      {
        label: 'Piloto en área seleccionada',
        icon: '🔬',
        description: 'Probar antes de escalar',
        effect: { creditsDelta: -20000, cpsMultiplier: 1.4, stressDelta: 15, durationDays: 25 }
      },
      {
        label: 'Esperar a la segunda ola',
        icon: '⏰',
        description: 'Dejar que otros depuren la tecnología',
        effect: { stressDelta: -10, cpsMultiplier: 0.9, durationDays: 15 }
      },
    ]
  },

  {
    id: 'tech_cybersecurity_threat',
    title: 'Amenaza de Ciberseguridad',
    description: 'Los servicios de inteligencia alertan de un grupo de hackers organizados que está atacando sistemáticamente empresas del sector. Ya han atacado a dos de tus rivales con éxito.',
    icon: '🛡️',
    type: 'tech',
    probability: 0.005,
    minDay: 20,
    choices: [
      {
        label: 'Inversión total en ciberseguridad',
        icon: '🔐',
        description: 'Blindaje total de sistemas',
        effect: { creditsDelta: -50000, cpsMultiplier: 1.05, stressDelta: -10, influenceBonus: 15, durationDays: 30 }
      },
      {
        label: 'Seguro cibernético',
        icon: '📋',
        description: 'Transferir el riesgo a un seguro',
        effect: { creditsDelta: -10000, stressDelta: -5 }
      },
      {
        label: 'Confiar en protecciones básicas',
        icon: '🤞',
        description: 'Puede que no os afecte',
        effect: { stressDelta: 5 }
      },
    ]
  },

  {
    id: 'tech_server_outage',
    title: 'Caída de Servidores',
    description: 'Una falla catastrófica en tus centros de datos ha dejado todos los servicios offline. Los clientes están furiosos, la prensa cubre el incidente y cada minuto supone pérdidas masivas.',
    icon: '💥',
    type: 'tech',
    probability: 0.006,
    minDay: 10,
    choices: [
      {
        label: 'Equipo de emergencia 24/7',
        icon: '🚨',
        description: 'Restaurar en horas a cualquier coste',
        effect: { creditsDelta: -30000, stressDelta: 30, cpsMultiplier: 0.4, durationDays: 3 }
      },
      {
        label: 'Migrar a cloud de emergencia',
        icon: '☁️',
        description: 'Mover servicios a infraestructura alternativa',
        effect: { creditsDelta: -50000, stressDelta: 20, cpsMultiplier: 0.7, durationDays: 5 }
      },
      {
        label: 'Comunicación honesta y esperar',
        icon: '📢',
        description: 'Transparencia con los clientes mientras se resuelve',
        effect: { creditsDelta: -5000, stressDelta: 40, influenceBonus: -20, cpsMultiplier: 0.3, durationDays: 7 }
      },
    ]
  },

  {
    id: 'tech_unicorn_investor',
    title: 'Interés de Fondo de Capital Riesgo',
    description: 'Horizon Ventures, un fondo de capital riesgo de Tier 1, ha evaluado tu empresa y quiere presentarte una propuesta. Pueden catapultarte a otro nivel pero a cambio de equity significativo.',
    icon: '🦄',
    type: 'tech',
    probability: 0.003,
    minDay: 40,
    choices: [
      {
        label: 'Aceptar la inversión de crecimiento',
        icon: '🚀',
        description: 'Capital masivo a cambio de 25% equity',
        effect: { creditsDelta: 750000, cpsMultiplier: 2.0, influenceBonus: 100, stressDelta: 20, durationDays: 60 }
      },
      {
        label: 'Negociar menores términos',
        icon: '🔄',
        description: 'Menos capital, más control',
        effect: { creditsDelta: 300000, cpsMultiplier: 1.5, influenceBonus: 60, stressDelta: 25, durationDays: 40 }
      },
      {
        label: 'Bootstrapping siempre',
        icon: '💪',
        description: 'Independencia total, sin inversores externos',
        effect: { cpsMultiplier: 1.1, influenceBonus: 20, stressDelta: -5 }
      },
    ]
  },

  // ══════════════════════════════════════════════════
  // EXTRA EVENTS (variety and flavor)
  // ══════════════════════════════════════════════════

  {
    id: 'eco_commodity_boom',
    title: 'Auge de Materias Primas',
    description: 'Los precios de las materias primas que usas en producción han caído a mínimos históricos gracias a nuevas reservas descubiertas. Es el momento de comprar en masa y reducir costes.',
    icon: '⛏️',
    type: 'economic',
    probability: 0.004,
    minDay: 20,
    choices: [
      {
        label: 'Comprar reservas estratégicas',
        icon: '🏭',
        description: 'Aprovisionamiento masivo al precio mínimo',
        effect: { creditsDelta: -100000, cpsMultiplier: 1.7, durationDays: 35 }
      },
      {
        label: 'Contrato a largo plazo con proveedor',
        icon: '📋',
        description: 'Asegurar precio bajo durante 6 meses',
        effect: { creditsDelta: -20000, cpsMultiplier: 1.3, durationDays: 50 }
      },
    ]
  },

  {
    id: 'corp_award_ceremony',
    title: 'Premio a la Innovación',
    description: 'Tu empresa ha sido nominada para el Premio Nacional de Innovación Empresarial. La ceremonia es mañana. La visibilidad mediática podría ser enorme para tu marca.',
    icon: '🏆',
    type: 'corporate',
    probability: 0.004,
    minDay: 30,
    choices: [
      {
        label: 'Gala de gala completa, máxima exposición',
        icon: '🎭',
        description: 'Aprovechar al máximo la visibilidad',
        effect: { creditsDelta: -10000, influenceBonus: 60, happinessDelta: 25, cpsMultiplier: 1.2, durationDays: 20 }
      },
      {
        label: 'Asistir discretamente',
        icon: '👔',
        description: 'Presencia sin ostentación',
        effect: { influenceBonus: 30, happinessDelta: 10, cpsMultiplier: 1.1, durationDays: 15 }
      },
      {
        label: 'Enviar representante',
        icon: '👤',
        description: 'No puedes ir personalmente',
        effect: { influenceBonus: 15 }
      },
    ]
  },

  {
    id: 'pol_anti_corruption_drive',
    title: 'Operación Anticorrupción',
    description: 'La fiscalía ha lanzado una mega-operación anticorrupción que afecta a varios sectores industriales. Aunque tu empresa es limpia, la investigación genera incertidumbre y suspicacias.',
    icon: '🔍',
    type: 'political',
    probability: 0.003,
    minDay: 20,
    choices: [
      {
        label: 'Auditoría externa voluntaria',
        icon: '✅',
        description: 'Demostrar transparencia proactivamente',
        effect: { creditsDelta: -15000, influenceBonus: 30, stressDelta: 15, cpsMultiplier: 1.05, durationDays: 20 }
      },
      {
        label: 'Silencio y bajo perfil',
        icon: '🤫',
        description: 'No llamar la atención',
        effect: { stressDelta: 20, cpsMultiplier: 0.92, durationDays: 14 }
      },
    ]
  },

  {
    id: 'tech_social_media_crisis',
    title: 'Crisis en Redes Sociales',
    description: 'Un influencer con 10 millones de seguidores ha publicado un video viral criticando duramente tu empresa. En 6 horas el hashtag #Boicot llegó al trending. La reputación se desmorona.',
    icon: '📱',
    type: 'tech',
    probability: 0.005,
    minDay: 15,
    choices: [
      {
        label: 'Respuesta oficial rápida y humana',
        icon: '💬',
        description: 'Gestión de crisis con empatía',
        effect: { stressDelta: 20, cpsMultiplier: 0.75, influenceBonus: 10, durationDays: 10 }
      },
      {
        label: 'Contratar influencer mayor para contrarrestar',
        icon: '⭐',
        description: 'Combatir fuego con fuego',
        effect: { creditsDelta: -40000, cpsMultiplier: 0.85, stressDelta: 10, durationDays: 14 }
      },
      {
        label: 'Ignorar y esperar que pase',
        icon: '🙈',
        description: 'Las crisis de internet duran 48 horas',
        effect: { stressDelta: 15, cpsMultiplier: 0.65, influenceBonus: -25, durationDays: 12 }
      },
    ]
  },

  {
    id: 'pers_unexpected_inheritance',
    title: 'Herencia Inesperada',
    description: 'Un familiar lejano del que no sabías nada ha fallecido y te ha dejado una herencia sustancial. El dinero llega en buen momento pero la gestión del patrimonio requiere atención.',
    icon: '💌',
    type: 'personal',
    probability: 0.003,
    minDay: 15,
    choices: [
      {
        label: 'Reinvertir en el negocio',
        icon: '💼',
        description: 'Capital fresco para acelerar el crecimiento',
        effect: { creditsDelta: 200000, cpsMultiplier: 1.3, stressDelta: 10, durationDays: 20 }
      },
      {
        label: 'Ahorrar en inversiones seguras',
        icon: '🏦',
        description: 'Diversificar riqueza personal',
        effect: { creditsDelta: 150000, happinessDelta: 15, stressDelta: -10 }
      },
      {
        label: 'Donación benéfica pública',
        icon: '❤️',
        description: 'Imagen positiva y conexiones sociales',
        effect: { creditsDelta: 50000, influenceBonus: 80, happinessDelta: 30 }
      },
    ]
  },

  {
    id: 'eco_crypto_boom',
    title: 'Boom de Criptomonedas',
    description: 'El mercado de activos digitales ha entrado en modo euforia. Las criptomonedas se han multiplicado por 5 en una semana. Todo el mundo habla de hacerse rico rápido.',
    icon: '₿',
    type: 'economic',
    probability: 0.004,
    minDay: 15,
    choices: [
      {
        label: 'Invertir fuerte en cripto',
        icon: '🎰',
        description: 'Alto riesgo, alto potencial',
        effect: { creditsDelta: -50000, cpsMultiplier: 1.8, stressDelta: 30, durationDays: 20 }
      },
      {
        label: 'Posición pequeña de prueba',
        icon: '🧪',
        description: 'Exposición limitada y controlada',
        effect: { creditsDelta: -10000, cpsMultiplier: 1.2, stressDelta: 10, durationDays: 15 }
      },
      {
        label: 'Mantenerse al margen',
        icon: '🚫',
        description: 'No especular con activos volátiles',
        effect: { stressDelta: -5 }
      },
    ]
  },
];

// ─── GameEventsManager ────────────────────────────────────────

export interface GameEventGameState {
  credits: number;
  creditsPerSecond: number;
  influence: number;
  currentDay: number;
  personalManagerStress?: number;
  personalManagerHappiness?: number;
}

export class GameEventsManager {
  private readonly catalog: GameEvent[] = [...EVENT_CATALOG, ...EXTENDED_EVENTS].map(e => ({ ...e }));

  // Track last day each event fired, keyed by event id
  private lastFiredDay: Map<string, number> = new Map();

  // Currently active multiplier effects
  private activeEffects: ActiveEffect[] = [];

  // Events awaiting player choice (fired but not resolved)
  private pendingResolution: Map<string, { event: GameEvent; choiceResult?: GameEventEffect }> = new Map();

  // ─── Core check ──────────────────────────────────────────────

  checkForEvents(day: number, state: GameEventGameState): GameEvent[] {
    // Clean expired active effects
    this.activeEffects = this.activeEffects.filter(e => e.expiresOnDay > day);

    const triggered: GameEvent[] = [];

    for (const event of this.catalog) {
      // Too early
      if (day < event.minDay) continue;

      // Cooldown: 30 days between same event
      const lastFired = this.lastFiredDay.get(event.id);
      if (lastFired !== undefined && day - lastFired < 30) continue;

      // Random check
      if (Math.random() > event.probability) continue;

      // Only one event per check
      triggered.push({ ...event, firedOnDay: day });
      this.lastFiredDay.set(event.id, day);
      break;
    }

    return triggered;
  }

  // ─── Apply a player's choice for an event ────────────────────

  applyEventChoice(
    event: GameEvent,
    choiceIndex: number,
    currentDay: number
  ): { creditsDelta: number; cpsMultiplierDelta: number; influenceBonus: number; stressDelta: number; happinessDelta: number } {
    const choice = event.choices?.[choiceIndex];
    const effect = choice?.effect ?? {};

    const result = {
      creditsDelta: effect.creditsDelta ?? 0,
      cpsMultiplierDelta: 0,
      influenceBonus: effect.influenceBonus ?? 0,
      stressDelta: effect.stressDelta ?? 0,
      happinessDelta: effect.happinessDelta ?? 0,
    };

    // Register active multiplier effect if it has duration
    if (effect.cpsMultiplier !== undefined && effect.durationDays) {
      const activeEff: ActiveEffect = {
        eventId: event.id,
        title: `${event.icon} ${event.title}`,
        icon: event.icon,
        cpsMultiplier: effect.cpsMultiplier,
        expiresOnDay: currentDay + effect.durationDays,
      };
      // Replace any existing effect from same event
      this.activeEffects = this.activeEffects.filter(e => e.eventId !== event.id);
      this.activeEffects.push(activeEff);
      result.cpsMultiplierDelta = effect.cpsMultiplier;
    }

    if (effect.creditsMultiplier !== undefined && effect.durationDays) {
      const activeEff: ActiveEffect = {
        eventId: `${event.id}_credits`,
        title: `${event.icon} ${event.title}`,
        icon: event.icon,
        creditsMultiplier: effect.creditsMultiplier,
        expiresOnDay: currentDay + effect.durationDays,
      };
      this.activeEffects = this.activeEffects.filter(e => e.eventId !== `${event.id}_credits`);
      this.activeEffects.push(activeEff);
    }

    return result;
  }

  // ─── Dismiss without a choice (no consequences) ──────────────

  dismissWithoutChoice(event: GameEvent): void {
    // Event was just closed, no choice made — no effect
    void event;
  }

  // ─── Get combined multipliers from all active effects ─────────

  getActiveEffects(): ActiveEffect[] {
    return [...this.activeEffects];
  }

  getCombinedCpsMultiplier(): number {
    let mult = 1.0;
    for (const eff of this.activeEffects) {
      if (eff.cpsMultiplier !== undefined) {
        mult *= eff.cpsMultiplier;
      }
    }
    return mult;
  }

  getCombinedCreditsMultiplier(): number {
    let mult = 1.0;
    for (const eff of this.activeEffects) {
      if (eff.creditsMultiplier !== undefined) {
        mult *= eff.creditsMultiplier;
      }
    }
    return mult;
  }

  // ─── Force a random event (for timed real-world triggers) ────

  forceRandomEvent(day: number): GameEvent | null {
    // Pick from events that aren't on cooldown and have minDay satisfied
    const eligible = this.catalog.filter(e => {
      if (day < e.minDay) return false;
      const last = this.lastFiredDay.get(e.id);
      return last === undefined || day - last >= 15; // shorter cooldown for forced events
    });
    if (eligible.length === 0) return null;

    // Weighted random: higher probability events are more likely to be picked
    const totalWeight = eligible.reduce((s, e) => s + e.probability, 0);
    let rnd = Math.random() * totalWeight;
    for (const event of eligible) {
      rnd -= event.probability;
      if (rnd <= 0) {
        this.lastFiredDay.set(event.id, day);
        return { ...event, firedOnDay: day };
      }
    }
    // Fallback: pick last eligible
    const picked = eligible[eligible.length - 1];
    this.lastFiredDay.set(picked.id, day);
    return { ...picked, firedOnDay: day };
  }

  // ─── Utility ─────────────────────────────────────────────────

  getEventById(id: string): GameEvent | undefined {
    return this.catalog.find(e => e.id === id);
  }

  getActiveEffectCount(): number {
    return this.activeEffects.length;
  }
}

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, formatNumber, Achievement } from '../stores/gameStore';
import { GlassCard, ProgressBar, Badge } from '../components/ui/GlassCard';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  cyan:          '#f59e0b',
  cyanGlow:      'rgba(245,158,11,0.35)',
  cyanBorder:    'rgba(245,158,11,0.22)',
  cyanSubtle:    'rgba(245,158,11,0.08)',
  purple:        '#8b5cf6',
  purpleGlow:    'rgba(139,92,246,0.35)',
  purpleBorder:  'rgba(139,92,246,0.22)',
  purpleSubtle:  'rgba(139,92,246,0.08)',
  green:         '#10b981',
  greenGlow:     'rgba(16,185,129,0.35)',
  greenSubtle:   'rgba(16,185,129,0.08)',
  gold:          '#fbbf24',
  goldGlow:      'rgba(251,191,36,0.4)',
  goldBorder:    'rgba(251,191,36,0.3)',
  goldSubtle:    'rgba(251,191,36,0.08)',
  orange:        '#f97316',
  red:           '#f43f5e',
  text1:         '#e8edf5',
  text2:         '#8a9ab5',
  text3:         '#4a5568',
  surface:       'rgba(17,24,39,0.82)',
  surfaceHigh:   'rgba(22,30,48,0.92)',
  border:        'rgba(255,255,255,0.08)',
};

// ─── Category metadata ────────────────────────────────────────────────────────
const CATEGORIES: Record<string, { label: string; icon: string; color: string; glow: string }> = {
  all:        { label: 'Todos',       icon: '🏆', color: C.gold,   glow: C.goldGlow   },
  click:      { label: 'Clicker',     icon: '🖱️', color: C.cyan,   glow: C.cyanGlow   },
  income:     { label: 'Ingresos',    icon: '📈', color: C.green,  glow: C.greenGlow  },
  wealth:     { label: 'Riqueza',     icon: '💰', color: C.gold,   glow: C.goldGlow   },
  production: { label: 'Producción',  icon: '⚙️', color: C.orange, glow: 'rgba(255,107,53,0.4)' },
  corporate:  { label: 'Corporativo', icon: '🏢', color: C.purple, glow: C.purpleGlow },
  market:     { label: 'Mercado',     icon: '📊', color: C.cyan,   glow: C.cyanGlow   },
  social:     { label: 'Social',      icon: '🌐', color: '#ff6ef7', glow: 'rgba(255,110,247,0.4)' },
  time:       { label: 'Tiempo',      icon: '🗓️', color: C.text2,  glow: 'rgba(138,154,181,0.4)' },
  secret:     { label: 'Secreto',     icon: '🔒', color: C.red,    glow: 'rgba(244,63,94,0.4)'   },
};

// ─── Rarity config ────────────────────────────────────────────────────────────
// Based on reward tiers — higher reward = rarer
function getRarity(reward: number): { label: string; color: string; glow: string; pct: number } {
  if (reward >= 1e11)  return { label: 'MÍTICO',     color: '#ff6ef7', glow: 'rgba(255,110,247,0.5)', pct: 1   };
  if (reward >= 1e9)   return { label: 'LEGENDARIO', color: C.gold,    glow: C.goldGlow,              pct: 3   };
  if (reward >= 1e7)   return { label: 'ÉPICO',      color: C.orange,  glow: 'rgba(255,107,53,0.5)',  pct: 8   };
  if (reward >= 1e5)   return { label: 'RARO',       color: C.purple,  glow: C.purpleGlow,            pct: 18  };
  if (reward >= 1e3)   return { label: 'INUSUAL',    color: C.cyan,    glow: C.cyanGlow,              pct: 35  };
  return                      { label: 'COMÚN',      color: C.text2,   glow: 'rgba(138,154,181,0.3)', pct: 65  };
}

// ─── Progress helpers ─────────────────────────────────────────────────────────
// Returns { current, max, label } for locked achievements that have numeric milestones
function getProgress(
  id: string,
  ctx: {
    clicks: number; cps: number; total: number; credits: number;
    totalUpgrades: number; uniqueUpgrades: number;
    workers: number; facilities: number; portfolio: number;
    days: number; level: number; contracts: number;
    activeContracts: number; totalContracts: number;
    prestige: number; clubCount: number; experienceCount: number;
    maxInventory: number; partnerSatisfaction: number;
    spiedRivals: number; rivalsTotal: number;
  }
): { current: number; max: number; label: string } | null {
  const p = (cur: number, max: number, label: string) => ({ current: Math.min(cur, max), max, label });
  switch (id) {
    case 'a01': return p(ctx.clicks, 1,       'hacks');
    case 'a02': return p(ctx.clicks, 100,     'hacks');
    case 'a03': return p(ctx.clicks, 1000,    'hacks');
    case 'a04': return p(ctx.clicks, 10000,   'hacks');
    case 'a05': return p(ctx.clicks, 100000,  'hacks');
    case 'a06': return p(ctx.cps, 10,         'Đ/seg');
    case 'a07': return p(ctx.cps, 1000,       'Đ/seg');
    case 'a08': return p(ctx.cps, 100000,     'Đ/seg');
    case 'a09': return p(ctx.cps, 10000000,   'Đ/seg');
    case 'a10': return p(ctx.cps, 1e9,        'Đ/seg');
    case 'a11': return p(ctx.total, 10000,    'Đ ganados');
    case 'a12': return p(ctx.total, 1e6,      'Đ ganados');
    case 'a13': return p(ctx.total, 1e9,      'Đ ganados');
    case 'a14': return p(ctx.total, 1e12,     'Đ ganados');
    case 'a15': return p(ctx.total, 1e15,     'Đ ganados');
    case 'a16': return p(ctx.totalUpgrades, 1,   'mejoras');
    case 'a17': return p(ctx.uniqueUpgrades, 5,  'tipos');
    case 'a18': return p(ctx.totalUpgrades, 50,  'mejoras');
    case 'a19': return p(ctx.totalUpgrades, 100, 'mejoras');
    case 'a20': return p(ctx.totalUpgrades, 200, 'mejoras');
    case 'a21': return p(ctx.workers, 1,  'trabajadores');
    case 'a22': return p(ctx.workers, 10, 'trabajadores');
    case 'a23': return p(ctx.workers, 25, 'trabajadores');
    case 'a24': return p(ctx.level, 5,  'nivel');
    case 'a25': return p(ctx.level, 10, 'nivel');
    case 'a26': return p(ctx.portfolio, 1,      'Đ en bolsa');
    case 'a27': return p(ctx.portfolio, 100000, 'Đ en bolsa');
    case 'a29': return p(ctx.contracts + ctx.activeContracts, 1, 'contratos');
    case 'a30': return p(ctx.contracts, 5, 'contratos completados');
    case 'a36': return p(ctx.days, 100,  'días');
    case 'a37': return p(ctx.days, 365,  'días');
    case 'a38': return p(ctx.days, 1000, 'días');
    case 'a39': return p(ctx.days, 3000, 'días');
    case 'a41': return p(ctx.totalContracts, 5,  'contratos');
    case 'a42': return p(ctx.activeContracts, 3, 'contratos activos');
    case 'a44': return p(ctx.total, 1e6,   'Đ de contratos');
    case 'a46': return p(ctx.portfolio, 100000, 'Đ en bolsa');
    case 'a48': return p(ctx.spiedRivals, ctx.rivalsTotal, 'rivales espiados');
    case 'a50': return p(ctx.prestige, 100,  'prestigio');
    case 'a51': return p(ctx.clubCount, 3,   'clubes');
    case 'a52': return p(ctx.experienceCount, 10, 'experiencias');
    case 'a54': return p(ctx.partnerSatisfaction, 90, '% satisfacción');
    case 'a55': return p(ctx.workers, 10,     'trabajadores');
    case 'a56': return p(ctx.facilities, 5,   'instalaciones');
    case 'a57': return p(ctx.level, 10,       'nivel empresa');
    case 'a58': return p(ctx.maxInventory, 1000, 'unidades');
    case 'a60': return p(ctx.total, 1e12,     'Đ ganados');
    default: return null;
  }
}

// ─── Sort options ─────────────────────────────────────────────────────────────
type SortMode = 'category' | 'rarity' | 'unlock_date' | 'reward';

// ─── Unlock flash overlay ──────────────────────────────────────────────────────
function UnlockFlash({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.7, times: [0, 0.2, 1] }}
          style={{
            position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999,
            background: 'radial-gradient(ellipse at center, rgba(255,214,10,0.18) 0%, transparent 70%)',
          }}
        />
      )}
    </AnimatePresence>
  );
}

// ─── Trophy showcase ──────────────────────────────────────────────────────────
function TrophyShowcase({ achievements }: { achievements: Achievement[] }) {
  const recent = [...achievements]
    .filter(a => a.unlocked && a.unlockedAt !== undefined)
    .sort((a, b) => (b.unlockedAt ?? 0) - (a.unlockedAt ?? 0))
    .slice(0, 5);

  if (recent.length === 0) return (
    <GlassCard style={{ marginBottom: 16, padding: 16, textAlign: 'center' }}>
      <div style={{ color: C.text3, fontSize: 12 }}>
        🏆 Desbloquea logros para llenar tu vitrina
      </div>
    </GlassCard>
  );

  return (
    <GlassCard style={{
      marginBottom: 16, padding: '14px 16px',
      background: `linear-gradient(135deg, rgba(255,214,10,0.04), rgba(139,92,246,0.04))`,
      borderColor: C.goldBorder,
      boxShadow: `0 0 30px rgba(255,214,10,0.06)`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{
          width: 3, height: 14, borderRadius: 2,
          background: `linear-gradient(180deg, ${C.gold}, ${C.orange})`,
          boxShadow: `0 0 8px ${C.goldGlow}`,
        }} />
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: C.gold, textTransform: 'uppercase' }}>
          Vitrina de Trofeos
        </span>
        <Badge color={C.gold} size="xs">{recent.length} recientes</Badge>
      </div>
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 2 }}>
        {recent.map((a, i) => {
          const rarity = getRarity(a.reward);
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              style={{
                flexShrink: 0, width: 90, textAlign: 'center',
                padding: '10px 8px 8px',
                borderRadius: 10,
                background: `linear-gradient(160deg, ${rarity.color}12, transparent)`,
                border: `1px solid ${rarity.color}33`,
                boxShadow: `0 0 16px ${rarity.glow}22`,
                position: 'relative',
              }}
            >
              {/* Glow pulse behind icon */}
              <div style={{
                position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
                width: 36, height: 36, borderRadius: '50%',
                background: `radial-gradient(circle, ${rarity.color}30, transparent)`,
                animation: 'pulse-glow 2s ease-in-out infinite',
              }} />
              <div style={{ fontSize: 26, lineHeight: 1, position: 'relative' }}>{a.icon}</div>
              <div style={{
                fontSize: 9, fontWeight: 800, color: rarity.color, marginTop: 4,
                textTransform: 'uppercase', letterSpacing: 0.8,
              }}>{rarity.label}</div>
              <div style={{
                fontSize: 10, fontWeight: 600, color: C.text1, marginTop: 2,
                lineHeight: 1.2, wordBreak: 'break-word',
              }}>{a.title}</div>
              {a.unlockedAt && (
                <div style={{ fontSize: 9, color: C.text3, marginTop: 2 }}>Día {a.unlockedAt}</div>
              )}
            </motion.div>
          );
        })}
      </div>
    </GlassCard>
  );
}

// ─── Achievement card ─────────────────────────────────────────────────────────
function AchievementCard({
  a, isSecret, progress, justUnlocked,
}: {
  a: Achievement;
  isSecret: boolean;
  progress: { current: number; max: number; label: string } | null;
  justUnlocked: boolean;
}) {
  const rarity = getRarity(a.reward);
  const pct = progress ? Math.min(100, (progress.current / Math.max(1, progress.max)) * 100) : 0;
  const cat = CATEGORIES[a.category] ?? CATEGORIES.all;

  // For secret locked achievements show ??? UI
  if (isSecret && !a.unlocked) {
    return (
      <motion.div whileHover={{ scale: 1.01 }} style={{ position: 'relative' }}>
        <GlassCard style={{
          display: 'flex', gap: 12, alignItems: 'center', padding: 12,
          opacity: 0.45,
          filter: 'blur(0.3px)',
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10, flexShrink: 0,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20,
          }}>🔒</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text3 }}>??? Logro Secreto ???</div>
            <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>Completa condiciones ocultas para revelar este logro.</div>
          </div>
          <Badge color={C.red} size="xs">SECRETO</Badge>
        </GlassCard>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.01, y: -1 }}
      initial={justUnlocked ? { scale: 0.85, opacity: 0 } : false}
      animate={justUnlocked ? { scale: 1, opacity: 1 } : {}}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      style={{ position: 'relative' }}
    >
      <GlassCard
        glowColor={a.unlocked ? rarity.color : undefined}
        style={{
          display: 'flex', gap: 12, alignItems: 'flex-start', padding: 12,
          opacity: a.unlocked ? 1 : 0.6,
          borderColor: a.unlocked ? `${rarity.color}44` : undefined,
          background: a.unlocked
            ? `linear-gradient(135deg, ${rarity.color}08, transparent)`
            : undefined,
          overflow: 'hidden',
        }}
      >
        {/* Glow shimmer for unlocked */}
        {a.unlocked && (
          <div style={{
            position: 'absolute', top: -30, right: -30, width: 80, height: 80,
            background: `radial-gradient(circle, ${rarity.color}20, transparent)`,
            borderRadius: '50%', pointerEvents: 'none',
          }} />
        )}
        {/* Just-unlocked burst */}
        {justUnlocked && (
          <motion.div
            initial={{ opacity: 1, scale: 0.5 }}
            animate={{ opacity: 0, scale: 2.5 }}
            transition={{ duration: 0.8 }}
            style={{
              position: 'absolute', inset: 0, borderRadius: 'inherit',
              background: `radial-gradient(circle, ${rarity.color}40, transparent)`,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Icon box */}
        <div style={{
          width: 44, height: 44, borderRadius: 10, flexShrink: 0,
          background: a.unlocked
            ? `linear-gradient(135deg, ${rarity.color}22, ${rarity.color}0a)`
            : 'rgba(255,255,255,0.04)',
          border: `1px solid ${a.unlocked ? rarity.color + '44' : 'rgba(255,255,255,0.06)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22,
          boxShadow: a.unlocked ? `0 0 16px ${rarity.color}33, inset 0 0 10px ${rarity.color}10` : 'none',
          position: 'relative',
        }}>
          {a.unlocked ? a.icon : '🔒'}
          {a.unlocked && (
            <div style={{
              position: 'absolute', bottom: -3, right: -3,
              width: 14, height: 14, borderRadius: '50%',
              background: `${rarity.color}`,
              border: '2px solid rgba(17,24,39,0.9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 7, fontWeight: 900, color: '#000',
            }}>✓</div>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 13, fontWeight: 700,
              color: a.unlocked ? C.text1 : C.text3,
            }}>{a.unlocked ? a.title : a.title}</span>
            <Badge color={rarity.color} size="xs">{rarity.label}</Badge>
          </div>
          <div style={{ fontSize: 11, color: C.text2, marginTop: 2, lineHeight: 1.4 }}>
            {a.description}
          </div>

          {/* Progress bar for locked achievements */}
          {!a.unlocked && progress && (
            <div style={{ marginTop: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 9, color: C.text3, fontWeight: 600, letterSpacing: 0.4 }}>
                  {progress.label}
                </span>
                <span style={{ fontSize: 9, color: cat.color, fontWeight: 700, fontFamily: 'monospace' }}>
                  {formatNumber(progress.current)} / {formatNumber(progress.max)}
                </span>
              </div>
              <ProgressBar value={progress.current} max={progress.max} color={cat.color} height={4} showPct={false} />
            </div>
          )}

          {/* Unlock date */}
          {a.unlocked && a.unlockedAt && (
            <div style={{ fontSize: 9, color: C.text3, marginTop: 4 }}>
              Desbloqueado el día {a.unlockedAt}
            </div>
          )}
        </div>

        {/* Right side — reward */}
        <div style={{ flexShrink: 0, textAlign: 'right', minWidth: 52 }}>
          {a.unlocked ? (
            <div style={{
              fontSize: 11, fontWeight: 800, color: rarity.color,
              textShadow: `0 0 10px ${rarity.glow}`,
            }}>✅</div>
          ) : (
            <div>
              <div style={{ fontSize: 9, color: C.text3, marginBottom: 1 }}>PREMIO</div>
              <div style={{
                fontSize: 11, fontWeight: 800, color: rarity.color,
                fontFamily: 'monospace',
                textShadow: `0 0 8px ${rarity.glow}`,
              }}>
                Đ{formatNumber(a.reward)}
              </div>
            </div>
          )}
          {/* Rarity pct */}
          <div style={{ fontSize: 9, color: C.text3, marginTop: 4 }}>
            {rarity.pct}% partidas
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────
export default function AchievementsView() {
  const {
    achievements, totalClicks, creditsPerSecond, totalCreditsEarned,
    credits, upgrades, engine, stockMarket, contractManager,
    rivalManager, personalManager, currentDay,
  } = useGameStore();

  const [filter, setFilter]     = useState('all');
  const [sort, setSort]         = useState<SortMode>('category');
  const [flashActive, setFlash] = useState(false);
  const prevUnlockedRef         = useRef<Set<string>>(new Set());
  const [justUnlockedIds, setJustUnlocked] = useState<Set<string>>(new Set());

  // Detect newly unlocked achievements for animation
  useEffect(() => {
    const nowUnlocked = new Set(achievements.filter(a => a.unlocked).map(a => a.id));
    const newlyUnlocked = [...nowUnlocked].filter(id => !prevUnlockedRef.current.has(id));
    if (newlyUnlocked.length > 0) {
      setJustUnlocked(new Set(newlyUnlocked));
      setFlash(true);
      setTimeout(() => setFlash(false), 800);
      setTimeout(() => setJustUnlocked(new Set()), 1200);
    }
    prevUnlockedRef.current = nowUnlocked;
  }, [achievements]);

  // Build context for progress calculations
  const personalState = personalManager.state;
  const activeContracts = contractManager.active.length;
  const rivalsTotal = rivalManager.rivals.length;
  const spiedRivals = rivalManager.rivals.filter(r => r.lastIntelligenceDay >= 0).length;
  let maxInventory = 0;
  if (engine.playerCompany) {
    engine.playerCompany.inventory.forEach((v) => { if (v > maxInventory) maxInventory = v; });
  }
  const progressCtx = {
    clicks: totalClicks,
    cps: creditsPerSecond,
    total: totalCreditsEarned,
    credits,
    totalUpgrades: upgrades.reduce((s, u) => s + u.purchased, 0),
    uniqueUpgrades: upgrades.filter(u => u.purchased > 0).length,
    workers: engine.playerCompany?.workers.length ?? 0,
    facilities: engine.playerCompany?.facilities.length ?? 0,
    portfolio: stockMarket.getPortfolioValue(),
    days: currentDay,
    level: engine.playerCompany?.level ?? 1,
    contracts: achievements.find(a => a.id === 'a30')?.unlocked ? 5 : 0, // approximate
    activeContracts,
    totalContracts: contractManager.history.length + activeContracts,
    prestige: personalState.prestige,
    clubCount: personalState.socialClubs.length,
    experienceCount: Object.keys(personalState.experienceCooldowns).length,
    maxInventory,
    partnerSatisfaction: personalState.family.partner?.satisfaction ?? 0,
    spiedRivals,
    rivalsTotal,
  };

  // Stats
  const unlockedCount  = achievements.filter(a => a.unlocked).length;
  const totalRewards   = achievements.filter(a => a.unlocked).reduce((s, a) => s + a.reward, 0);
  const secretAchs     = achievements.filter(a => a.category === 'secret');
  const nonSecretAchs  = achievements.filter(a => a.category !== 'secret');

  // Category counts (excluding secret)
  const categoryCounts = new Map<string, { total: number; unlocked: number }>();
  for (const a of achievements) {
    const cat = a.category === 'secret' ? 'secret' : a.category;
    if (!categoryCounts.has(cat)) categoryCounts.set(cat, { total: 0, unlocked: 0 });
    const e = categoryCounts.get(cat)!;
    e.total++;
    if (a.unlocked) e.unlocked++;
  }

  // Filter
  const visibleNonSecret = filter === 'all'
    ? nonSecretAchs
    : nonSecretAchs.filter(a => a.category === filter);

  // Sort
  const rarityOrder: Record<string, number> = { MÍTICO: 0, LEGENDARIO: 1, ÉPICO: 2, RARO: 3, INUSUAL: 4, COMÚN: 5 };
  const sorted = [...visibleNonSecret].sort((a, b) => {
    if (sort === 'rarity')      return getRarity(a.reward).pct - getRarity(b.reward).pct;
    if (sort === 'unlock_date') return (b.unlockedAt ?? -1) - (a.unlockedAt ?? -1);
    if (sort === 'reward')      return b.reward - a.reward;
    // Default: category then id
    return a.category.localeCompare(b.category) || a.id.localeCompare(b.id);
  });

  // Group for category view
  const grouped = new Map<string, typeof sorted>();
  if (sort === 'category') {
    for (const a of sorted) {
      if (!grouped.has(a.category)) grouped.set(a.category, []);
      grouped.get(a.category)!.push(a);
    }
  }

  const availableCategories = ['all', ...new Set(nonSecretAchs.map(a => a.category))];
  const overallPct = Math.round((unlockedCount / achievements.length) * 100);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 0 }}>
      <UnlockFlash active={flashActive} />

      {/* ── Header ── */}
      <div style={{ flexShrink: 0, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: C.text1, letterSpacing: -0.3 }}>
              Logros del Sindicato
            </h2>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: C.gold }}>
                {unlockedCount} / {achievements.length} desbloqueados
              </span>
              <span style={{ fontSize: 11, color: C.text3 }}>
                Đ{formatNumber(totalRewards)} en recompensas cobradas
              </span>
              <Badge color={C.cyan} size="xs">{overallPct}% completado</Badge>
            </div>
          </div>
          {/* Sort selector */}
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            {([['category', '🗂️'], ['rarity', '💎'], ['reward', '💰'], ['unlock_date', '🕐']] as [SortMode, string][]).map(([s, icon]) => (
              <button key={s} onClick={() => setSort(s)} style={{
                padding: '4px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                border: `1px solid ${sort === s ? C.cyanBorder : C.border}`,
                background: sort === s ? C.cyanSubtle : 'transparent',
                color: sort === s ? C.cyan : C.text3,
                cursor: 'pointer',
              }} title={s}>{icon}</button>
            ))}
          </div>
        </div>

        {/* Overall progress bar */}
        <div style={{ marginTop: 8 }}>
          <ProgressBar
            value={unlockedCount}
            max={achievements.length}
            color={`linear-gradient(90deg, ${C.cyan}, ${C.purple})`}
            height={6}
            showPct={false}
          />
        </div>
      </div>

      {/* ── Trophy showcase ── */}
      <div style={{ flexShrink: 0 }}>
        <TrophyShowcase achievements={achievements} />
      </div>

      {/* ── Category filters ── */}
      <div style={{ flexShrink: 0, marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {availableCategories.map(c => {
            const meta  = CATEGORIES[c] ?? CATEGORIES.all;
            const count = c === 'all'
              ? { total: nonSecretAchs.length, unlocked: nonSecretAchs.filter(a => a.unlocked).length }
              : (categoryCounts.get(c) ?? { total: 0, unlocked: 0 });
            const isActive = filter === c;
            return (
              <button key={c} onClick={() => setFilter(c)} style={{
                padding: '5px 11px', borderRadius: 20,
                border: `1px solid ${isActive ? meta.color + '55' : C.border}`,
                background: isActive ? `${meta.color}15` : 'rgba(255,255,255,0.03)',
                color: isActive ? meta.color : C.text3,
                fontSize: 11, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 5,
                boxShadow: isActive ? `0 0 12px ${meta.glow}30` : 'none',
                transition: 'all 0.15s ease',
              }}>
                <span>{meta.icon}</span>
                <span>{meta.label}</span>
                <span style={{
                  fontSize: 9, opacity: 0.8,
                  color: count.unlocked === count.total && count.total > 0 ? C.green : 'inherit',
                }}>
                  {count.unlocked}/{count.total}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Achievement list ── */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: 2 }}>
        {sort === 'category' ? (
          // Grouped by category
          Array.from(grouped.entries()).map(([cat, achs]) => {
            const meta = CATEGORIES[cat] ?? CATEGORIES.all;
            const catUnlocked = achs.filter(a => a.unlocked).length;
            return (
              <div key={cat} style={{ marginBottom: 18 }}>
                {/* Category header */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7,
                  paddingBottom: 6,
                  borderBottom: `1px solid ${meta.color}22`,
                }}>
                  <span style={{ fontSize: 14 }}>{meta.icon}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 800, color: meta.color,
                    textTransform: 'uppercase', letterSpacing: 1.1,
                  }}>{meta.label}</span>
                  <div style={{
                    flex: 1, height: 1,
                    background: `linear-gradient(90deg, ${meta.color}33, transparent)`,
                  }} />
                  <span style={{ fontSize: 10, color: C.text3 }}>
                    {catUnlocked}/{achs.length}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 6 }}>
                  {achs.map(a => (
                    <AchievementCard
                      key={a.id}
                      a={a}
                      isSecret={false}
                      progress={!a.unlocked ? getProgress(a.id, progressCtx) : null}
                      justUnlocked={justUnlockedIds.has(a.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          // Flat sorted list
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 6, marginBottom: 18 }}>
            {sorted.map(a => (
              <AchievementCard
                key={a.id}
                a={a}
                isSecret={false}
                progress={!a.unlocked ? getProgress(a.id, progressCtx) : null}
                justUnlocked={justUnlockedIds.has(a.id)}
              />
            ))}
          </div>
        )}

        {/* ── Secret achievements section ── */}
        {(filter === 'all' || filter === 'secret') && secretAchs.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7,
              paddingBottom: 6, borderBottom: `1px solid ${C.red}22`,
            }}>
              <span style={{ fontSize: 14 }}>🔒</span>
              <span style={{
                fontSize: 11, fontWeight: 800, color: C.red,
                textTransform: 'uppercase', letterSpacing: 1.1,
              }}>Logros Secretos</span>
              <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${C.red}33, transparent)` }} />
              <span style={{ fontSize: 10, color: C.text3 }}>
                {secretAchs.filter(a => a.unlocked).length}/{secretAchs.length}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 6 }}>
              {secretAchs.map(a => (
                <AchievementCard
                  key={a.id}
                  a={a}
                  isSecret={true}
                  progress={null}
                  justUnlocked={justUnlockedIds.has(a.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Completion stats footer ── */}
        <GlassCard style={{
          padding: '12px 16px', marginBottom: 8,
          background: 'rgba(255,255,255,0.02)',
        }}>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { label: 'Desbloqueados', value: `${unlockedCount}/${achievements.length}`, color: C.cyan },
              { label: 'Completado',    value: `${overallPct}%`,                          color: C.purple },
              { label: 'Recompensas',   value: `Đ${formatNumber(totalRewards)}`,           color: C.gold   },
              { label: 'Pendientes',    value: `${achievements.length - unlockedCount}`,  color: C.text2  },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: s.color, fontFamily: 'monospace' }}>{s.value}</div>
                <div style={{ fontSize: 9, color: C.text3, textTransform: 'uppercase', letterSpacing: 0.8 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

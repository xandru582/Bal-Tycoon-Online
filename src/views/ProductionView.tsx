import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, formatNumber } from '../stores/gameStore';

/* ── Colour tokens ─────────────────────────────────────────────────────── */
const C = {
  cyan:    '#f59e0b', cyanG: 'rgba(245,158,11,0.18)', cyanB: 'rgba(245,158,11,0.25)',
  purple:  '#8b5cf6', purpleG: 'rgba(139,92,246,0.18)', purpleB: 'rgba(139,92,246,0.25)',
  green:   '#10b981', greenG: 'rgba(16,185,129,0.18)',
  orange:  '#f97316', orangeG: 'rgba(249,115,22,0.18)',
  red:     '#f43f5e', redG: 'rgba(244,63,94,0.18)',
  gold:    '#fbbf24', goldG: 'rgba(251,191,36,0.18)', goldB: 'rgba(251,191,36,0.3)',
  pink:    '#e879f9', pinkG: 'rgba(232,121,249,0.18)',
  white:   '#ffffff', whiteG: 'rgba(255,255,255,0.18)',
  void:    'rgba(255,255,255,0.06)',
  text1:   '#e8edf5', text2: '#8a9ab5', text3: '#4a5568',
  border:  'rgba(255,255,255,0.08)',
  surface: 'rgba(17,24,39,0.82)',
};

/* ── Tier config ───────────────────────────────────────────────────────── */
interface TierConfig {
  label: string;
  color: string;
  glow: string;
  border: string;
  bg: string;
  badge: string;
  description: string;
}

const TIERS: Record<number, TierConfig> = {
  0: { label: 'BÁSICO',        color: C.text2,   glow: 'rgba(138,154,181,0.3)', border: 'rgba(138,154,181,0.2)', bg: 'rgba(138,154,181,0.05)', badge: '░',  description: 'Operaciones de nivel inicial. Bajo coste, bajo retorno.' },
  1: { label: 'AVANZADO',      color: C.cyan,    glow: C.cyanG,  border: C.cyanB,   bg: 'rgba(245,158,11,0.04)',   badge: '▒',  description: 'Tecnología mejorada. ROI significativamente mayor.' },
  2: { label: 'ELITE',         color: C.purple,  glow: C.purpleG, border: C.purpleB, bg: 'rgba(139,92,246,0.04)', badge: '▓',  description: 'Hardware de última generación. Acceso a redes privilegiadas.' },
  3: { label: 'RARO',          color: C.green,   glow: C.greenG, border: 'rgba(16,185,129,0.25)',  bg: 'rgba(16,185,129,0.04)',    badge: '◆',  description: 'Tecnología experimental. Fuerzas operativas encubiertas.' },
  4: { label: 'ÉPICO',         color: C.orange,  glow: C.orangeG, border: 'rgba(249,115,22,0.25)', bg: 'rgba(249,115,22,0.04)',  badge: '★',  description: 'Infraestructura orbital. Alcance planetario.' },
  5: { label: 'LEGENDARIO',    color: C.gold,    glow: C.goldG,  border: C.goldB,   bg: 'rgba(251,191,36,0.04)', badge: '✦',  description: 'Ingeniería de tipo kardashev I. Energía estelar.' },
  6: { label: 'MÍTICO',        color: C.pink,    glow: C.pinkG,  border: 'rgba(232,121,249,0.3)', bg: 'rgba(232,121,249,0.04)', badge: '⬡', description: 'Más allá de la física conocida. Manipulación temporal.' },
  7: { label: 'SUPREMO',       color: C.red,     glow: C.redG,   border: 'rgba(244,63,94,0.3)',   bg: 'rgba(244,63,94,0.04)',   badge: '☠', description: 'Una mente que consume galaxias enteras.' },
  8: { label: 'TRASCENDENTE',  color: C.white,   glow: C.whiteG, border: 'rgba(255,255,255,0.3)', bg: 'rgba(255,255,255,0.04)', badge: '∞', description: 'La simulación misma trabaja para ti.' },
  9: { label: 'ABSOLUTO',      color: C.cyan,    glow: C.cyanG,  border: C.cyanB,   bg: 'rgba(245,158,11,0.04)',  badge: '✨',  description: 'Has trascendido toda limitación. La singularidad te pertenece.' },
};

/* ── Milestone thresholds ──────────────────────────────────────────────── */
const MILESTONES = [1, 10, 25, 50, 100, 200, 500];

export default function ProductionView() {
  const { upgrades, credits, creditsPerSecond, clickPower, buyUpgrade } = useGameStore();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [justBought, setJustBought] = useState<string | null>(null);

  /* Tier unlock: gain access to next tier after owning ≥1 in current */
  const ownedTiers = new Set(upgrades.filter(u => u.purchased > 0).map(u => u.tier));
  const maxUnlockedTier = Math.max(0, ...Array.from(ownedTiers)) + 1;

  /* Group visible upgrades by tier */
  const visible = upgrades.filter(u => u.tier <= maxUnlockedTier);
  const tierGroups = new Map<number, typeof upgrades>();
  for (const u of visible) {
    if (!tierGroups.has(u.tier)) tierGroups.set(u.tier, []);
    tierGroups.get(u.tier)!.push(u);
  }

  const handleBuy = (id: string) => {
    buyUpgrade(id);
    setJustBought(id);
    setTimeout(() => setJustBought(null), 600);
  };

  const totalUpgrades = upgrades.reduce((s, u) => s + u.purchased, 0);
  const totalValue    = upgrades.reduce((s, u) => s + u.purchased * u.cpsEach, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, height: '100%' }}>

      {/* ── Header strip ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 0 18px 0', flexShrink: 0,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        marginBottom: 20,
      }}>
        <div>
          <h2 style={{ fontSize: 21, fontWeight: 900, letterSpacing: 0.5, margin: 0 }}>
            Infraestructura de Producción
          </h2>
          <p style={{ color: C.text2, fontSize: 12, marginTop: 4, margin: '4px 0 0' }}>
            {totalUpgrades} activos desplegados · {TIERS[maxUnlockedTier]?.label ?? 'BÁSICO'} desbloqueado
          </p>
        </div>

        {/* CPS / Click power pills */}
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{
            padding: '8px 16px', borderRadius: 10,
            background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
          }}>
            <div style={{ fontSize: 9, color: C.text3, letterSpacing: 1.5, marginBottom: 2 }}>PASIVO</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 800, color: C.green }}>
              +{formatNumber(creditsPerSecond)}<span style={{ fontSize: 10, opacity: 0.7 }}>/seg</span>
            </div>
          </div>
          <div style={{
            padding: '8px 16px', borderRadius: 10,
            background: C.cyanG, border: `1px solid ${C.cyanB}`,
          }}>
            <div style={{ fontSize: 9, color: C.text3, letterSpacing: 1.5, marginBottom: 2 }}>CLICK</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 800, color: C.cyan }}>
              +{formatNumber(clickPower)}<span style={{ fontSize: 10, opacity: 0.7 }}>/click</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tier groups ── */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
        {Array.from(tierGroups.entries()).map(([tier, items]) => {
          const cfg = TIERS[tier] ?? TIERS[0];
          const tierOwned = items.reduce((s, u) => s + u.purchased, 0);
          const tierCps   = items.reduce((s, u) => s + u.purchased * u.cpsEach, 0);

          return (
            <div key={tier} style={{ marginBottom: 28 }}>
              {/* Tier header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                marginBottom: 12, padding: '6px 12px',
                borderRadius: 8,
                background: cfg.bg,
                border: `1px solid ${cfg.border}`,
              }}>
                <span style={{ fontSize: 18, lineHeight: 1 }}>{cfg.badge}</span>
                <div style={{ flex: 1 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 800, letterSpacing: 2,
                    color: cfg.color,
                    textShadow: `0 0 12px ${cfg.glow}`,
                  }}>
                    TIER {tier} — {cfg.label}
                  </span>
                  <span style={{ fontSize: 10, color: C.text3, marginLeft: 10 }}>{cfg.description}</span>
                </div>
                {tierCps > 0 && (
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.green, fontWeight: 700 }}>
                    +{formatNumber(tierCps)}/seg
                  </span>
                )}
              </div>

              {/* Upgrade cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.map(upgrade => {
                  const canAfford  = credits >= upgrade.cost;
                  const owned      = upgrade.purchased;
                  const contrib    = owned * upgrade.cpsEach;
                  const pct        = creditsPerSecond > 0 ? (contrib / creditsPerSecond * 100) : 0;
                  const nextMile   = MILESTONES.find(m => m > owned) ?? null;
                  const prevMileArr = MILESTONES.filter(m => m <= owned);
                  const prevMile   = prevMileArr.length > 0 ? prevMileArr[prevMileArr.length - 1] : 0;
                  const mileProgress = nextMile ? (owned - prevMile) / (nextMile - prevMile) : 1;
                  const isHovered  = hoveredId === upgrade.id;
                  const wasBought  = justBought === upgrade.id;

                  return (
                    <motion.div
                      key={upgrade.id}
                      onMouseEnter={() => setHoveredId(upgrade.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      animate={wasBought ? { scale: [1, 1.03, 1] } : { scale: 1 }}
                      transition={{ duration: 0.3 }}
                      style={{
                        display: 'flex', gap: 14, alignItems: 'center',
                        padding: '12px 14px',
                        borderRadius: 12,
                        background: isHovered
                          ? `linear-gradient(135deg, ${cfg.bg}, rgba(17,24,39,0.6))`
                          : 'rgba(17,24,39,0.5)',
                        border: `1px solid ${isHovered ? cfg.border : 'rgba(255,255,255,0.06)'}`,
                        boxShadow: isHovered ? `0 4px 24px ${cfg.glow}` : 'none',
                        transition: 'all 0.18s ease',
                        opacity: canAfford ? 1 : 0.55,
                        cursor: canAfford ? 'default' : 'default',
                        position: 'relative', overflow: 'hidden',
                      }}
                    >
                      {/* Left glow bar */}
                      {owned > 0 && (
                        <div style={{
                          position: 'absolute', left: 0, top: 0, bottom: 0,
                          width: 3, borderRadius: '12px 0 0 12px',
                          background: `linear-gradient(180deg, ${cfg.color}, transparent)`,
                          opacity: 0.8,
                        }} />
                      )}

                      {/* Icon badge */}
                      <div style={{
                        width: 52, height: 52, borderRadius: 12,
                        background: owned > 0 ? cfg.bg : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${owned > 0 ? cfg.border : 'rgba(255,255,255,0.06)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 26, flexShrink: 0,
                        boxShadow: owned > 0 ? `0 0 16px ${cfg.glow}` : 'none',
                        transition: 'all 0.18s',
                      }}>
                        {upgrade.icon}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: owned > 0 ? C.text1 : C.text2 }}>
                            {upgrade.name}
                          </span>
                          {owned > 0 && (
                            <span style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: 11, fontWeight: 800,
                              padding: '1px 7px', borderRadius: 5,
                              background: cfg.bg, border: `1px solid ${cfg.border}`,
                              color: cfg.color,
                            }}>
                              ×{owned}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: C.text3, marginBottom: 6 }}>{upgrade.description}</div>

                        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11, color: C.green, fontWeight: 700 }}>
                            +{formatNumber(upgrade.cpsEach)}/seg c/u
                          </span>
                          {contrib > 0 && (
                            <span style={{ fontSize: 11, color: C.text3 }}>
                              Total: {formatNumber(contrib)} ({pct.toFixed(1)}%)
                            </span>
                          )}
                          {nextMile && owned > 0 && (
                            <span style={{ fontSize: 10, color: C.text3 }}>
                              → ×{nextMile} [{owned}/{nextMile}]
                            </span>
                          )}
                        </div>

                        {/* Milestone progress bar */}
                        {owned > 0 && nextMile && (
                          <div style={{
                            marginTop: 6, height: 3,
                            background: 'rgba(255,255,255,0.06)',
                            borderRadius: 2, overflow: 'hidden',
                          }}>
                            <motion.div
                              initial={false}
                              animate={{ width: `${mileProgress * 100}%` }}
                              style={{
                                height: '100%',
                                background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}88)`,
                                borderRadius: 2,
                              }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Buy button */}
                      <motion.button
                        whileHover={canAfford ? { scale: 1.06 } : {}}
                        whileTap={canAfford ? { scale: 0.93 } : {}}
                        onClick={() => canAfford && handleBuy(upgrade.id)}
                        disabled={!canAfford}
                        style={{
                          padding: '10px 18px', borderRadius: 9, flexShrink: 0,
                          border: `1px solid ${canAfford ? cfg.border : 'rgba(255,255,255,0.05)'}`,
                          background: canAfford
                            ? `linear-gradient(135deg, ${cfg.bg}, rgba(17,24,39,0.4))`
                            : 'rgba(255,255,255,0.03)',
                          color: canAfford ? cfg.color : C.text3,
                          fontFamily: "'JetBrains Mono', monospace",
                          fontWeight: 800, fontSize: 12,
                          cursor: canAfford ? 'pointer' : 'not-allowed',
                          transition: 'all 0.15s',
                          whiteSpace: 'nowrap',
                          boxShadow: canAfford && isHovered ? `0 0 20px ${cfg.glow}` : 'none',
                        }}
                      >
                        Đ {formatNumber(upgrade.cost)}
                      </motion.button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Locked tier teaser */}
        {maxUnlockedTier < 9 && (
          <div style={{
            padding: '16px 20px', borderRadius: 12, marginTop: 8,
            background: 'rgba(255,255,255,0.02)',
            border: '1px dashed rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 22, opacity: 0.4 }}>🔒</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.text3, letterSpacing: 1 }}>
                TIER {maxUnlockedTier + 1} — {TIERS[maxUnlockedTier + 1]?.label ?? 'BLOQUEADO'}
              </div>
              <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>
                Adquiere al menos una unidad del Tier {maxUnlockedTier} para desbloquear.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

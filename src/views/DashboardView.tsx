import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, formatNumber } from '../stores/gameStore';
import {
  GlassCard, StatCard, MiniChart, EventFeed, ProgressBar,
  Badge, Divider, SectionHeader, TIER_COLORS,
} from '../components/ui/GlassCard';

/* ─── Colour tokens (inline to keep component self-contained) ─────────── */
const C = {
  cyan:         '#f59e0b',
  purple:       '#8b5cf6',
  green:        '#10b981',
  orange:       '#f97316',
  red:          '#f43f5e',
  gold:         '#fbbf24',
  text1:        '#e8edf5',
  text2:        '#8a9ab5',
  text3:        '#4a5568',
  cyanGlow:     'rgba(245,158,11,0.35)',
  purpleGlow:   'rgba(139,92,246,0.35)',
  greenGlow:    'rgba(16,185,129,0.35)',
  goldGlow:     'rgba(251,191,36,0.35)',
  redGlow:      'rgba(244,63,94,0.35)',
  orangeGlow:   'rgba(249,115,22,0.35)',
  surface:      'rgba(17,24,39,0.82)',
  border:       'rgba(255,255,255,0.08)',
  cyanBorder:   'rgba(245,158,11,0.22)',
  purpleBorder: 'rgba(139,92,246,0.22)',
  mono:         "'JetBrains Mono', ui-monospace, monospace",
  sans:         "'Inter', -apple-system, system-ui, sans-serif",
};

/* ─── Phase config ────────────────────────────────────────────────────── */
const PHASE_CFG: Record<string, { color: string; glow: string; label: string; dot: string }> = {
  boom:       { color: C.green,  glow: C.greenGlow,  label: 'BOOM',       dot: C.green  },
  growth:     { color: C.cyan,   glow: C.cyanGlow,   label: 'CRECIMIENTO',dot: C.cyan   },
  stable:     { color: C.text2,  glow: 'rgba(138,154,181,0.3)', label: 'ESTABLE', dot: C.text2 },
  slowdown:   { color: C.orange, glow: C.orange,     label: 'DESACELERACIÓN', dot: C.orange },
  recession:  { color: C.red,    glow: C.redGlow,    label: 'RECESIÓN',   dot: C.red    },
  crisis:     { color: C.red,    glow: C.redGlow,    label: 'CRISIS',     dot: C.red    },
};

/* ─── Float particle ──────────────────────────────────────────────────── */
interface Floater { id: number; x: number; y: number; amount: number; }

/* ══════════════════════════════════════════════════════════════════════════
   MAIN DASHBOARD
   ══════════════════════════════════════════════════════════════════════════ */
export default function DashboardView() {
  const {
    credits, creditsPerSecond, clickPower, totalClicks,
    click, engine, currentDay, influence, achievements,
    upgrades, stockMarket, rivalManager, _rev,
  } = useGameStore();

  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [clickFlash, setClickFlash] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  /* ── Clean up floaters ── */
  useEffect(() => {
    if (floaters.length === 0) return;
    const t = setTimeout(() => {
      const cutoff = Date.now() - 900;
      setFloaters(prev => prev.filter(f => f.id > cutoff));
    }, 950);
    return () => clearTimeout(t);
  }, [floaters]);

  /* ── Derived data ── */
  const company      = engine.playerCompany;
  const playerRank   = rivalManager.getRankings(credits, company?.name ?? 'Aetheria Syndicate').find(r => r.isPlayer)?.rank ?? 6;
  const unlockedCount= achievements.filter(a => a.unlocked).length;
  const totalUpgrades= upgrades.reduce((s, u) => s + u.purchased, 0);
  const cashHistory  = company?.financialHistory.slice(-30).map(h => h.cash) ?? [];
  const summary      = company?.getFinancialSummary();
  const phase        = engine.indicators.phase;
  const phaseCfg     = PHASE_CFG[phase] ?? PHASE_CFG.stable;
  const portfolioVal = stockMarket.getPortfolioValue();
  const netWorth     = (company?.cash ?? 0) + portfolioVal;

  /* ── 5 most affordable unpurchased upgrades ── */
  const availableUpgrades = upgrades
    .filter(u => u.purchased < 10)
    .sort((a, b) => a.cost - b.cost)
    .slice(0, 5);

  /* ── News items ── */
  const newsItems = [...engine.news].reverse().map((n, i) => ({
    id: `n_${i}_${n.id}`,
    icon: n.severity === 'critical' || n.severity === 'alert'
      ? '🚨' : n.severity === 'warning' ? '⚠️' : 'ℹ️',
    text: n.title,
    color: n.severity === 'critical' || n.severity === 'alert'
      ? C.red : n.severity === 'warning' ? C.orange : C.text2,
    subtext: `Día ${n.publishedOn}`,
  }));

  /* ── Click handler ── */
  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const earned = clickPower + creditsPerSecond * 0.05;
    const spread = 130;
    const newFloaters: Floater[] = Array.from({ length: 3 }).map((_, i) => ({
      id: Date.now() + i,
      x: rect.left + rect.width / 2 + (Math.random() - 0.5) * spread,
      y: rect.top  + rect.height / 2 + (Math.random() - 0.5) * spread,
      amount: earned * (0.8 + Math.random() * 0.4),
    }));
    setFloaters(prev => [...prev, ...newFloaters].slice(-18));
    setClickFlash(true);
    setTimeout(() => setClickFlash(false), 120);
    click();
  }, [click, clickPower, creditsPerSecond]);

  /* ══════════════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ display: 'flex', gap: 14, height: '100%', fontFamily: C.sans }}>

      {/* ═══════════════════════════════════════════════
          LEFT COLUMN — Hero + Economy Strip
          ═══════════════════════════════════════════════ */}
      <div style={{ flex: '0 0 340px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* ── Hero Card ── */}
        <GlassCard
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            padding: 0,
            minHeight: 360,
          }}
          noPadding
        >
          {/* Scan-line effect */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 0,
            background: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0,0,0,0.08) 2px,
              rgba(0,0,0,0.08) 4px
            )`,
            pointerEvents: 'none',
          }} />

          {/* Background radial glow */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 0,
            background: `
              radial-gradient(ellipse 60% 50% at 50% 60%,
                rgba(245,158,11,0.06) 0%, transparent 70%),
              radial-gradient(ellipse 40% 30% at 50% 60%,
                rgba(139,92,246,0.04) 0%, transparent 60%)
            `,
            pointerEvents: 'none',
          }} />

          {/* Decorative orbital rings */}
          <div style={{
            position: 'absolute',
            width: 280, height: 280,
            border: '1px dashed rgba(245,158,11,0.1)',
            borderRadius: '50%',
            animation: 'spin-slow 40s linear infinite',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 0,
          }} />
          <div style={{
            position: 'absolute',
            width: 380, height: 380,
            border: '1px solid rgba(139,92,246,0.06)',
            borderRadius: '50%',
            animation: 'spin-reverse 55s linear infinite',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 0,
          }} />

          {/* ── Company Header ── */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            padding: '16px 20px 12px',
            background: 'linear-gradient(180deg, rgba(10,14,26,0.8) 0%, transparent 100%)',
            zIndex: 2,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div>
                <div style={{
                  fontSize: 16, fontWeight: 900, letterSpacing: 3,
                  background: `linear-gradient(135deg, ${C.cyan}, ${C.purple})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1.1,
                }}>
                  {company?.name?.toUpperCase() ?? 'AETHERIA SYNDICATE'}
                </div>
                <div style={{ fontSize: 9, color: C.text3, letterSpacing: 2, marginTop: 2 }}>
                  CORPORACIÓN NIVEL {company?.level ?? 1}
                </div>
              </div>
              <Badge color={phaseCfg.color} size="sm">{phaseCfg.label}</Badge>
            </div>
            <ProgressBar
              value={company?.xp ?? 0}
              max={(company?.level ?? 1) * 1000}
              height={4}
              color={`linear-gradient(90deg, ${C.cyan}, ${C.purple})`}
              showPct={false}
            />
          </div>

          {/* ── CPS Display ── */}
          <div style={{ textAlign: 'center', zIndex: 2, marginBottom: 24, marginTop: 20 }}>
            <div style={{ fontSize: 10, letterSpacing: 3, color: C.text3, marginBottom: 4, fontWeight: 600 }}>
              CRÉDITOS / SEGUNDO
            </div>
            <div
              className="font-mono"
              key={Math.floor(creditsPerSecond)}
              style={{
                fontSize: 28,
                fontWeight: 900,
                color: C.green,
                textShadow: `0 0 20px ${C.greenGlow}, 0 0 40px rgba(16,185,129,0.15)`,
                letterSpacing: 1,
                lineHeight: 1,
                animation: 'count-up 0.18s ease-out',
              }}
            >
              +{formatNumber(creditsPerSecond)}<span style={{ fontSize: 14, opacity: 0.7 }}> Đ</span>
            </div>
            <div style={{ fontSize: 11, color: C.text3, marginTop: 6 }}>
              <span style={{ color: C.cyan, fontFamily: C.mono }}>
                {formatNumber(clickPower + creditsPerSecond * 0.05)} Đ
              </span>
              {' '}por hack
            </div>
          </div>

          {/* ── HACK BUTTON ── */}
          <div style={{ position: 'relative', zIndex: 2, marginBottom: 20 }}>
            {/* Pulse rings */}
            {clickFlash && (
              <>
                <div style={{
                  position: 'absolute', top: '50%', left: '50%',
                  width: 160, height: 160,
                  transform: 'translate(-50%, -50%)',
                  borderRadius: '50%',
                  border: `2px solid ${C.cyan}`,
                  animation: 'pulse-ring 0.6s ease-out forwards',
                  pointerEvents: 'none',
                }} />
                <div style={{
                  position: 'absolute', top: '50%', left: '50%',
                  width: 160, height: 160,
                  transform: 'translate(-50%, -50%)',
                  borderRadius: '50%',
                  border: `1px solid ${C.purple}`,
                  animation: 'pulse-ring 0.8s 0.1s ease-out forwards',
                  pointerEvents: 'none',
                }} />
              </>
            )}

            <motion.button
              ref={btnRef}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.90 }}
              onClick={handleClick}
              style={{
                width: 150, height: 150,
                borderRadius: '50%',
                border: `2px solid ${C.cyan}55`,
                background: `
                  radial-gradient(circle at 35% 35%,
                    rgba(245,158,11,0.18) 0%,
                    rgba(245,158,11,0.06) 40%,
                    rgba(139,92,246,0.08) 70%,
                    rgba(0,0,0,0.4) 100%
                  )
                `,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `
                  0 0 40px rgba(245,158,11,0.22),
                  0 0 80px rgba(245,158,11,0.08),
                  inset 0 0 30px rgba(245,158,11,0.08),
                  inset 0 1px 0 rgba(255,255,255,0.12)
                `,
                animation: 'hex-pulse 2.5s ease-in-out infinite',
                outline: 'none',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Inner shimmer */}
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: `conic-gradient(from 0deg, transparent 60%, ${C.cyan}22 80%, transparent 100%)`,
                animation: 'spin-slow 4s linear infinite',
                pointerEvents: 'none',
              }} />

              {/* Flash overlay */}
              <AnimatePresence>
                {clickFlash && (
                  <motion.div
                    initial={{ opacity: 0.5 }}
                    animate={{ opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12 }}
                    style={{
                      position: 'absolute', inset: 0, borderRadius: '50%',
                      background: `radial-gradient(circle, ${C.cyan}66, transparent 70%)`,
                      pointerEvents: 'none',
                    }}
                  />
                )}
              </AnimatePresence>

              <div style={{ fontSize: 42, filter: `drop-shadow(0 0 12px ${C.cyan})`, zIndex: 1, lineHeight: 1 }}>⬡</div>
              <div style={{
                fontSize: 11, fontWeight: 900, marginTop: 8,
                letterSpacing: 3, zIndex: 1,
                background: `linear-gradient(135deg, ${C.cyan}, ${C.purple})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                HACK
              </div>
            </motion.button>
          </div>

          {/* ── Bottom stat: total clicks ── */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 2,
            padding: '12px 20px',
            background: 'linear-gradient(0deg, rgba(10,14,26,0.8) 0%, transparent 100%)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          }}>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 9, color: C.text3, letterSpacing: 2, marginBottom: 2 }}>HACKS TOTALES</div>
              <div
                className="font-mono"
                style={{ fontSize: 18, fontWeight: 800, color: C.text2, letterSpacing: 0.5 }}
              >
                {totalClicks.toLocaleString()}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 9, color: C.text3, letterSpacing: 2, marginBottom: 2 }}>RANK CORP.</div>
              <div style={{
                fontSize: 18, fontWeight: 900, fontFamily: C.mono,
                color: playerRank <= 3 ? C.gold : playerRank <= 5 ? C.purple : C.text2,
                textShadow: playerRank <= 3 ? `0 0 14px ${C.goldGlow}` : 'none',
              }}>
                #{playerRank}
              </div>
            </div>
          </div>
        </GlassCard>

        {/* ── Economy Strip ── */}
        <GlassCard style={{ padding: 14 }}>
          <SectionHeader title="Terminal Macroeconómica" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <EconMetric
              label="PATRIMONIO"
              value={`Đ ${formatNumber(netWorth)}`}
              color={C.cyan}
              glow={C.cyanGlow}
            />
            <EconMetric
              label="PIB GLOBAL"
              value={`${engine.indicators.gdpGrowth > 0 ? '+' : ''}${engine.indicators.gdpGrowth.toFixed(1)}%`}
              color={engine.indicators.gdpGrowth >= 0 ? C.green : C.red}
              glow={engine.indicators.gdpGrowth >= 0 ? C.greenGlow : C.redGlow}
            />
            <EconMetric
              label="INFLACIÓN"
              value={`${engine.indicators.inflation.toFixed(1)}%`}
              color={engine.indicators.inflation > 5 ? C.red : engine.indicators.inflation > 2 ? C.orange : C.green}
              glow={C.orangeGlow}
            />
            <EconMetric
              label="CONFIANZA"
              value={`${Math.round((engine.indicators.consumerConfidence ?? 50))}%`}
              color={C.purple}
              glow={C.purpleGlow}
            />
          </div>
          {/* Live Phase Indicator */}
          <div style={{
            marginTop: 10,
            padding: '8px 12px',
            borderRadius: 8,
            background: `${phaseCfg.color}0d`,
            border: `1px solid ${phaseCfg.color}33`,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: phaseCfg.color,
              boxShadow: `0 0 10px ${phaseCfg.glow}, 0 0 20px ${phaseCfg.glow}`,
              animation: 'hex-pulse 2s ease-in-out infinite',
              flexShrink: 0,
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, color: C.text3, letterSpacing: 1.5, fontWeight: 600 }}>FASE DEL MERCADO</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: phaseCfg.color, letterSpacing: 1 }}>
                {phaseCfg.label}
              </div>
            </div>
            <div style={{ fontSize: 9, color: C.text3, fontFamily: C.mono }}>DÍA {currentDay}</div>
          </div>
        </GlassCard>
      </div>

      {/* ═══════════════════════════════════════════════
          MIDDLE COLUMN — Upgrades
          ═══════════════════════════════════════════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>

        {/* ── KPI Row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          <StatCard
            label="Créditos"
            value={`Đ ${formatNumber(credits)}`}
            icon="💰"
            color={C.cyan}
            small
          />
          <StatCard
            label="Influencia"
            value={`◆ ${formatNumber(influence)}`}
            icon="👑"
            color={C.purple}
            small
          />
          <StatCard
            label="Empleados"
            value={company?.workers.length ?? 0}
            icon="👥"
            color={C.text2}
            small
          />
          <StatCard
            label="Logros"
            value={`${unlockedCount} / ${achievements.length}`}
            icon="🏆"
            color={unlockedCount > 5 ? C.gold : C.text2}
            small
          />
        </div>

        {/* ── Upgrade Cards ── */}
        <GlassCard style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <SectionHeader
            title="Operaciones Activas"
            badge={
              <Badge color={C.purple} size="xs">
                {totalUpgrades} instaladas
              </Badge>
            }
          />
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {availableUpgrades.map(u => {
              const tier = TIER_COLORS[u.tier] ?? TIER_COLORS[0];
              const canAfford = credits >= u.cost;
              const pct = u.purchased > 0 ? Math.min(100, (u.purchased / 10) * 100) : 0;

              return (
                <div
                  key={u.id}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: `rgba(255,255,255,0.025)`,
                    border: `1px solid ${canAfford ? tier.border : 'rgba(255,255,255,0.06)'}`,
                    boxShadow: canAfford ? `0 0 16px ${tier.glow}18, inset 0 0 12px ${tier.glow}08` : 'none',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Tier glow streak */}
                  {canAfford && (
                    <div style={{
                      position: 'absolute',
                      top: 0, left: 0, right: 0,
                      height: 1,
                      background: `linear-gradient(90deg, transparent, ${tier.color}66, transparent)`,
                    }} />
                  )}

                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    {/* Icon box */}
                    <div style={{
                      width: 40, height: 40, borderRadius: 9,
                      background: canAfford
                        ? `linear-gradient(135deg, ${tier.color}22, ${tier.color}0a)`
                        : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${canAfford ? tier.border : 'rgba(255,255,255,0.06)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 20, flexShrink: 0,
                      filter: canAfford ? `drop-shadow(0 0 6px ${tier.glow})` : 'grayscale(0.5) opacity(0.5)',
                    }}>
                      {u.icon}
                    </div>

                    {/* Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                        <div style={{ fontWeight: 700, fontSize: 12, color: canAfford ? C.text1 : C.text3 }}>
                          {u.name}
                        </div>
                        <Badge color={tier.color} size="xs">{tier.label}</Badge>
                      </div>

                      <div style={{ fontSize: 10, color: C.text3, marginBottom: 5, lineHeight: 1.3 }}>
                        {u.description}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{
                          fontSize: 13, fontWeight: 900, fontFamily: C.mono,
                          color: canAfford ? tier.color : C.text3,
                          textShadow: canAfford ? `0 0 10px ${tier.glow}` : 'none',
                        }}>
                          Đ {formatNumber(u.cost)}
                        </div>
                        <div style={{
                          fontSize: 10, color: C.green, fontFamily: C.mono, fontWeight: 600,
                        }}>
                          +{formatNumber(u.cpsEach)}/s × {u.purchased > 0 ? u.purchased : '?'}
                        </div>
                      </div>

                      {u.purchased > 0 && (
                        <div style={{ marginTop: 5 }}>
                          <ProgressBar
                            value={u.purchased}
                            max={10}
                            height={3}
                            color={`linear-gradient(90deg, ${tier.color}, ${tier.color}88)`}
                            showPct={false}
                          />
                          <div style={{ fontSize: 9, color: C.text3, marginTop: 2, textAlign: 'right' }}>
                            {u.purchased}/10
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {availableUpgrades.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: C.text3 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>✨</div>
                <div style={{ fontSize: 12 }}>Todas las operaciones maximizadas</div>
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* ═══════════════════════════════════════════════
          RIGHT COLUMN — Finances & News
          ═══════════════════════════════════════════════ */}
      <div style={{ flex: '0 0 260px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* ── Financial Summary ── */}
        {summary && (
          <GlassCard style={{ padding: 16 }}>
            <SectionHeader title="Finanzas 30 Días" />

            <FinRow label="Ingresos Totales" value={`+Đ ${formatNumber(summary.revenue30d)}`} color={C.green} />
            <FinRow label="Costes Operativos" value={`-Đ ${formatNumber(summary.expenses30d)}`} color={C.red} />
            <Divider color={C.cyan} />
            <FinRow
              label="Beneficio Neto"
              value={`${summary.profit30d >= 0 ? '+' : ''}Đ ${formatNumber(summary.profit30d)}`}
              color={summary.profit30d >= 0 ? C.green : C.red}
              large
            />

            {cashHistory.length > 3 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 9, color: C.text3, letterSpacing: 1.5, marginBottom: 5 }}>
                  HISTORIAL EFECTIVO
                </div>
                <MiniChart data={cashHistory} width={228} height={52} color="auto" />
              </div>
            )}
          </GlassCard>
        )}

        {/* ── Portfolio strip ── */}
        {portfolioVal > 0 && (
          <div style={{
            padding: '10px 14px',
            borderRadius: 10,
            background: `${C.purple}0d`,
            border: `1px solid ${C.purpleBorder}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: 9, color: C.text3, letterSpacing: 1.5, marginBottom: 2 }}>PORTFOLIO NVX</div>
              <div style={{ fontSize: 14, fontWeight: 800, fontFamily: C.mono, color: C.purple,
                textShadow: `0 0 10px ${C.purpleGlow}` }}>
                Đ {formatNumber(portfolioVal)}
              </div>
            </div>
            <div style={{ fontSize: 20 }}>📈</div>
          </div>
        )}

        {/* ── News Feed ── */}
        <GlassCard style={{
          flex: 1,
          padding: 14,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minHeight: 0,
        }}>
          <SectionHeader
            title="Feed Macroeconómico"
            badge={
              newsItems.length > 0
                ? <Badge color={C.red} size="xs">{newsItems.length} eventos</Badge>
                : undefined
            }
          />
          <EventFeed items={newsItems} maxItems={12} />
        </GlassCard>
      </div>

      {/* ── Floating credit numbers ── */}
      <AnimatePresence>
        {floaters.map(f => (
          <motion.div
            key={f.id}
            initial={{ opacity: 1, y: f.y, x: f.x, scale: 0.6 }}
            animate={{ opacity: 0, y: f.y - 100, scale: 1.1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.85, ease: 'easeOut' }}
            style={{
              position: 'fixed', left: 0, top: 0,
              pointerEvents: 'none', zIndex: 9999,
              color: C.cyan,
              fontWeight: 900,
              fontSize: 16,
              fontFamily: C.mono,
              textShadow: `0 0 12px ${C.cyanGlow}, 0 2px 8px rgba(0,0,0,0.6)`,
            }}
          >
            +{formatNumber(f.amount)} Đ
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ─── Helper sub-components ─────────────────────────────────────────────── */

function EconMetric({
  label, value, color, glow,
}: {
  label: string;
  value: string;
  color: string;
  glow: string;
}) {
  return (
    <div style={{
      padding: '8px 10px',
      borderRadius: 8,
      background: `${color}09`,
      border: `1px solid ${color}22`,
    }}>
      <div style={{ fontSize: 9, color: '#4a5568', letterSpacing: 1.5, marginBottom: 3, fontWeight: 600 }}>
        {label}
      </div>
      <div style={{
        fontSize: 14, fontWeight: 800,
        fontFamily: "'JetBrains Mono', monospace",
        color,
        textShadow: `0 0 10px ${glow}`,
        lineHeight: 1,
      }}>
        {value}
      </div>
    </div>
  );
}

function FinRow({
  label, value, color, large,
}: {
  label: string;
  value: string;
  color: string;
  large?: boolean;
}) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: large ? 0 : 7,
    }}>
      <span style={{ fontSize: large ? 12 : 11, color: large ? '#e8edf5' : '#8a9ab5', fontWeight: large ? 700 : 400 }}>
        {label}
      </span>
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: large ? 14 : 12,
        fontWeight: large ? 900 : 700,
        color,
        textShadow: large ? `0 0 10px ${color}66` : 'none',
      }}>
        {value}
      </span>
    </div>
  );
}

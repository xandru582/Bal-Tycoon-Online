import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, formatNumber } from '../stores/gameStore';
import { GlassCard, StatCard, ActionButton, Badge, ProgressBar, MiniChart } from '../components/ui/GlassCard';
import type { RivalCompany } from '../core/economy/Rivals';

// ─── Colour tokens ────────────────────────────────────────────
const C = {
  amber:   '#f59e0b',
  violet:  '#8b5cf6',
  emerald: '#10b981',
  rose:    '#f43f5e',
  orange:  '#f97316',
  gold:    '#fbbf24',
  text1:   '#e8edf5',
  text2:   '#8a9ab5',
  text3:   '#4a5568',
  surface: 'rgba(17,24,39,0.82)',
  mono:    "'JetBrains Mono', ui-monospace, monospace",
};

const PERSONALITY_COLOR: Record<string, string> = {
  aggressive:   C.rose,
  conservative: C.violet,
  opportunist:  C.orange,
  innovator:    C.emerald,
  copycat:      C.text2,
};
const PERSONALITY_LABEL: Record<string, string> = {
  aggressive:   'AGRESIVO',
  conservative: 'CONSERVADOR',
  opportunist:  'OPORTUNISTA',
  innovator:    'INNOVADOR',
  copycat:      'IMITADOR',
};
const PERSONALITY_ICON: Record<string, string> = {
  aggressive: '⚔️', conservative: '🛡️', opportunist: '🎲', innovator: '🔬', copycat: '🪞',
};

function RelBar({ value }: { value: number }) {
  const pct = ((value + 100) / 200) * 100;
  const color = value > 20 ? C.emerald : value < -20 ? C.rose : C.amber;
  return (
    <div style={{ position: 'relative', height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.15)' }} />
      <div style={{
        position: 'absolute', top: 0, bottom: 0, borderRadius: 4,
        background: color,
        left: value >= 0 ? '50%' : `${pct}%`,
        width: `${Math.abs(value) / 2}%`,
      }} />
    </div>
  );
}

function ThreatMeter({ level }: { level: number }) {
  const color = level > 70 ? C.rose : level > 40 ? C.orange : level > 20 ? C.amber : C.emerald;
  const label = level > 70 ? 'CRÍTICA' : level > 40 ? 'ALTA' : level > 20 ? 'MEDIA' : 'BAJA';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 9, color: C.text3, letterSpacing: 1 }}>AMENAZA</span>
        <span style={{ fontSize: 9, fontWeight: 800, color, fontFamily: C.mono }}>{label} {level}/100</span>
      </div>
      <ProgressBar value={level} max={100} color={color} height={5} showPct={false} />
    </div>
  );
}

// ─── Main View ────────────────────────────────────────────────
export default function RivalsView() {
  const { rivalManager, credits, currentDay, influence, buyIntelligence, declareRivalry, proposeAlliance, sabotageRival, _rev } = useGameStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: string; rivalId: string } | null>(null);
  const [tab, setTab] = useState<'rivals' | 'log' | 'ranking'>('rivals');
  const [intelOpen, setIntelOpen] = useState<string | null>(null);

  const rivals = rivalManager.rivals;
  const eventLog = rivalManager.eventLog;
  const rankings = rivalManager.getRankings(credits, 'Tu Sindicato');

  const selected = rivals.find(r => r.id === selectedId) ?? null;

  const recentIntel = useMemo(() => {
    if (!intelOpen) return null;
    return rivalManager.getIntelligenceReport(intelOpen);
  }, [intelOpen, _rev]);

  // Dynamic costs: % of player wealth — always feels expensive no matter how rich you are
  const dynCost = useMemo(() => {
    return {
      intel:    Math.max(500,    Math.ceil(credits * 0.03)),   // 3% — cheap intel is cheap info
      alliance: Math.max(2_000,  Math.ceil(credits * 0.08)),   // 8% — buying goodwill costs real money
      sabotage: Math.max(5_000,  Math.ceil(credits * 0.18)),   // 18% — hurting someone should hurt you first
    };
  }, [credits]);

  const handleAction = (type: string, rivalId: string) => {
    if (type === 'intel') { buyIntelligence(rivalId, dynCost.intel); setIntelOpen(rivalId); return; }
    setConfirmAction({ type, rivalId });
  };

  const executeAction = () => {
    if (!confirmAction) return;
    const { type, rivalId } = confirmAction;
    if (type === 'rivalry') declareRivalry(rivalId);
    else if (type === 'alliance') proposeAlliance(rivalId, dynCost.alliance);
    else if (type === 'sabotage') sabotageRival(rivalId, dynCost.sabotage);
    setConfirmAction(null);
  };

  const ACTION_DEFS = [
    { type: 'intel',    label: '🔍 Comprar Intel',     cost: dynCost.intel,    desc: 'Informe detallado de fortalezas, debilidades y próximos movimientos.',  color: C.violet,  disabled: credits < dynCost.intel },
    { type: 'alliance', label: '🤝 Proponer Alianza',   cost: dynCost.alliance, desc: 'Mejora la relación +25 pts. Reduce agresividad y nivel de amenaza.',    color: C.emerald, disabled: credits < dynCost.alliance },
    { type: 'rivalry',  label: '⚔️ Declarar Rivalidad', cost: 0,               desc: 'Activa presión competitiva. El rival se vuelve más agresivo contigo.',  color: C.amber,   disabled: false },
    { type: 'sabotage', label: '💣 Sabotear',            cost: dynCost.sabotage,desc: 'Daña cash y reputación del rival (-5% patrimonio, -8 rep). Riesgo alto.', color: C.rose,  disabled: credits < dynCost.sabotage },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ── Header ── */}
      <div style={{ flexShrink: 0, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: -0.5 }}>
              <span style={{ color: C.amber }}>RIVALIDAD</span>{' '}
              <span style={{ color: C.text2, fontSize: 14, fontWeight: 500 }}>CORPORATIVA</span>
            </h2>
            <p style={{ color: C.text2, fontSize: 12, margin: '3px 0 0' }}>
              5 rivales con IA compiten contigo en tiempo real. Espía, alíate o sabotéalos.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['rivals', 'ranking', 'log'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                background: tab === t ? `rgba(245,158,11,0.15)` : 'rgba(255,255,255,0.04)',
                border: tab === t ? `1px solid rgba(245,158,11,0.35)` : '1px solid rgba(255,255,255,0.07)',
                color: tab === t ? C.amber : C.text3,
                transition: 'all 0.15s',
              }}>
                {t === 'rivals' ? '🏢 Rivales' : t === 'ranking' ? '🏆 Ranking' : '📰 Actividad'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12, flexShrink: 0 }}>
        <StatCard label="Posición" value={`#${rankings.find(r => r.isPlayer)?.rank ?? '?'}`} icon="🏆" small color={C.amber} />
        <StatCard label="Rivales Activos" value={rivals.length} icon="🏢" small />
        <StatCard label="Amenazas Críticas" value={rivals.filter(r => r.threatLevel > 60).length} icon="⚠️" small color={C.rose} />
        <StatCard label="Influencia" value={`◆ ${formatNumber(influence)}`} icon="⭐" small color={C.violet} />
      </div>

      {/* ══════════════════════════════════════════ TAB: RIVALES */}
      {tab === 'rivals' && (
        <div style={{ flex: 1, display: 'flex', gap: 12, overflow: 'hidden' }}>

          {/* Left: Rival cards */}
          <div style={{ width: 300, flexShrink: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rivals.map(rival => {
              const pColor = PERSONALITY_COLOR[rival.personality] ?? C.text2;
              const isSelected = selectedId === rival.id;
              const isHostile = rival.relationship < -20;
              const isFriendly = rival.relationship > 20;
              return (
                <motion.div
                  key={rival.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setSelectedId(isSelected ? null : rival.id)}
                  style={{
                    padding: 14, borderRadius: 12, cursor: 'pointer',
                    background: isSelected ? 'rgba(245,158,11,0.06)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isSelected ? rival.color : 'rgba(255,255,255,0.07)'}`,
                    borderLeft: `3px solid ${rival.color}`,
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: rival.color }}>{rival.name}</div>
                      <div style={{ fontSize: 11, color: C.text2, marginTop: 1 }}>{rival.ownerName} · {rival.ownerTitle}</div>
                    </div>
                    <Badge color={pColor} size="xs">{PERSONALITY_ICON[rival.personality]} {PERSONALITY_LABEL[rival.personality]}</Badge>
                  </div>

                  <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: C.mono, fontSize: 11, fontWeight: 700, color: C.amber }}>
                      Đ{formatNumber(rival.netWorth)}
                    </span>
                    <span style={{ fontSize: 10, color: C.text3 }}>•</span>
                    <span style={{ fontSize: 10, color: isHostile ? C.rose : isFriendly ? C.emerald : C.text3 }}>
                      {isHostile ? '😡 Hostil' : isFriendly ? '😊 Amistoso' : '😐 Neutral'}
                    </span>
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <ThreatMeter level={rival.threatLevel} />
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Right: Detail panel */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <AnimatePresence mode="wait">
              {selected ? (
                <motion.div key={selected.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

                  {/* Header card */}
                  <GlassCard style={{ padding: 16, borderLeft: `4px solid ${selected.color}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 22, fontWeight: 900, color: selected.color }}>{selected.name}</div>
                        <div style={{ fontSize: 13, color: C.text2, marginTop: 2 }}>{selected.ownerName} · {selected.ownerTitle}</div>
                        <div style={{ fontSize: 11, color: C.text3, marginTop: 2, fontStyle: 'italic' }}>{selected.tagline}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <Badge color={PERSONALITY_COLOR[selected.personality]}>
                          {PERSONALITY_ICON[selected.personality]} {PERSONALITY_LABEL[selected.personality]}
                        </Badge>
                        <div style={{ fontSize: 10, color: C.text3, marginTop: 4 }}>Sector: {selected.sector}</div>
                        <div style={{ fontSize: 10, color: C.text3 }}>Nivel: {selected.level} · Día {selected.founded}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: C.text2, marginTop: 10, lineHeight: 1.6, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
                      {selected.backstory}
                    </div>
                  </GlassCard>

                  {/* Stats grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    <StatCard label="Patrimonio" value={`Đ${formatNumber(selected.netWorth)}`} icon="💰" small color={C.amber} />
                    <StatCard label="Efectivo" value={`Đ${formatNumber(selected.cash)}`} icon="💵" small />
                    <StatCard label="Empleados" value={selected.workerCount} icon="👥" small />
                    <StatCard label="Reputación" value={`${Math.round(selected.reputation)}/100`} icon="⭐" small color={selected.reputation > 70 ? C.emerald : selected.reputation < 40 ? C.rose : C.amber} />
                  </div>

                  {/* Relationship + Threat */}
                  <GlassCard style={{ padding: 14 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <div style={{ fontSize: 10, color: C.text3, letterSpacing: 1, marginBottom: 6 }}>RELACIÓN CONTIGO</div>
                        <RelBar value={selected.relationship} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                          <span style={{ fontSize: 9, color: C.rose }}>Hostil -100</span>
                          <span style={{ fontSize: 11, fontWeight: 800, color: selected.relationship > 20 ? C.emerald : selected.relationship < -20 ? C.rose : C.amber, fontFamily: C.mono }}>
                            {selected.relationship > 0 ? '+' : ''}{selected.relationship}
                          </span>
                          <span style={{ fontSize: 9, color: C.emerald }}>+100 Aliado</span>
                        </div>
                      </div>
                      <div>
                        <ThreatMeter level={selected.threatLevel} />
                        <div style={{ fontSize: 10, color: C.text3, marginTop: 6 }}>
                          Estrategia: <span style={{ color: C.text2, fontStyle: 'italic' }}>"{selected.currentStrategy}"</span>
                        </div>
                      </div>
                    </div>
                  </GlassCard>

                  {/* Market share */}
                  {Object.keys(selected.marketShare).length > 0 && (
                    <GlassCard style={{ padding: 14 }}>
                      <div style={{ fontSize: 10, color: C.text3, letterSpacing: 1, marginBottom: 10 }}>CUOTA DE MERCADO</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {Object.entries(selected.marketShare).filter(([, v]) => v > 0).slice(0, 6).map(([market, share]) => (
                          <div key={market}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                              <span style={{ fontSize: 11, color: C.text2 }}>{market.replace(/_/g, ' ')}</span>
                              <span style={{ fontSize: 11, fontFamily: C.mono, fontWeight: 700, color: selected.color }}>{typeof share === 'number' ? share.toFixed(1) : share}%</span>
                            </div>
                            <ProgressBar value={typeof share === 'number' ? share : 0} max={100} color={selected.color} height={4} showPct={false} />
                          </div>
                        ))}
                      </div>
                    </GlassCard>
                  )}

                  {/* Recent actions */}
                  <GlassCard style={{ padding: 14 }}>
                    <div style={{ fontSize: 10, color: C.text3, letterSpacing: 1, marginBottom: 8 }}>ACTIVIDAD RECIENTE</div>
                    {selected.recentActions.length === 0 ? (
                      <div style={{ fontSize: 12, color: C.text3 }}>Sin actividad registrada todavía.</div>
                    ) : selected.recentActions.map((action, i) => (
                      <div key={i} style={{
                        fontSize: 12, color: C.text2, padding: '6px 0',
                        borderBottom: i < selected.recentActions.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                        display: 'flex', gap: 8, alignItems: 'flex-start',
                      }}>
                        <span style={{ flexShrink: 0, color: C.text3 }}>▸</span>
                        <span>{action}</span>
                      </div>
                    ))}
                  </GlassCard>

                  {/* Intelligence report */}
                  {intelOpen === selected.id && recentIntel && (
                    <GlassCard style={{ padding: 14, border: `1px solid rgba(139,92,246,0.3)`, background: 'rgba(139,92,246,0.05)' }}>
                      <div style={{ fontSize: 10, color: C.violet, letterSpacing: 1, marginBottom: 10, fontWeight: 800 }}>
                        🔍 INFORME DE INTELIGENCIA — DÍA {recentIntel.generatedDay}
                      </div>
                      <div style={{ fontSize: 12, color: C.text2, marginBottom: 10, lineHeight: 1.5 }}>{recentIntel.summary}</div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                        <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
                          <div style={{ fontSize: 9, color: C.emerald, letterSpacing: 1, marginBottom: 6 }}>✅ FORTALEZAS</div>
                          {recentIntel.strengths.map((s, i) => <div key={i} style={{ fontSize: 11, color: C.text2, marginBottom: 3 }}>• {s}</div>)}
                        </div>
                        <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.2)' }}>
                          <div style={{ fontSize: 9, color: C.rose, letterSpacing: 1, marginBottom: 6 }}>⚠️ DEBILIDADES</div>
                          {recentIntel.weaknesses.map((w, i) => <div key={i} style={{ fontSize: 11, color: C.text2, marginBottom: 3 }}>• {w}</div>)}
                        </div>
                      </div>

                      <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', marginBottom: 10 }}>
                        <div style={{ fontSize: 9, color: C.amber, letterSpacing: 1, marginBottom: 4 }}>🎯 PRÓXIMO MOVIMIENTO ESTIMADO</div>
                        <div style={{ fontSize: 12, color: C.text1 }}>{recentIntel.predictedNextMove}</div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                        {[
                          { l: 'Efectivo estimado', v: `Đ${formatNumber(recentIntel.financialEstimate.estimatedCash)}` },
                          { l: 'Patrimonio estimado', v: `Đ${formatNumber(recentIntel.financialEstimate.estimatedNetWorth)}` },
                          { l: 'Ingresos/mes est.', v: `Đ${formatNumber(recentIntel.financialEstimate.estimatedMonthlyRevenue)}` },
                        ].map(({ l, v }) => (
                          <div key={l} style={{ textAlign: 'center', padding: '6px 4px', borderRadius: 6, background: 'rgba(255,255,255,0.03)' }}>
                            <div style={{ fontSize: 9, color: C.text3, marginBottom: 2 }}>{l}</div>
                            <div style={{ fontSize: 12, fontFamily: C.mono, fontWeight: 700, color: C.amber }}>{v}</div>
                          </div>
                        ))}
                      </div>

                      <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 8, background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)' }}>
                        <div style={{ fontSize: 9, color: C.rose, letterSpacing: 1, marginBottom: 2 }}>EVALUACIÓN DE AMENAZA</div>
                        <div style={{ fontSize: 12, color: C.text2 }}>{recentIntel.threatAssessment}</div>
                      </div>
                    </GlassCard>
                  )}

                  {/* Action buttons */}
                  <GlassCard style={{ padding: 14 }}>
                    <div style={{ fontSize: 10, color: C.text3, letterSpacing: 1, marginBottom: 10 }}>ACCIONES DISPONIBLES</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {ACTION_DEFS.map(({ type, label, cost, desc, color, disabled }) => (
                        <button
                          key={type}
                          disabled={disabled}
                          onClick={() => handleAction(type, selected.id)}
                          style={{
                            padding: '10px 12px', borderRadius: 10, cursor: disabled ? 'not-allowed' : 'pointer',
                            background: disabled ? 'rgba(255,255,255,0.02)' : `rgba(${color === C.rose ? '244,63,94' : color === C.emerald ? '16,185,129' : color === C.violet ? '139,92,246' : '245,158,11'},0.08)`,
                            border: `1px solid ${disabled ? 'rgba(255,255,255,0.06)' : color + '44'}`,
                            color: disabled ? C.text3 : C.text1,
                            textAlign: 'left', opacity: disabled ? 0.5 : 1,
                            transition: 'all 0.15s',
                          }}
                        >
                          <div style={{ fontSize: 12, fontWeight: 800, color: disabled ? C.text3 : color, marginBottom: 3 }}>{label}</div>
                          <div style={{ fontSize: 10, color: C.text3, lineHeight: 1.4 }}>{desc}</div>
                          {cost > 0 && (
                            <div style={{ fontSize: 10, fontFamily: C.mono, color: disabled ? C.rose : C.amber, marginTop: 4 }}>
                              Coste: Đ{cost.toLocaleString()}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </GlassCard>

                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    height: 200, color: C.text3, gap: 8,
                  }}>
                    <div style={{ fontSize: 48 }}>🏢</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Selecciona un rival para ver sus detalles</div>
                    <div style={{ fontSize: 11 }}>y acceder a las acciones disponibles</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════ TAB: RANKING */}
      {tab === 'ranking' && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{
              display: 'grid', gridTemplateColumns: '40px 1fr 120px 100px 80px',
              padding: '8px 16px', gap: 0,
              background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)',
              fontSize: 9, fontWeight: 700, color: C.text3, letterSpacing: 0.8,
            }}>
              <span>RK</span><span>EMPRESA</span><span style={{ textAlign: 'right' }}>PATRIMONIO</span>
              <span style={{ textAlign: 'right' }}>REPUTACIÓN</span><span style={{ textAlign: 'right' }}>AMENAZA</span>
            </div>
            {rankings.map((r, i) => {
              const rival = rivals.find(rv => rv.id === r.id);
              return (
                <motion.div key={r.id}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  onClick={() => { if (!r.isPlayer && rival) { setSelectedId(r.id); setTab('rivals'); } }}
                  style={{
                    display: 'grid', gridTemplateColumns: '40px 1fr 120px 100px 80px',
                    padding: '12px 16px', gap: 0,
                    borderBottom: i < rankings.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    background: r.isPlayer ? 'rgba(245,158,11,0.06)' : 'transparent',
                    cursor: r.isPlayer ? 'default' : 'pointer',
                    alignItems: 'center',
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 16, fontWeight: 900, color: r.rank <= 3 ? C.amber : C.text3 }}>#{r.rank}</span>
                    {r.change !== 0 && (
                      <span style={{ fontSize: 9, color: r.change > 0 ? C.emerald : C.rose }}>
                        {r.change > 0 ? '▲' : '▼'}{Math.abs(r.change)}
                      </span>
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: r.isPlayer ? 800 : 600, color: rival?.color ?? C.amber }}>
                      {r.name} {r.isPlayer && <Badge color={C.amber} size="xs">TÚ</Badge>}
                    </div>
                    <div style={{ fontSize: 10, color: C.text3 }}>{r.ownerName} · {r.sector}</div>
                  </div>
                  <div style={{ textAlign: 'right', fontFamily: C.mono, fontSize: 13, fontWeight: 800, color: C.amber }}>
                    Đ{formatNumber(r.netWorth)}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <ProgressBar value={r.reputation} max={100} color={r.reputation > 70 ? C.emerald : C.amber} height={4} showPct={false} />
                    <div style={{ fontSize: 9, color: C.text3, marginTop: 2 }}>{Math.round(r.reputation)}/100</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {rival ? (
                      <Badge color={rival.threatLevel > 60 ? C.rose : rival.threatLevel > 30 ? C.amber : C.emerald} size="xs">
                        {rival.threatLevel}/100
                      </Badge>
                    ) : <span style={{ fontSize: 10, color: C.text3 }}>—</span>}
                  </div>
                </motion.div>
              );
            })}
          </GlassCard>
        </div>
      )}

      {/* ══════════════════════════════════════════ TAB: LOG */}
      {tab === 'log' && (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {eventLog.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: C.text3 }}>Sin actividad rival registrada aún.</div>
          ) : [...eventLog].reverse().map((e, i) => {
            const rival = rivals.find(r => r.id === e.rivalId);
            const icon = e.type === 'attack' ? '⚔️' : e.type === 'expansion' ? '📈' : e.type === 'product_launch' ? '🚀' : e.type === 'scandal' ? '💥' : e.type === 'retreat' ? '📉' : '📰';
            const color = e.type === 'attack' ? C.rose : e.type === 'expansion' || e.type === 'product_launch' ? C.emerald : C.text2;
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.02, 0.3) }}
                style={{
                  display: 'flex', gap: 12, padding: '10px 14px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                  alignItems: 'flex-start', cursor: rival ? 'pointer' : 'default',
                }}
                onClick={() => { if (rival) { setSelectedId(rival.id); setTab('rivals'); } }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: `rgba(${color === C.rose ? '244,63,94' : color === C.emerald ? '16,185,129' : '255,255,255'},0.08)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                }}>{icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: rival?.color ?? C.text2 }}>{rival?.name ?? e.rivalId}</span>
                    <span style={{ fontSize: 10, color: C.text3, fontFamily: C.mono }}>Día {e.day}</span>
                  </div>
                  <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.4 }}>{e.description}</div>
                  {e.impactOnPlayer && e.impactOnPlayer !== 0 && (
                    <div style={{ fontSize: 10, color: e.impactOnPlayer < 0 ? C.rose : C.emerald, marginTop: 3 }}>
                      Impacto: {e.impactOnPlayer > 0 ? '+' : ''}{e.impactOnPlayer} pts
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Confirm Dialog ── */}
      <AnimatePresence>
        {confirmAction && (() => {
          const rival = rivals.find(r => r.id === confirmAction.rivalId);
          const actionDef = ACTION_DEFS.find(a => a.type === confirmAction.type);
          if (!rival || !actionDef) return null;
          return (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000,
                display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)',
              }}
              onClick={() => setConfirmAction(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                onClick={e => e.stopPropagation()}
                style={{
                  background: 'rgba(17,24,39,0.98)', border: `1px solid ${actionDef.color}44`,
                  borderRadius: 16, padding: 24, width: 360, boxShadow: `0 0 40px ${actionDef.color}22`,
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 800, color: actionDef.color, marginBottom: 8 }}>{actionDef.label}</div>
                <div style={{ fontSize: 13, color: C.text2, marginBottom: 12, lineHeight: 1.5 }}>
                  ¿Confirmas esta acción contra <strong style={{ color: rival.color }}>{rival.name}</strong>?
                </div>
                <div style={{ fontSize: 12, color: C.text3, marginBottom: 16, padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                  {actionDef.desc}
                </div>
                {actionDef.cost > 0 && (
                  <div style={{ fontSize: 12, fontFamily: C.mono, color: C.amber, marginBottom: 16 }}>
                    Coste: Đ{actionDef.cost.toLocaleString()}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <ActionButton variant="ghost" fullWidth onClick={() => setConfirmAction(null)}>Cancelar</ActionButton>
                  <ActionButton variant={confirmAction.type === 'sabotage' || confirmAction.type === 'rivalry' ? 'danger' : confirmAction.type === 'alliance' ? 'success' : 'primary'} fullWidth onClick={executeAction}>
                    Confirmar
                  </ActionButton>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}

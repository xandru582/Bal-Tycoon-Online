import React, { useState, useMemo } from 'react';
import { useGameStore, formatNumber } from '../stores/gameStore';

// ─── Colores ─────────────────────────────────────────────────────────────────
const C = {
  bg:          'rgba(9,12,24,0.98)',
  card:        'rgba(16,21,34,0.92)',
  cardHover:   'rgba(22,28,44,0.96)',
  border:      'rgba(255,255,255,0.07)',
  borderCyan:  'rgba(245,158,11,0.32)',
  borderGreen: 'rgba(16,185,129,0.32)',
  borderRed:   'rgba(244,63,94,0.32)',
  borderGold:  'rgba(251,191,36,0.32)',
  cyan:        '#f59e0b',
  green:       '#10b981',
  red:         '#f43f5e',
  gold:        '#fbbf24',
  orange:      '#f97316',
  purple:      '#8b5cf6',
  text1:       '#eef2f8',
  text2:       '#94a3b8',
  text3:       '#475569',
  mono:        "'JetBrains Mono', monospace",
};

const TYPE_ICONS: Record<string, string> = {
  supply: '📦', distribution: '🚛', licensing: '📜',
  exclusivity: '🔒', joint_venture: '🤝', franchise: '🏪',
};
const TYPE_LABELS: Record<string, string> = {
  supply: 'Suministro', distribution: 'Distribución', licensing: 'Licencias',
  exclusivity: 'Exclusividad', joint_venture: 'Joint Venture', franchise: 'Franquicia',
};
const RISK_COLOR: Record<string, string> = {
  low: '#10b981', medium: '#fbbf24', high: '#f43f5e',
};
const RISK_LABEL: Record<string, string> = {
  low: 'BAJO', medium: 'MEDIO', high: 'ALTO',
};

// ─── Componentes pequeños ────────────────────────────────────────────────────
function Pill({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 999,
      fontSize: 9, fontWeight: 800, letterSpacing: 0.8,
      background: color + '18', border: `1px solid ${color}44`, color,
    }}>
      {children}
    </span>
  );
}

function Btn({
  children, onClick, color = C.cyan, disabled,
}: {
  children: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  color?: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '9px 20px', borderRadius: 8, border: `1px solid ${color}55`,
        background: disabled ? 'rgba(255,255,255,0.04)' : `linear-gradient(135deg, ${color}cc, ${color}88)`,
        color: disabled ? C.text3 : '#000',
        fontSize: 12, fontWeight: 800, cursor: disabled ? 'not-allowed' : 'pointer',
        whiteSpace: 'nowrap', transition: 'all 0.15s',
        fontFamily: C.mono,
      }}
    >
      {children}
    </button>
  );
}

function KpiBox({
  label, value, sub, color,
}: {
  label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div style={{
      padding: '14px 16px', borderRadius: 10,
      background: C.card, border: `1px solid ${C.border}`,
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{ fontSize: 9, color: C.text3, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 900, color: color ?? C.text1, fontFamily: C.mono }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 10, color: C.text3 }}>{sub}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
export default function ContractsView() {
  const {
    contractManager, currentDay, _rev,
    acceptContract, breachContract, fulfillDelivery, engine,
  } = useGameStore();

  const [tab, setTab] = useState<'offers' | 'active' | 'history'>('offers');
  const [deliverQty, setDeliverQty] = useState<Record<string, number>>({});
  const [confirmBreach, setConfirmBreach] = useState<string | null>(null);

  // Datos del contractManager
  const available = contractManager.available;
  const active    = contractManager.active;
  const history   = contractManager.history;
  const mrr       = contractManager.getMonthlyRecurringRevenue();
  const avgPerf   = contractManager.getAveragePerformanceScore();
  const totalRisk = contractManager.getTotalPenaltiesRisk();
  const totalEarned = useMemo(
    () => history.reduce((s, c) => s + c.totalPaid, 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [history.length, _rev],
  );
  const inventory = engine?.playerCompany?.inventory ?? new Map<string, number>();

  const void_rev = _rev; // consumimos _rev para que re-render funcione

  // ─── Tabs ────────────────────────────────────────────────────────────────
  const TABS = [
    { id: 'offers',  label: `📬 Ofertas (${available.length})` },
    { id: 'active',  label: `📋 Activos (${active.length})` },
    { id: 'history', label: `📁 Historial (${history.length})` },
  ] as const;

  // ─── Render ofertas ───────────────────────────────────────────────────────
  const renderOffers = () => {
    if (available.length === 0) {
      return (
        <div style={{
          padding: 60, textAlign: 'center',
          background: C.card, borderRadius: 12, border: `1px solid ${C.border}`,
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.text1, marginBottom: 6 }}>
            Sin ofertas disponibles
          </div>
          <div style={{ fontSize: 12, color: C.text3 }}>
            Las nuevas ofertas se renuevan cada 7 días. Mejora tu reputación para atraer mejores contratos.
          </div>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {available.map(offer => {
          const icon       = TYPE_ICONS[offer.type] ?? '📄';
          const typeLabel  = TYPE_LABELS[offer.type] ?? offer.type;
          const riskColor  = RISK_COLOR[offer.riskLevel] ?? C.text2;
          const riskLabel  = RISK_LABEL[offer.riskLevel] ?? offer.riskLevel;
          const totalVal   = offer.monthlyValue * offer.duration;
          const daysLeft   = offer.expiresOn - currentDay;
          const stockQty   = inventory.get(offer.productId) ?? 0;
          const minQty     = offer.requirements?.minQuantity ?? 0;

          return (
            <div
              key={offer.id}
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              {/* ── Cabecera ── */}
              <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                {/* Icono */}
                <div style={{
                  width: 52, height: 52, borderRadius: 12, flexShrink: 0,
                  background: `rgba(245,158,11,0.10)`, border: `1px solid ${C.borderCyan}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 26,
                }}>
                  {icon}
                </div>

                {/* Info central */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: C.text1, marginBottom: 5 }}>
                    {offer.counterpartyName}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Pill color={C.cyan}>{typeLabel}</Pill>
                    <Pill color={riskColor}>{riskLabel} RIESGO</Pill>
                    <span style={{ fontSize: 10, color: C.text3 }}>{offer.duration} meses</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      color: daysLeft <= 3 ? C.red : daysLeft <= 7 ? C.gold : C.text3,
                    }}>
                      ⏱ {daysLeft}d para expirar
                    </span>
                  </div>
                </div>

                {/* Valor + botón */}
                <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: C.green, fontFamily: C.mono, lineHeight: 1 }}>
                      Đ{formatNumber(offer.monthlyValue)}
                    </div>
                    <div style={{ fontSize: 10, color: C.text3 }}>por mes</div>
                    <div style={{ fontSize: 10, color: C.text2, marginTop: 2, fontFamily: C.mono }}>
                      Total: Đ{formatNumber(totalVal)}
                    </div>
                  </div>
                  <Btn
                    color={C.green}
                    onClick={(e) => {
                      e.stopPropagation();
                      acceptContract(offer.id);
                    }}
                  >
                    ✍️ FIRMAR CONTRATO
                  </Btn>
                </div>
              </div>

              {/* ── Detalles ── */}
              <div style={{
                borderTop: `1px solid ${C.border}`,
                padding: '12px 20px',
                background: 'rgba(0,0,0,0.20)',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 10,
              }}>
                <div>
                  <div style={{ fontSize: 9, color: C.text3, marginBottom: 3, letterSpacing: 1 }}>CANT. MÍN.</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.cyan, fontFamily: C.mono }}>
                    {minQty > 0 ? `${minQty} uds/mes` : '—'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: C.text3, marginBottom: 3, letterSpacing: 1 }}>CALIDAD MÍN.</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.purple, fontFamily: C.mono }}>
                    {offer.requirements?.minQuality ?? '—'}/100
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: C.text3, marginBottom: 3, letterSpacing: 1 }}>PENALIZACIÓN</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.red, fontFamily: C.mono }}>
                    Đ{formatNumber(offer.penalties?.breach ?? 0)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: C.text3, marginBottom: 3, letterSpacing: 1 }}>TU STOCK</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: stockQty >= minQty ? C.green : C.orange, fontFamily: C.mono }}>
                    {formatNumber(stockQty)} uds
                    {stockQty < minQty && minQty > 0 && (
                      <span style={{ fontSize: 9, color: C.orange, marginLeft: 4 }}>⚠️ insuf.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ─── Render activos ───────────────────────────────────────────────────────
  const renderActive = () => {
    if (active.length === 0) {
      return (
        <div style={{
          padding: 60, textAlign: 'center',
          background: C.card, borderRadius: 12, border: `1px solid ${C.border}`,
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.text1, marginBottom: 6 }}>
            Sin contratos activos
          </div>
          <div style={{ fontSize: 12, color: C.text3 }}>
            Acepta una oferta de la pestaña <span style={{ color: C.cyan }}>Ofertas</span> para empezar.
          </div>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {active.map(c => {
          const icon      = TYPE_ICONS[c.type] ?? '📄';
          const endDay    = c.startedOn + c.duration * 30;
          const daysLeft  = Math.max(0, endDay - currentDay);
          const progress  = Math.min(100, ((currentDay - c.startedOn) / Math.max(1, endDay - c.startedOn)) * 100);
          const perfColor = c.performanceScore >= 80 ? C.green : c.performanceScore >= 60 ? C.gold : c.performanceScore >= 40 ? C.orange : C.red;
          const hasPending = c.pendingDeliveryUnits > 0;
          const qty       = deliverQty[c.id] ?? Math.min(c.pendingDeliveryUnits, 10);
          const stockQty  = inventory.get(c.productId) ?? 0;
          const isBreaching = confirmBreach === c.id;

          return (
            <div
              key={c.id}
              style={{
                background: C.card,
                border: `1px solid ${hasPending ? C.borderGreen : C.border}`,
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              {/* Barra de progreso superior */}
              <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0,
                  width: `${progress}%`,
                  background: `linear-gradient(90deg, ${C.cyan}, ${C.purple})`,
                  transition: 'width 0.6s ease',
                }} />
              </div>

              {/* ── Cabecera ── */}
              <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                {/* Icono */}
                <div style={{
                  width: 52, height: 52, borderRadius: 12, flexShrink: 0,
                  background: `rgba(16,185,129,0.10)`, border: `1px solid ${C.borderGreen}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 26,
                }}>
                  {icon}
                </div>

                {/* Info central */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: C.text1, marginBottom: 5 }}>
                    {c.counterpartyName}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 }}>
                    <Pill color={C.cyan}>{TYPE_LABELS[c.type] ?? c.type}</Pill>
                    <Pill color={perfColor}>Score {c.performanceScore}/100</Pill>
                    <span style={{ fontSize: 10, color: C.text3 }}>Día {c.startedOn} → Día {endDay}</span>
                    <span style={{ fontSize: 10, color: daysLeft <= 15 ? C.orange : C.text3 }}>
                      {daysLeft}d restantes
                    </span>
                  </div>
                  {/* Progreso texto */}
                  <div style={{
                    fontSize: 10, color: C.text3,
                    display: 'flex', gap: 12,
                  }}>
                    <span>💰 Đ{formatNumber(c.monthlyValue)}/mes</span>
                    <span>📊 {Math.round(progress)}% completado</span>
                    <span>🧾 {c.paymentsReceived} pagos recibidos</span>
                  </div>
                </div>

                {/* Valor total */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 11, color: C.text3, marginBottom: 2 }}>COBRADO</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: C.green, fontFamily: C.mono }}>
                    Đ{formatNumber(c.totalPaid)}
                  </div>
                  <div style={{ fontSize: 10, color: C.text3 }}>de Đ{formatNumber(c.monthlyValue * c.duration)} total</div>
                </div>
              </div>

              {/* ── Panel de entrega ── */}
              {hasPending ? (
                <div style={{
                  borderTop: `1px solid ${C.borderGreen}`,
                  padding: '14px 20px',
                  background: 'rgba(16,185,129,0.05)',
                }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: C.green, marginBottom: 10 }}>
                    📦 {c.pendingDeliveryUnits} UDS PENDIENTES DE ENTREGA
                    {c.productId && (
                      <span style={{ fontWeight: 400, color: C.text3, marginLeft: 8, fontFamily: C.mono, fontSize: 10 }}>
                        Producto: {c.productId.replace(/_/g, ' ')} · Stock: {formatNumber(stockQty)} uds
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeliverQty(prev => ({
                          ...prev,
                          [c.id]: Math.max(1, (deliverQty[c.id] ?? Math.min(c.pendingDeliveryUnits, 10)) - 1),
                        }));
                      }}
                      style={{
                        width: 34, height: 34, borderRadius: 6, border: `1px solid ${C.border}`,
                        background: 'rgba(255,255,255,0.06)', color: C.text1, fontSize: 18,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >−</button>
                    <input
                      type="number"
                      min={1}
                      max={c.pendingDeliveryUnits}
                      value={qty}
                      onChange={e => {
                        e.stopPropagation();
                        setDeliverQty(prev => ({
                          ...prev,
                          [c.id]: Math.min(c.pendingDeliveryUnits, Math.max(1, Number(e.target.value))),
                        }));
                      }}
                      onClick={e => e.stopPropagation()}
                      style={{
                        width: 80, textAlign: 'center',
                        background: 'rgba(0,0,0,0.4)', border: `1px solid ${C.borderGreen}`,
                        color: C.green, padding: '6px 10px', borderRadius: 6,
                        fontFamily: C.mono, fontSize: 15, fontWeight: 700,
                      }}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeliverQty(prev => ({
                          ...prev,
                          [c.id]: Math.min(c.pendingDeliveryUnits, (deliverQty[c.id] ?? Math.min(c.pendingDeliveryUnits, 10)) + 1),
                        }));
                      }}
                      style={{
                        width: 34, height: 34, borderRadius: 6, border: `1px solid ${C.border}`,
                        background: 'rgba(255,255,255,0.06)', color: C.text1, fontSize: 18,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >+</button>
                    <Btn
                      color={C.green}
                      onClick={(e) => {
                        e.stopPropagation();
                        fulfillDelivery(c.id, qty);
                      }}
                    >
                      📦 Entregar {qty} uds
                    </Btn>
                    <Btn
                      color={C.cyan}
                      onClick={(e) => {
                        e.stopPropagation();
                        fulfillDelivery(c.id, c.pendingDeliveryUnits);
                      }}
                    >
                      Entregar todo ({c.pendingDeliveryUnits})
                    </Btn>
                  </div>
                </div>
              ) : (
                <div style={{
                  borderTop: `1px solid ${C.border}`,
                  padding: '10px 20px',
                  background: 'rgba(0,0,0,0.15)',
                  fontSize: 11, color: C.text3,
                }}>
                  ✅ Sin entregas pendientes — próximo ciclo se asignará automáticamente
                </div>
              )}

              {/* ── Romper contrato ── */}
              <div style={{
                borderTop: `1px solid ${C.border}`,
                padding: '10px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(0,0,0,0.10)',
              }}>
                <div style={{ fontSize: 10, color: C.text3 }}>
                  Penalización por ruptura:{' '}
                  <span style={{ color: C.red, fontFamily: C.mono, fontWeight: 700 }}>
                    Đ{formatNumber(c.penalties?.breach ?? 0)}
                  </span>
                </div>
                {!isBreaching ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmBreach(c.id); }}
                    style={{
                      padding: '5px 14px', borderRadius: 6, border: `1px solid ${C.borderRed}`,
                      background: 'transparent', color: C.red, fontSize: 11, cursor: 'pointer',
                      fontWeight: 700,
                    }}
                  >
                    ✕ Romper contrato
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: C.red, fontWeight: 700 }}>
                      ¿Confirmar? Perderás Đ{formatNumber(c.penalties?.breach ?? 0)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        breachContract(c.id);
                        setConfirmBreach(null);
                      }}
                      style={{
                        padding: '5px 14px', borderRadius: 6, border: `1px solid ${C.borderRed}`,
                        background: 'rgba(244,63,94,0.15)', color: C.red, fontSize: 11, cursor: 'pointer',
                        fontWeight: 800,
                      }}
                    >
                      SÍ, ROMPER
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmBreach(null); }}
                      style={{
                        padding: '5px 14px', borderRadius: 6, border: `1px solid ${C.border}`,
                        background: 'transparent', color: C.text2, fontSize: 11, cursor: 'pointer',
                        fontWeight: 700,
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ─── Render historial ─────────────────────────────────────────────────────
  const renderHistory = () => {
    if (history.length === 0) {
      return (
        <div style={{
          padding: 60, textAlign: 'center',
          background: C.card, borderRadius: 12, border: `1px solid ${C.border}`,
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📁</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.text1, marginBottom: 6 }}>Sin historial</div>
          <div style={{ fontSize: 12, color: C.text3 }}>Completa o rompe un contrato para verlo aquí.</div>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[...history].reverse().map(c => {
          const isComplete = c.status === 'completed';
          const perfColor = c.performanceScore >= 80 ? C.green : c.performanceScore >= 60 ? C.gold : c.performanceScore >= 40 ? C.orange : C.red;
          return (
            <div key={c.id} style={{
              padding: '14px 20px',
              background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 10,
              display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: isComplete ? 'rgba(16,185,129,0.10)' : 'rgba(244,63,94,0.10)',
                border: `1px solid ${isComplete ? C.borderGreen : C.borderRed}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20,
              }}>
                {TYPE_ICONS[c.type] ?? '📄'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text1, marginBottom: 3 }}>
                  {c.counterpartyName}
                </div>
                <div style={{ fontSize: 10, color: C.text3 }}>
                  {TYPE_LABELS[c.type]} · {c.duration} meses · {c.paymentsReceived} pagos · Score: {c.performanceScore}/100
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Pill color={isComplete ? C.green : C.red}>
                  {isComplete ? '✅ COMPLETADO' : '❌ RESCINDIDO'}
                </Pill>
                <div style={{ fontSize: 16, fontWeight: 800, color: isComplete ? C.green : C.text3, fontFamily: C.mono, marginTop: 4 }}>
                  Đ{formatNumber(c.totalPaid)}
                </div>
                <Pill color={perfColor}>{c.performanceScore}/100</Pill>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ─── Render principal ─────────────────────────────────────────────────────
  const _ = void_rev; // suppress unused warning
  void _;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Header */}
      <div style={{ flexShrink: 0 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: C.text1, margin: '0 0 4px 0' }}>
          Contratos B2B
          <span style={{ fontSize: 12, color: C.text3, fontWeight: 400, marginLeft: 10 }}>día {currentDay}</span>
        </h2>
        <p style={{ color: C.text3, fontSize: 11, margin: 0 }}>
          Firma contratos, cumple entregas y cobra pagos mensuales. Evita penalizaciones.
        </p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, flexShrink: 0 }}>
        <KpiBox
          label="Ingresos/Mes"
          value={`Đ${formatNumber(mrr)}`}
          sub={`${active.length} contratos activos`}
          color={mrr > 0 ? C.green : C.text2}
        />
        <KpiBox
          label="Rendimiento"
          value={`${avgPerf}/100`}
          sub={avgPerf >= 80 ? 'Excelente' : avgPerf >= 60 ? 'Bueno' : avgPerf >= 40 ? 'Regular' : 'Crítico'}
          color={avgPerf >= 80 ? C.green : avgPerf >= 60 ? C.gold : avgPerf >= 40 ? C.orange : C.red}
        />
        <KpiBox
          label="Riesgo Penaliz."
          value={`Đ${formatNumber(totalRisk)}`}
          color={totalRisk > 50000 ? C.red : totalRisk > 10000 ? C.orange : C.text2}
        />
        <KpiBox
          label="Completados"
          value={history.filter(c => c.status === 'completed').length}
          sub={`${history.filter(c => c.status === 'breached').length} rescindidos`}
          color={C.cyan}
        />
        <KpiBox
          label="Total Cobrado"
          value={`Đ${formatNumber(totalEarned)}`}
          sub="histórico"
          color={C.purple}
        />
      </div>

      {/* Alerta de entregas pendientes */}
      {active.some(c => c.pendingDeliveryUnits > 0) && (
        <div style={{
          flexShrink: 0,
          padding: '12px 16px', borderRadius: 10,
          background: 'rgba(16,185,129,0.08)', border: `1px solid ${C.borderGreen}`,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 22 }}>📦</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: C.green }}>
              ENTREGAS PENDIENTES
            </div>
            <div style={{ fontSize: 10, color: C.text2 }}>
              {active.filter(c => c.pendingDeliveryUnits > 0)
                .map(c => `${c.counterpartyName} (${c.pendingDeliveryUnits} uds)`)
                .join(' · ')}
            </div>
          </div>
          <button
            onClick={() => setTab('active')}
            style={{
              marginLeft: 'auto', padding: '7px 16px', borderRadius: 8,
              background: 'rgba(16,185,129,0.15)', border: `1px solid ${C.borderGreen}`,
              color: C.green, fontSize: 11, fontWeight: 800, cursor: 'pointer',
            }}
          >
            Ver contratos →
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ flexShrink: 0, display: 'flex', gap: 4, background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: 4 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: '9px 16px', borderRadius: 8,
              background: tab === t.id
                ? 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(139,92,246,0.10))'
                : 'transparent',
              border: tab === t.id ? `1px solid ${C.borderCyan}` : '1px solid transparent',
              color: tab === t.id ? C.cyan : C.text3,
              fontSize: 12, fontWeight: tab === t.id ? 800 : 600,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenido del tab */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
        {tab === 'offers'   && renderOffers()}
        {tab === 'active'   && renderActive()}
        {tab === 'history'  && renderHistory()}
      </div>
    </div>
  );
}

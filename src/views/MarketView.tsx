import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, formatNumber } from '../stores/gameStore';
import { GlassCard, StatCard, MiniChart, ActionButton, TabBar, Badge, ProgressBar, SectionHeader, Divider } from '../components/ui/GlassCard';

// ─── Colour tokens (matching global CSS vars) ──────────────────────────────
const C = {
  cyan:    '#f59e0b',
  purple:  '#8b5cf6',
  green:   '#10b981',
  gold:    '#fbbf24',
  red:     '#f43f5e',
  orange:  '#f97316',
  text1:   '#e8edf5',
  text2:   '#8a9ab5',
  text3:   '#4a5568',
  surface: 'rgba(17,24,39,0.82)',
  mono:    "'JetBrains Mono', ui-monospace, monospace",
};

// ─── Signal styles ──────────────────────────────────────────────────────────
const SIGNAL_COLOR: Record<string, string> = {
  strong_buy:  C.green,
  buy:         '#4ade80',
  hold:        C.gold,
  sell:        C.orange,
  strong_sell: C.red,
};

// ─── Product name formatter ─────────────────────────────────────────────────
function formatName(id: string): string {
  return id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// ─── Category icon map ──────────────────────────────────────────────────────
const CAT_ICON: Record<string, string> = {
  commodities: '⛏️',
  energy:      '⚡',
  agriculture: '🌾',
  metals:      '🪙',
  tech:        '💻',
  chemicals:   '⚗️',
  livestock:   '🐄',
  luxury:      '💎',
  all:         '🌐',
};

// ─── Profit margin estimator ────────────────────────────────────────────────
function estimateProfitMargin(history: number[], currentPrice: number): { pct: number; good: boolean } {
  if (history.length < 5) return { pct: 0, good: false };
  const avg = history.reduce((a, b) => a + b, 0) / history.length;
  const pct = ((avg - currentPrice) / currentPrice) * 100;
  return { pct, good: pct > 3 };
}

// ─── Portfolio allocation bar ───────────────────────────────────────────────
function AllocationBar({ items }: { items: { label: string; value: number; color: string }[] }) {
  const total = items.reduce((a, b) => a + b.value, 0);
  if (total === 0) return null;
  return (
    <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', gap: 1 }}>
      {items.filter(i => i.value > 0).map(i => (
        <div
          key={i.label}
          title={`${i.label}: ${((i.value / total) * 100).toFixed(1)}%`}
          style={{
            flex: i.value / total,
            background: i.color,
            minWidth: 2,
          }}
        />
      ))}
    </div>
  );
}

// ─── Quantity Input with presets ────────────────────────────────────────────
function QtyInput({
  value, onChange, max, min = 1,
}: {
  value: number;
  onChange: (v: number) => void;
  max?: number;
  min?: number;
}) {
  const presets = [1, 10, 50, 100, 500];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          style={{
            width: 28, height: 28, borderRadius: 6, border: `1px solid rgba(255,255,255,0.12)`,
            background: 'rgba(255,255,255,0.06)', color: C.text1, cursor: 'pointer', fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
          }}
        >−</button>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={e => {
            const v = parseInt(e.target.value) || min;
            onChange(max ? Math.min(max, Math.max(min, v)) : Math.max(min, v));
          }}
          style={{
            flex: 1, padding: '5px 8px', borderRadius: 6, textAlign: 'center',
            border: `1px solid rgba(245,158,11,0.25)`, background: 'rgba(245,158,11,0.06)',
            color: C.cyan, fontFamily: C.mono, fontSize: 13, fontWeight: 700,
            outline: 'none', minWidth: 0,
          }}
        />
        <button
          onClick={() => onChange(max ? Math.min(max, value + 1) : value + 1)}
          style={{
            width: 28, height: 28, borderRadius: 6, border: `1px solid rgba(255,255,255,0.12)`,
            background: 'rgba(255,255,255,0.06)', color: C.text1, cursor: 'pointer', fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
          }}
        >+</button>
      </div>
      <div style={{ display: 'flex', gap: 3 }}>
        {presets.filter(p => !max || p <= max).map(p => (
          <button
            key={p}
            onClick={() => onChange(p)}
            style={{
              flex: 1, padding: '3px 0', borderRadius: 4, fontSize: 10, fontWeight: 700, cursor: 'pointer',
              border: `1px solid ${value === p ? C.cyan + '55' : 'rgba(255,255,255,0.08)'}`,
              background: value === p ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.03)',
              color: value === p ? C.cyan : C.text3, transition: 'all 0.12s ease',
            }}
          >{p}</button>
        ))}
        {max && max > 0 && !presets.includes(max) && (
          <button
            onClick={() => onChange(max)}
            style={{
              flex: 1, padding: '3px 0', borderRadius: 4, fontSize: 10, fontWeight: 700, cursor: 'pointer',
              border: `1px solid ${value === max ? C.red + '55' : 'rgba(255,255,255,0.08)'}`,
              background: value === max ? 'rgba(244,63,94,0.10)' : 'rgba(255,255,255,0.03)',
              color: value === max ? C.red : C.text3, transition: 'all 0.12s ease',
            }}
          >MAX</button>
        )}
      </div>
    </div>
  );
}

// ─── Product detail panel (expanded) ────────────────────────────────────────
function ProductDetail({
  p, credits, onBuy, onSell, held,
}: {
  p: any; credits: number; onBuy: (qty: number) => void; onSell: (qty: number) => void; held: number;
}) {
  const [buyQty, setBuyQty]   = useState(1);
  const [sellQty, setSellQty] = useState(1);
  const buyCost    = buyQty * p.currentPrice;
  const canBuy     = credits >= buyCost;
  const canSell    = held >= sellQty;
  const sellRevenue = sellQty * p.currentPrice;
  const margin     = estimateProfitMargin(p.history, p.currentPrice);
  const signal     = p.analysis?.trendSignal;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.22 }}
      style={{ overflow: 'hidden' }}
    >
      <div style={{
        marginTop: 12,
        padding: 14,
        borderRadius: 10,
        background: 'rgba(245,158,11,0.04)',
        border: '1px solid rgba(245,158,11,0.12)',
      }}>
        {/* Price chart full width */}
        {p.history.length > 1 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: C.text3, marginBottom: 4, fontWeight: 600, letterSpacing: 0.5 }}>
              HISTORIAL DE PRECIOS (30 DÍAS)
            </div>
            <MiniChart data={p.history} width={320} height={52} color="auto" />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
              <span style={{ fontSize: 9, color: C.text3, fontFamily: C.mono }}>
                MIN Đ{Math.min(...p.history).toFixed(2)}
              </span>
              <span style={{ fontSize: 9, color: C.text3, fontFamily: C.mono }}>
                MED Đ{(p.history.reduce((a: number, b: number) => a + b, 0) / p.history.length).toFixed(2)}
              </span>
              <span style={{ fontSize: 9, color: C.text3, fontFamily: C.mono }}>
                MAX Đ{Math.max(...p.history).toFixed(2)}
              </span>
            </div>
          </div>
        )}

        <Divider />

        {/* Indicators row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: C.text3, marginBottom: 3 }}>RSI</div>
            <div style={{
              fontSize: 15, fontWeight: 800, fontFamily: C.mono,
              color: p.analysis?.rsi > 70 ? C.red : p.analysis?.rsi < 30 ? C.green : C.gold,
            }}>
              {p.analysis?.rsi?.toFixed(0) ?? '--'}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: C.text3, marginBottom: 3 }}>VOL 24H</div>
            <div style={{ fontSize: 15, fontWeight: 800, fontFamily: C.mono, color: C.cyan }}>
              {p.volume24h ?? '--'}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: C.text3, marginBottom: 3 }}>MARGEN EST.</div>
            <div style={{
              fontSize: 15, fontWeight: 800, fontFamily: C.mono,
              color: margin.pct > 0 ? C.green : C.red,
            }}>
              {margin.pct > 0 ? '+' : ''}{margin.pct.toFixed(1)}%
            </div>
          </div>
        </div>

        {margin.good && (
          <div style={{
            padding: '6px 10px', borderRadius: 6, marginBottom: 10,
            background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)',
            fontSize: 11, color: C.green, fontWeight: 600,
          }}>
            OPORTUNIDAD: El precio está {margin.pct.toFixed(1)}% por debajo de la media histórica — potencial de ganancia
          </div>
        )}

        {/* Signal */}
        {signal && (
          <div style={{ marginBottom: 10 }}>
            <Badge color={SIGNAL_COLOR[signal] ?? C.text2}>{signal.replace('_', ' ')}</Badge>
          </div>
        )}

        <Divider />

        {/* BUY panel */}
        <div style={{ display: 'grid', gridTemplateColumns: held > 0 ? '1fr 1fr' : '1fr', gap: 12, marginTop: 10 }}>
          {/* Buy */}
          <div>
            <div style={{ fontSize: 10, color: C.text3, fontWeight: 700, marginBottom: 8, letterSpacing: 0.5 }}>
              COMPRAR
            </div>
            <QtyInput value={buyQty} onChange={setBuyQty} />
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                <span style={{ color: C.text3 }}>Coste total</span>
                <span style={{
                  fontFamily: C.mono, fontWeight: 800,
                  color: canBuy ? C.cyan : C.red,
                }}>Đ{formatNumber(buyCost)}</span>
              </div>
              {!canBuy && (
                <div style={{ fontSize: 10, color: C.red, marginBottom: 4 }}>
                  Faltan Đ{formatNumber(buyCost - credits)}
                </div>
              )}
              <ActionButton
                variant="primary" fullWidth disabled={!canBuy}
                onClick={() => { onBuy(buyQty); }}
              >
                COMPRAR {buyQty} UNIDAD{buyQty !== 1 ? 'ES' : ''}
              </ActionButton>
            </div>
          </div>

          {/* Sell */}
          {held > 0 && (
            <div>
              <div style={{ fontSize: 10, color: C.text3, fontWeight: 700, marginBottom: 8, letterSpacing: 0.5 }}>
                VENDER ({held} en stock)
              </div>
              <QtyInput value={sellQty} onChange={setSellQty} max={held} />
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: C.text3 }}>Ingreso</span>
                  <span style={{ fontFamily: C.mono, fontWeight: 800, color: C.green }}>
                    +Đ{formatNumber(sellRevenue)}
                  </span>
                </div>
                <ActionButton
                  variant="danger" fullWidth disabled={!canSell}
                  onClick={() => { onSell(sellQty); }}
                >
                  VENDER {sellQty} UNIDAD{sellQty !== 1 ? 'ES' : ''}
                </ActionButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MarketView — Main component
// ═══════════════════════════════════════════════════════════════════════════
export default function MarketView() {
  const { engine, credits, currentDay, buyFromMarket, sellFromMarket } = useGameStore();
  const company = engine.playerCompany;

  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [tab, setTab]           = useState('all');
  const [search, setSearch]     = useState('');
  const [sortKey, setSortKey]   = useState<'name' | 'price' | 'change' | 'volume' | 'held'>('change');
  const [sortDir, setSortDir]   = useState<'asc' | 'desc'>('desc');
  const [bulkProduct, setBulkProduct] = useState<string>('');
  const [bulkQty, setBulkQty]   = useState(10);

  // ── Collect all products from all markets ────────────────────────────────
  const allProducts: any[] = useMemo(() => {
    const out: any[] = [];
    for (const m of engine.markets.values()) {
      for (const p of m.getAllProductStates()) {
        const hist = m.getPriceHistory(p.productId, 30);
        const analysis = m.getTechnicalAnalysis(p.productId);
        out.push({
          ...p,
          history: hist.map((h: any) => h.price),
          analysis,
          marketId:   m.id,
          marketName: m.name,
          category:   m.category ?? 'otros',
        });
      }
    }
    return out;
  }, [engine, currentDay]);

  // ── Inventory totals ─────────────────────────────────────────────────────
  const inventoryValue = useMemo(() => {
    let total = 0;
    for (const p of allProducts) {
      const held = company?.inventory.get(p.productId) ?? 0;
      total += held * p.currentPrice;
    }
    return total;
  }, [allProducts, company]);

  const inventoryCount = useMemo(() => {
    let total = 0;
    for (const p of allProducts) {
      total += company?.inventory.get(p.productId) ?? 0;
    }
    return total;
  }, [allProducts, company]);

  // ── Category allocation for bar ──────────────────────────────────────────
  const catAllocation = useMemo(() => {
    const colors = [C.cyan, C.purple, C.green, C.gold, C.orange, C.red, '#a78bfa', '#34d399'];
    const cats = [...new Set(allProducts.map(p => p.category))];
    return cats.map((cat, i) => {
      const val = allProducts
        .filter(p => p.category === cat)
        .reduce((sum, p) => sum + (company?.inventory.get(p.productId) ?? 0) * p.currentPrice, 0);
      return { label: cat as string, value: val, color: colors[i % colors.length] };
    });
  }, [allProducts, company, currentDay]);

  // ── Categories ───────────────────────────────────────────────────────────
  const categories = useMemo(() => ['all', ...new Set(allProducts.map(p => p.category))], [allProducts]);

  // ── Filter + sort ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = tab === 'all' ? allProducts : allProducts.filter(p => p.category === tab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.productId.toLowerCase().includes(q) ||
        (p.marketName ?? '').toLowerCase().includes(q) ||
        (p.category ?? '').toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      let av: number, bv: number;
      if (sortKey === 'name')   { av = a.productId.localeCompare(b.productId); return sortDir === 'asc' ? av : -av; }
      if (sortKey === 'price')  { av = a.currentPrice; bv = b.currentPrice; }
      else if (sortKey === 'change') { av = Math.abs(a.changePercent); bv = Math.abs(b.changePercent); }
      else if (sortKey === 'volume') { av = a.volume24h ?? 0; bv = b.volume24h ?? 0; }
      else { av = company?.inventory.get(a.productId) ?? 0; bv = company?.inventory.get(b.productId) ?? 0; }
      return sortDir === 'asc' ? av! - bv! : bv! - av!;
    });
  }, [allProducts, tab, search, sortKey, sortDir, company, currentDay]);

  // ── Opportunities (top buy signals) ─────────────────────────────────────
  const opportunities = useMemo(() =>
    allProducts
      .filter(p => {
        const margin = estimateProfitMargin(p.history, p.currentPrice);
        return margin.pct > 5;
      })
      .sort((a, b) => {
        const ma = estimateProfitMargin(a.history, a.currentPrice);
        const mb = estimateProfitMargin(b.history, b.currentPrice);
        return mb.pct - ma.pct;
      })
      .slice(0, 4),
  [allProducts, currentDay]);

  // ── Bulk buy product lookup ──────────────────────────────────────────────
  const bulkTarget = allProducts.find(p => p.productId === bulkProduct) ?? allProducts[0];

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ── TOP HEADER ──────────────────────────────────────────────────── */}
      <div style={{ flexShrink: 0, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: -0.5 }}>
              <span style={{ color: C.cyan }}>MERCADO</span>{' '}
              <span style={{ color: C.text2, fontSize: 14, fontWeight: 500 }}>GLOBAL</span>
            </h2>
            <p style={{ color: C.text3, fontSize: 11, margin: '2px 0 0', letterSpacing: 0.3 }}>
              DÍA {currentDay} · {allProducts.length} PRODUCTOS · {categories.length - 1} CATEGORÍAS
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: C.text3, marginBottom: 2 }}>CRÉDITOS DISPONIBLES</div>
            <div style={{ fontFamily: C.mono, fontSize: 20, fontWeight: 900, color: C.gold }}>
              Đ{formatNumber(credits)}
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI ROW ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12, flexShrink: 0 }}>
        <StatCard
          label="Inventario Valor"
          value={`Đ${formatNumber(inventoryValue)}`}
          icon="📦" small
          color={C.cyan}
          trend={inventoryValue > 0 ? 'up' : 'neutral'}
        />
        <StatCard
          label="Unidades Totales"
          value={formatNumber(inventoryCount)}
          icon="🗃️" small
          color={C.purple}
        />
        <StatCard
          label="Oportunidades"
          value={opportunities.length}
          icon="🎯" small
          color={C.green}
        />
        <StatCard
          label="Mercados Activos"
          value={engine.markets.size}
          icon="🌐" small
          color={C.gold}
        />
      </div>

      {/* ── INVENTORY ALLOCATION BAR ────────────────────────────────────── */}
      {inventoryValue > 0 && (
        <GlassCard style={{ padding: 12, marginBottom: 10, flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 10, color: C.text3, fontWeight: 700, letterSpacing: 0.5 }}>
              DISTRIBUCIÓN DE INVENTARIO POR CATEGORÍA
            </span>
            <span style={{ fontSize: 10, color: C.cyan, fontFamily: C.mono, fontWeight: 700 }}>
              Đ{formatNumber(inventoryValue)} TOTAL
            </span>
          </div>
          <AllocationBar items={catAllocation} />
          <div style={{ display: 'flex', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
            {catAllocation.filter(c => c.value > 0).map(c => (
              <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: c.color }} />
                <span style={{ fontSize: 9, color: C.text3, textTransform: 'capitalize' }}>
                  {c.label} {((c.value / inventoryValue) * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* ── BULK BUY PANEL ──────────────────────────────────────────────── */}
      {allProducts.length > 0 && (
        <GlassCard style={{ padding: 14, marginBottom: 12, flexShrink: 0 }} glowColor={C.gold}>
          <SectionHeader title="PANEL DE COMPRA RÁPIDA" badge={
            <Badge color={C.gold} size="xs">BULK</Badge>
          } />
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            {/* Product selector */}
            <div style={{ flex: 2, minWidth: 180 }}>
              <div style={{ fontSize: 10, color: C.text3, marginBottom: 4, fontWeight: 600 }}>PRODUCTO</div>
              <select
                value={bulkProduct || (allProducts[0]?.productId ?? '')}
                onChange={e => setBulkProduct(e.target.value)}
                style={{
                  width: '100%', padding: '7px 10px', borderRadius: 8,
                  border: `1px solid rgba(255,214,10,0.25)`, background: 'rgba(255,214,10,0.06)',
                  color: C.gold, fontFamily: C.mono, fontSize: 12, fontWeight: 700, outline: 'none',
                }}
              >
                {allProducts.map(p => (
                  <option key={p.productId} value={p.productId} style={{ background: '#111827' }}>
                    {formatName(p.productId)} — Đ{p.currentPrice.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            {/* Qty input */}
            <div style={{ flex: 1.5, minWidth: 160 }}>
              <div style={{ fontSize: 10, color: C.text3, marginBottom: 4, fontWeight: 600 }}>CANTIDAD</div>
              <QtyInput value={bulkQty} onChange={setBulkQty} />
            </div>

            {/* Info + action */}
            <div style={{ flex: 1.5, minWidth: 160 }}>
              {bulkTarget && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6 }}>
                    <span style={{ color: C.text3 }}>Coste total</span>
                    <span style={{ fontFamily: C.mono, fontWeight: 800, color: credits >= bulkTarget.currentPrice * bulkQty ? C.gold : C.red }}>
                      Đ{formatNumber(bulkTarget.currentPrice * bulkQty)}
                    </span>
                  </div>
                  {(() => {
                    const m = estimateProfitMargin(bulkTarget.history, bulkTarget.currentPrice);
                    return m.pct !== 0 && (
                      <div style={{ fontSize: 10, color: m.pct > 0 ? C.green : C.orange, marginBottom: 6 }}>
                        Margen estimado: {m.pct > 0 ? '+' : ''}{m.pct.toFixed(1)}% vs media histórica
                      </div>
                    );
                  })()}
                  <ActionButton
                    variant="gold"
                    fullWidth
                    disabled={credits < bulkTarget.currentPrice * bulkQty}
                    onClick={() => buyFromMarket(bulkTarget.productId, bulkQty)}
                  >
                    COMPRAR {bulkQty}× {formatName(bulkTarget.productId).split(' ')[0]}
                  </ActionButton>
                </>
              )}
            </div>
          </div>
        </GlassCard>
      )}

      {/* ── OPORTUNIDADES DESTACADAS ─────────────────────────────────────── */}
      {opportunities.length > 0 && (
        <div style={{ marginBottom: 12, flexShrink: 0 }}>
          <SectionHeader title="OPORTUNIDADES DE COMPRA" badge={
            <Badge color={C.green} size="xs">HOT</Badge>
          } />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
            {opportunities.map(p => {
              const m = estimateProfitMargin(p.history, p.currentPrice);
              const held = company?.inventory.get(p.productId) ?? 0;
              return (
                <GlassCard
                  key={p.productId}
                  glowColor={C.green}
                  style={{ padding: 12, cursor: 'pointer' }}
                  onClick={() => setSelectedProduct(selectedProduct === p.productId ? null : p.productId)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.text1 }}>
                        {formatName(p.productId)}
                      </div>
                      <div style={{ fontSize: 10, color: C.text3, marginTop: 1 }}>{p.category}</div>
                    </div>
                    <div style={{
                      padding: '2px 8px', borderRadius: 4,
                      background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
                      fontSize: 12, fontWeight: 800, color: C.green, fontFamily: C.mono,
                    }}>
                      +{m.pct.toFixed(1)}%
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                    <span style={{ fontSize: 11, fontFamily: C.mono, color: C.cyan, fontWeight: 700 }}>
                      Đ{p.currentPrice.toFixed(2)}
                    </span>
                    {held > 0 && (
                      <span style={{ fontSize: 10, color: C.purple }}>📦 {held}</span>
                    )}
                  </div>
                  {p.history.length > 1 && (
                    <MiniChart data={p.history} width={200} height={24} color={C.green} />
                  )}
                </GlassCard>
              );
            })}
          </div>
        </div>
      )}

      {/* ── CATEGORY TABS ────────────────────────────────────────────────── */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setTab(cat)}
              style={{
                padding: '5px 12px', borderRadius: 20,
                border: `1px solid ${tab === cat ? C.cyan + '44' : 'rgba(255,255,255,0.08)'}`,
                background: tab === cat ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.03)',
                color: tab === cat ? C.cyan : C.text3,
                fontSize: 11, fontWeight: 700, cursor: 'pointer',
                transition: 'all 0.12s ease', display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              <span>{CAT_ICON[cat] ?? '📦'}</span>
              <span style={{ textTransform: 'capitalize' }}>{cat === 'all' ? 'Todos' : cat}</span>
            </button>
          ))}
        </div>

        {/* Search + Sort bar */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <span style={{
              position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
              fontSize: 12, color: C.text3, pointerEvents: 'none',
            }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar producto..."
              style={{
                width: '100%', padding: '7px 12px 7px 30px', borderRadius: 8,
                border: `1px solid rgba(255,255,255,0.1)`,
                background: 'rgba(255,255,255,0.04)', color: C.text1,
                fontSize: 12, outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['price', 'change', 'volume', 'held'] as const).map(k => (
              <button
                key={k}
                onClick={() => toggleSort(k)}
                style={{
                  padding: '5px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer',
                  border: `1px solid ${sortKey === k ? C.purple + '44' : 'rgba(255,255,255,0.08)'}`,
                  background: sortKey === k ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.03)',
                  color: sortKey === k ? C.purple : C.text3, transition: 'all 0.12s ease',
                  display: 'flex', alignItems: 'center', gap: 3,
                }}
              >
                {k === 'price' ? 'Precio' : k === 'change' ? 'Cambio' : k === 'volume' ? 'Vol' : 'Stock'}
                {sortKey === k && <span style={{ fontSize: 8 }}>{sortDir === 'desc' ? '▼' : '▲'}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── PRODUCT GRID ─────────────────────────────────────────────────── */}
      <div style={{
        flex: 1, overflowY: 'auto',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
        gap: 10, alignContent: 'start',
      }}>
        <AnimatePresence>
          {filtered.map((p, idx) => {
            const isUp    = p.changePercent >= 0;
            const priceColor = isUp ? C.green : C.red;
            const held    = company?.inventory.get(p.productId) ?? 0;
            const signal  = p.analysis?.trendSignal;
            const isOpen  = selectedProduct === p.productId;
            const margin  = estimateProfitMargin(p.history, p.currentPrice);
            const heldVal = held * p.currentPrice;

            return (
              <motion.div
                key={p.productId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.18, delay: Math.min(idx * 0.02, 0.3) }}
              >
                <GlassCard
                  glowColor={isOpen ? C.cyan : (held > 0 ? C.purple : undefined)}
                  style={{
                    padding: 14, display: 'flex', flexDirection: 'column', gap: 8,
                    border: isOpen ? `1px solid ${C.cyan}44` : held > 0 ? `1px solid ${C.purple}33` : undefined,
                  }}
                >
                  {/* ─ Card Header ─ */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 1 }}>
                        <span style={{ fontSize: 13 }}>{CAT_ICON[p.category] ?? '📦'}</span>
                        <div style={{ fontSize: 14, fontWeight: 800, color: C.text1, lineHeight: 1.2 }}>
                          {formatName(p.productId)}
                        </div>
                      </div>
                      <div style={{ fontSize: 10, color: C.text3, letterSpacing: 0.5 }}>
                        {p.category?.toUpperCase()} · {p.marketName}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
                      <div style={{ fontFamily: C.mono, fontSize: 19, fontWeight: 900, color: C.text1 }}>
                        Đ{p.currentPrice.toFixed(2)}
                      </div>
                      <div style={{
                        fontSize: 12, fontWeight: 700, color: priceColor,
                        display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2,
                      }}>
                        {isUp ? '▲' : '▼'} {Math.abs(p.changePercent).toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  {/* ─ Mini chart ─ */}
                  {p.history.length > 1 && (
                    <MiniChart data={p.history} width={260} height={30} color="auto" />
                  )}

                  {/* ─ Indicators row ─ */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    {signal && (
                      <Badge color={SIGNAL_COLOR[signal] ?? C.text2} size="xs">
                        {signal.replace('_', ' ')}
                      </Badge>
                    )}
                    {p.analysis?.rsi != null && (
                      <span style={{
                        fontSize: 10, fontFamily: C.mono,
                        color: p.analysis.rsi > 70 ? C.red : p.analysis.rsi < 30 ? C.green : C.text3,
                      }}>
                        RSI {p.analysis.rsi.toFixed(0)}
                      </span>
                    )}
                    {margin.pct !== 0 && (
                      <span style={{ fontSize: 10, color: margin.pct > 0 ? C.green : C.red, fontWeight: 700 }}>
                        {margin.pct > 0 ? '▲' : '▼'} {Math.abs(margin.pct).toFixed(1)}% vs avg
                      </span>
                    )}
                    <span style={{
                      fontSize: 10, color: C.text3, marginLeft: 'auto',
                    }}>
                      Vol: {p.volume24h ?? '--'}
                    </span>
                  </div>

                  {/* ─ Inventory badge ─ */}
                  {held > 0 && (
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '6px 10px', borderRadius: 6,
                      background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)',
                    }}>
                      <span style={{ fontSize: 11, color: C.purple, fontWeight: 700 }}>
                        📦 {held} unidades en stock
                      </span>
                      <span style={{ fontSize: 11, fontFamily: C.mono, color: C.purple, fontWeight: 800 }}>
                        Đ{formatNumber(heldVal)}
                      </span>
                    </div>
                  )}

                  {/* ─ Quick actions ─ */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[1, 10, 100].map(qty => (
                      <ActionButton
                        key={qty} size="sm" variant="primary"
                        disabled={credits < p.currentPrice * qty}
                        onClick={() => buyFromMarket(p.productId, qty)}
                        style={{ flex: 1, fontSize: 10 }}
                      >
                        +{qty}
                      </ActionButton>
                    ))}
                    {held > 0 && (
                      <ActionButton
                        size="sm" variant="danger"
                        onClick={() => sellFromMarket(p.productId, Math.min(10, held))}
                        style={{ fontSize: 10, minWidth: 38 }}
                      >
                        −{Math.min(10, held)}
                      </ActionButton>
                    )}
                    <ActionButton
                      size="sm" variant="ghost"
                      onClick={() => setSelectedProduct(isOpen ? null : p.productId)}
                      style={{ fontSize: 10, minWidth: 34 }}
                    >
                      {isOpen ? '▲' : '▼'}
                    </ActionButton>
                  </div>

                  {/* ─ Expanded detail panel ─ */}
                  <AnimatePresence>
                    {isOpen && (
                      <ProductDetail
                        p={p}
                        credits={credits}
                        held={held}
                        onBuy={qty => buyFromMarket(p.productId, qty)}
                        onSell={qty => sellFromMarket(p.productId, qty)}
                      />
                    )}
                  </AnimatePresence>
                </GlassCard>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div style={{
            gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px',
            color: C.text3, fontSize: 13,
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
            No se encontraron productos para "{search}"
          </div>
        )}
      </div>
    </div>
  );
}

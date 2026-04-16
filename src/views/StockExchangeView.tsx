import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, formatNumber } from '../stores/gameStore';
import { GlassCard, StatCard, ActionButton, MiniChart, Badge, TabBar, Divider, SectionHeader, ProgressBar } from '../components/ui/GlassCard';

// ─── Colour tokens ──────────────────────────────────────────────────────────
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

// ─── Sector icons ────────────────────────────────────────────────────────────
const SECTOR_ICON: Record<string, string> = {
  tech:        '💻',
  energy:      '⚡',
  finance:     '🏦',
  health:      '🏥',
  industrial:  '🏭',
  consumer:    '🛒',
  materials:   '⛏️',
  utilities:   '🔌',
  real_estate: '🏗️',
  crypto:      '₿',
};

// ─── Signal colour + label ──────────────────────────────────────────────────
function signalStyle(signal: string): { color: string; label: string } {
  switch (signal) {
    case 'strong_buy':  return { color: C.green,  label: 'STRONG BUY' };
    case 'buy':         return { color: '#4ade80', label: 'BUY' };
    case 'hold':        return { color: C.gold,   label: 'HOLD' };
    case 'sell':        return { color: C.orange, label: 'SELL' };
    case 'strong_sell': return { color: C.red,    label: 'STRONG SELL' };
    default:            return { color: C.text3,  label: signal?.toUpperCase() ?? '—' };
  }
}

// ─── P&L colour helper ──────────────────────────────────────────────────────
function pnlColor(v: number): string {
  if (v > 0) return C.green;
  if (v < 0) return C.red;
  return C.text3;
}

// ─── Qty input (trading terminal style) ─────────────────────────────────────
function TradeInput({
  label, value, onChange, max, color = C.cyan, presets,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  max?: number;
  color?: string;
  presets?: number[];
}) {
  const defaults = presets ?? [1, 5, 10, 50, 100];
  return (
    <div>
      <div style={{ fontSize: 9, color: C.text3, letterSpacing: 0.6, fontWeight: 700, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
        <button
          onClick={() => onChange(Math.max(1, value - 1))}
          style={{
            width: 26, height: 26, borderRadius: 5, border: `1px solid rgba(255,255,255,0.1)`,
            background: 'rgba(255,255,255,0.05)', color: C.text1, cursor: 'pointer',
            fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >−</button>
        <input
          type="number" value={value} min={1} max={max}
          onChange={e => {
            const v = parseInt(e.target.value) || 1;
            onChange(max ? Math.min(max, Math.max(1, v)) : Math.max(1, v));
          }}
          style={{
            flex: 1, padding: '4px 6px', borderRadius: 5, textAlign: 'center',
            border: `1px solid ${color}33`, background: `${color}09`,
            color, fontFamily: C.mono, fontSize: 13, fontWeight: 700, outline: 'none',
          }}
        />
        <button
          onClick={() => onChange(max ? Math.min(max, value + 1) : value + 1)}
          style={{
            width: 26, height: 26, borderRadius: 5, border: `1px solid rgba(255,255,255,0.1)`,
            background: 'rgba(255,255,255,0.05)', color: C.text1, cursor: 'pointer',
            fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >+</button>
      </div>
      <div style={{ display: 'flex', gap: 2 }}>
        {defaults.filter(p => !max || p <= max).map(p => (
          <button key={p} onClick={() => onChange(p)} style={{
            flex: 1, padding: '2px 0', borderRadius: 3, fontSize: 9, fontWeight: 700, cursor: 'pointer',
            border: `1px solid ${value === p ? color + '55' : 'rgba(255,255,255,0.07)'}`,
            background: value === p ? `${color}12` : 'rgba(255,255,255,0.02)',
            color: value === p ? color : C.text3, transition: 'all 0.1s',
          }}>{p}</button>
        ))}
        {max && max > 0 && ![...defaults].includes(max) && (
          <button onClick={() => onChange(max)} style={{
            flex: 1, padding: '2px 0', borderRadius: 3, fontSize: 9, fontWeight: 700, cursor: 'pointer',
            border: `1px solid ${value === max ? C.red + '55' : 'rgba(255,255,255,0.07)'}`,
            background: value === max ? 'rgba(244,63,94,0.10)' : 'rgba(255,255,255,0.02)',
            color: value === max ? C.red : C.text3, transition: 'all 0.1s',
          }}>ALL</button>
        )}
      </div>
    </div>
  );
}

// ─── Portfolio donut / bar ───────────────────────────────────────────────────
function PortfolioBar({
  positions, stocks, total,
}: {
  positions: any[];
  stocks: any[];
  total: number;
}) {
  if (!positions.length || total === 0) return null;
  const colors = [C.cyan, C.purple, C.green, C.gold, C.orange, C.red, '#a78bfa', '#34d399', '#fb923c', '#f472b6'];
  const items = positions.map((pos, i) => {
    const stock = stocks.find(s => s.ticker === pos.ticker);
    const val   = pos.shares * (stock?.price ?? 0);
    return { ticker: pos.ticker, val, color: colors[i % colors.length], pct: (val / total) * 100 };
  }).sort((a, b) => b.val - a.val);

  return (
    <div>
      <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', gap: 1, marginBottom: 8 }}>
        {items.map(i => (
          <div key={i.ticker} title={`${i.ticker}: ${i.pct.toFixed(1)}%`}
            style={{ flex: i.val, background: i.color, minWidth: 3 }} />
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px' }}>
        {items.map(i => (
          <div key={i.ticker} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: i.color }} />
            <span style={{ fontSize: 9, color: C.text3, fontFamily: C.mono }}>
              {i.ticker} {i.pct.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Market ticker tape ──────────────────────────────────────────────────────
function TickerTape({ stocks }: { stocks: any[] }) {
  return (
    <div style={{
      overflow: 'hidden', whiteSpace: 'nowrap',
      padding: '6px 0', marginBottom: 10, flexShrink: 0,
      borderTop: '1px solid rgba(255,255,255,0.05)',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      background: 'rgba(0,0,0,0.2)',
    }}>
      <motion.div
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        style={{ display: 'inline-flex', gap: 0 }}
      >
        {[...stocks, ...stocks].map((s, i) => {
          const chg = s.previousClose > 0 ? ((s.price - s.previousClose) / s.previousClose * 100) : 0;
          const up  = chg >= 0;
          return (
            <span key={`${s.ticker}-${i}`} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 20px',
              borderRight: '1px solid rgba(255,255,255,0.05)',
            }}>
              <span style={{ fontFamily: C.mono, fontWeight: 900, color: C.cyan, fontSize: 10 }}>{s.ticker}</span>
              <span style={{ fontFamily: C.mono, fontSize: 10, color: C.text1 }}>Đ{s.price.toFixed(2)}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: up ? C.green : C.red }}>
                {up ? '▲' : '▼'}{Math.abs(chg).toFixed(2)}%
              </span>
            </span>
          );
        })}
      </motion.div>
    </div>
  );
}

// ─── Market depth bar (visual bid/ask spread) ────────────────────────────────
function MarketDepth({ price, beta }: { price: number; beta: number }) {
  const spread   = price * 0.001 * (1 + Math.abs(beta - 1));
  const bid      = price - spread / 2;
  const ask      = price + spread / 2;
  const bidPct   = 55 + (Math.sin(price * beta) * 5 + 5);
  const askPct   = 100 - bidPct;
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: C.text3, marginBottom: 3 }}>
        <span style={{ color: C.green }}>BID Đ{bid.toFixed(2)}</span>
        <span style={{ color: C.text3 }}>SPREAD {(ask - bid).toFixed(3)}</span>
        <span style={{ color: C.red }}>ASK Đ{ask.toFixed(2)}</span>
      </div>
      <div style={{ display: 'flex', height: 4, borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ flex: bidPct, background: `linear-gradient(90deg, ${C.green}55, ${C.green}88)` }} />
        <div style={{ flex: askPct, background: `linear-gradient(90deg, ${C.red}88, ${C.red}55)` }} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// StockExchangeView — Main component
// ═══════════════════════════════════════════════════════════════════════════
export default function StockExchangeView() {
  const { stockMarket, credits, buyShares, sellShares, currentDay } = useGameStore();

  const [tab, setTab]                 = useState('market');
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [buyQtys, setBuyQtys]         = useState<Record<string, number>>({});
  const [sellQtys, setSellQtys]       = useState<Record<string, number>>({});
  const [sectorFilter, setSectorFilter] = useState('all');
  const [sortKey, setSortKey]         = useState<'price' | 'change' | 'div' | 'pe' | 'beta' | 'mktcap'>('change');
  const [sortDir, setSortDir]         = useState<'asc' | 'desc'>('desc');

  // ── Data ─────────────────────────────────────────────────────────────────
  const stocks    = stockMarket.getAllListings();
  const positions = stockMarket.getPositions();
  const portfolio = stockMarket.getPortfolioValue();
  const totalPnLpct = stockMarket.getPortfolioReturn(); // percentage
  const orders    = stockMarket.getOrderHistory();
  const indices   = stockMarket.getIndices();

  // ── Qty helpers ───────────────────────────────────────────────────────────
  const getBuyQty  = (ticker: string) => buyQtys[ticker]  ?? 1;
  const getSellQty = (ticker: string) => sellQtys[ticker] ?? 1;
  const setBuyQty  = (ticker: string, v: number) => setBuyQtys(prev => ({ ...prev, [ticker]: v }));
  const setSellQty = (ticker: string, v: number) => setSellQtys(prev => ({ ...prev, [ticker]: v }));

  // ── Sectors ───────────────────────────────────────────────────────────────
  const sectors = useMemo(() => ['all', ...new Set(stocks.map(s => s.sector).filter(Boolean))], [stocks]);

  // ── Sorted & filtered stocks ──────────────────────────────────────────────
  const filteredStocks = useMemo(() => {
    let list = sectorFilter === 'all' ? stocks : stocks.filter(s => s.sector === sectorFilter);
    return [...list].sort((a, b) => {
      const chgA = a.previousClose > 0 ? ((a.price - a.previousClose) / a.previousClose * 100) : 0;
      const chgB = b.previousClose > 0 ? ((b.price - b.previousClose) / b.previousClose * 100) : 0;
      let av: number, bv: number;
      switch (sortKey) {
        case 'price':  av = a.price; bv = b.price; break;
        case 'change': av = chgA; bv = chgB; break;
        case 'div':    av = a.dividendYield ?? 0; bv = b.dividendYield ?? 0; break;
        case 'pe':     av = a.peRatio ?? 999; bv = b.peRatio ?? 999; break;
        case 'beta':   av = Math.abs(a.beta ?? 1); bv = Math.abs(b.beta ?? 1); break;
        case 'mktcap': av = a.marketCap ?? 0; bv = b.marketCap ?? 0; break;
        default:       av = 0; bv = 0;
      }
      return sortDir === 'desc' ? bv - av : av - bv;
    });
  }, [stocks, sectorFilter, sortKey, sortDir, currentDay]);

  // ── Hot stocks: highest dividend + buy signal ─────────────────────────────
  const hotStocks = useMemo(() =>
    stocks
      .map(s => {
        const signal = stockMarket.getTechnicalSignal(s.ticker);
        const chg    = s.previousClose > 0 ? ((s.price - s.previousClose) / s.previousClose * 100) : 0;
        const score  = (s.dividendYield ?? 0) * 2
          + ((signal as string) === 'strong_buy' ? 5 : signal === 'buy' ? 3 : 0)
          + (chg > 0 ? chg * 0.5 : 0);
        return { ...s, signal, chg, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 4),
  [stocks, currentDay]);

  // ── Portfolio P&L breakdown ──────────────────────────────────────────────
  const positionsWithPnl = useMemo(() =>
    positions.map(pos => {
      const stock   = stocks.find(s => s.ticker === pos.ticker);
      const price   = stock?.price ?? 0;
      const value   = pos.shares * price;
      const cost    = pos.shares * pos.avgCost;
      const pnl     = value - cost;
      const pnlPct  = cost > 0 ? (pnl / cost * 100) : 0;
      const signal  = stockMarket.getTechnicalSignal(pos.ticker);
      return { ...pos, stock, price, value, cost, pnl, pnlPct, signal };
    }).sort((a, b) => b.value - a.value),
  [positions, stocks, currentDay]);

  const totalCost      = positionsWithPnl.reduce((s, p) => s + p.cost, 0);
  const totalPnL       = positionsWithPnl.reduce((s, p) => s + p.pnl, 0); // monetary P&L
  const winCount       = positionsWithPnl.filter(p => p.pnl > 0).length;
  const annualDivIncome = positions.reduce((sum, pos) => {
    const stock = stocks.find(s => s.ticker === pos.ticker);
    return sum + (pos.shares * (stock?.price ?? 0) * ((stock?.dividendYield ?? 0) / 100));
  }, 0);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* ── TERMINAL HEADER ─────────────────────────────────────────────── */}
      <div style={{ flexShrink: 0, marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, letterSpacing: -0.5 }}>
                <span style={{ color: C.cyan }}>BOLSA</span>{' '}
                <span style={{ color: C.purple }}>NVX</span>
              </h2>
              <div style={{
                padding: '2px 8px', borderRadius: 4, background: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.25)', fontSize: 9, fontWeight: 700, color: C.green,
                letterSpacing: 1,
              }}>● LIVE</div>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: C.text3, letterSpacing: 0.3 }}>
              DÍA {currentDay} · {stocks.length} VALORES · TERMINAL DE TRADING
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9, color: C.text3, marginBottom: 2 }}>CAPITAL LIBRE</div>
            <div style={{ fontFamily: C.mono, fontSize: 20, fontWeight: 900, color: C.gold }}>
              Đ{formatNumber(credits)}
            </div>
          </div>
        </div>
      </div>

      {/* ── MARKET INDICES ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexShrink: 0, flexWrap: 'wrap' }}>
        {indices.map((idx: any) => {
          const up = idx.change >= 0;
          return (
            <GlassCard key={idx.id} style={{ flex: 1, minWidth: 90, padding: '8px 12px' }}>
              <div style={{ fontSize: 9, color: C.text3, letterSpacing: 0.8, marginBottom: 2 }}>{idx.name}</div>
              <div style={{ fontFamily: C.mono, fontSize: 15, fontWeight: 900, color: C.text1 }}>
                {idx.value.toFixed(0)}
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: up ? C.green : C.red }}>
                {up ? '▲' : '▼'} {Math.abs(idx.change).toFixed(2)}%
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* ── TICKER TAPE ─────────────────────────────────────────────────── */}
      <TickerTape stocks={stocks} />

      {/* ── PORTFOLIO KPI ROW ────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 10, flexShrink: 0 }}>
        <StatCard
          label="Portfolio"
          value={`Đ${formatNumber(portfolio)}`}
          icon="💼" small color={C.cyan}
        />
        <StatCard
          label="P&L Total"
          value={`${totalPnL >= 0 ? '+' : ''}Đ${formatNumber(totalPnL)}`}
          icon={totalPnL >= 0 ? '📈' : '📉'} small
          color={pnlColor(totalPnL)}
          subValue={totalCost > 0 ? `${totalPnLpct >= 0 ? '+' : ''}${totalPnLpct.toFixed(2)}%` : undefined}
          trend={totalPnL > 0 ? 'up' : totalPnL < 0 ? 'down' : 'neutral'}
        />
        <StatCard
          label="Posiciones"
          value={positions.length}
          icon="📊" small color={C.purple}
        />
        <StatCard
          label="Dividendos/Año"
          value={`Đ${formatNumber(annualDivIncome)}`}
          icon="💸" small color={C.gold}
        />
        <StatCard
          label="Win Rate"
          value={positions.length > 0 ? `${Math.round((winCount / positions.length) * 100)}%` : '—'}
          icon="🎯" small
          color={winCount / Math.max(1, positions.length) >= 0.5 ? C.green : C.orange}
        />
      </div>

      {/* ── TABS ─────────────────────────────────────────────────────────── */}
      <TabBar
        tabs={[
          { id: 'market',    label: 'Mercado',  icon: '📈' },
          { id: 'hot',       label: 'Hot',      icon: '🔥' },
          { id: 'portfolio', label: 'Portfolio', icon: '💼' },
          { id: 'history',   label: 'Historial', icon: '📜' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {/* ── CONTENT AREA ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* ════════════════════════════════════════════════════
            TAB: MARKET
            ════════════════════════════════════════════════════ */}
        {tab === 'market' && (
          <div>
            {/* Sector filter */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
              {sectors.map(sec => (
                <button key={sec} onClick={() => setSectorFilter(sec)} style={{
                  padding: '4px 10px', borderRadius: 16, fontSize: 10, fontWeight: 700, cursor: 'pointer',
                  border: `1px solid ${sectorFilter === sec ? C.cyan + '44' : 'rgba(255,255,255,0.08)'}`,
                  background: sectorFilter === sec ? 'rgba(245,158,11,0.10)' : 'rgba(255,255,255,0.03)',
                  color: sectorFilter === sec ? C.cyan : C.text3, transition: 'all 0.1s',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  {SECTOR_ICON[sec] ?? '📦'} {sec === 'all' ? 'Todos' : sec}
                </button>
              ))}
            </div>

            {/* Sort bar */}
            <div style={{ display: 'flex', gap: 3, marginBottom: 10, overflowX: 'auto', paddingBottom: 2 }}>
              {([
                { k: 'change', l: 'Variación' },
                { k: 'price',  l: 'Precio' },
                { k: 'div',    l: 'Dividendo' },
                { k: 'pe',     l: 'P/E' },
                { k: 'beta',   l: 'Beta' },
                { k: 'mktcap', l: 'Mkt Cap' },
              ] as { k: typeof sortKey; l: string }[]).map(({ k, l }) => (
                <button key={k} onClick={() => toggleSort(k)} style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer',
                  border: `1px solid ${sortKey === k ? C.purple + '44' : 'rgba(255,255,255,0.07)'}`,
                  background: sortKey === k ? 'rgba(139,92,246,0.10)' : 'rgba(255,255,255,0.03)',
                  color: sortKey === k ? C.purple : C.text3, transition: 'all 0.1s',
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                  {l} {sortKey === k && (sortDir === 'desc' ? '▼' : '▲')}
                </button>
              ))}
            </div>

            {/* Stock cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredStocks.map(s => {
                const chg     = s.previousClose > 0 ? ((s.price - s.previousClose) / s.previousClose * 100) : 0;
                const isUp    = chg >= 0;
                const histPrices = (s.priceHistory ?? []).slice(-30).map((h: any) => h.price);
                const signal  = stockMarket.getTechnicalSignal(s.ticker);
                const sig     = signalStyle(signal);
                const pos     = positions.find(p => p.ticker === s.ticker);
                const posVal  = pos ? pos.shares * s.price : 0;
                const posPnl  = pos ? posVal - pos.shares * pos.avgCost : 0;
                const posPct  = pos && pos.avgCost > 0 ? (posPnl / (pos.shares * pos.avgCost)) * 100 : 0;
                const isOpen  = selectedTicker === s.ticker;
                const bQty    = getBuyQty(s.ticker);
                const sQty    = getSellQty(s.ticker);
                const buyCost = bQty * s.price * 1.001; // includes 0.1% broker fee

                return (
                  <GlassCard
                    key={s.ticker}
                    glowColor={isOpen ? C.cyan : (pos ? C.purple : undefined)}
                    style={{
                      padding: 14,
                      border: isOpen ? `1px solid ${C.cyan}33` : pos ? `1px solid ${C.purple}22` : undefined,
                    }}
                  >
                    {/* ─ Header row ─ */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Ticker + name */}
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2 }}>
                          <span style={{
                            fontFamily: C.mono, fontSize: 16, fontWeight: 900, color: C.cyan,
                            textShadow: `0 0 12px ${C.cyan}55`,
                          }}>{s.ticker}</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: C.text1 }}>{s.companyName}</span>
                          <span style={{ fontSize: 11 }}>{SECTOR_ICON[s.sector] ?? '📦'}</span>
                        </div>
                        {/* Sector + fundamentals */}
                        <div style={{ fontSize: 10, color: C.text3, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          <span style={{ textTransform: 'capitalize' }}>{s.sector}</span>
                          <span>P/E: <b style={{ color: C.text2 }}>{s.peRatio?.toFixed(1) ?? '—'}</b></span>
                          <span>β: <b style={{
                            color: Math.abs(s.beta ?? 1) > 1.5 ? C.orange : Math.abs(s.beta ?? 1) < 0.7 ? C.green : C.text2,
                          }}>{s.beta?.toFixed(2) ?? '—'}</b></span>
                          <span>Div: <b style={{ color: (s.dividendYield ?? 0) > 3 ? C.gold : C.text2 }}>
                            {s.dividendYield?.toFixed(2) ?? '—'}%
                          </b></span>
                          {s.marketCap && (
                            <span>Cap: <b style={{ color: C.text2 }}>Đ{formatNumber(s.marketCap)}</b></span>
                          )}
                        </div>
                        {/* Position summary */}
                        {pos && (
                          <div style={{
                            marginTop: 5, padding: '5px 8px', borderRadius: 5,
                            background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.18)',
                            display: 'flex', gap: 12, flexWrap: 'wrap',
                          }}>
                            <span style={{ fontSize: 10, color: C.purple, fontWeight: 700 }}>
                              {pos.shares} acciones
                            </span>
                            <span style={{ fontSize: 10, color: C.text3 }}>
                              Coste: <span style={{ fontFamily: C.mono, color: C.text2 }}>Đ{pos.avgCost.toFixed(2)}</span>
                            </span>
                            <span style={{ fontSize: 10, color: C.text3 }}>
                              Valor: <span style={{ fontFamily: C.mono, color: C.purple }}>Đ{formatNumber(posVal)}</span>
                            </span>
                            <span style={{ fontSize: 10, fontWeight: 800, color: pnlColor(posPnl) }}>
                              P&L: {posPnl >= 0 ? '+' : ''}Đ{formatNumber(posPnl)} ({posPct >= 0 ? '+' : ''}{posPct.toFixed(1)}%)
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Price + change */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontFamily: C.mono, fontSize: 22, fontWeight: 900, color: C.text1, lineHeight: 1 }}>
                          Đ{s.price.toFixed(2)}
                        </div>
                        <div style={{
                          fontSize: 13, fontWeight: 700,
                          color: isUp ? C.green : C.red,
                          marginTop: 2,
                        }}>
                          {isUp ? '▲' : '▼'} {Math.abs(chg).toFixed(2)}%
                        </div>
                        <div style={{ fontSize: 9, color: C.text3, marginTop: 1 }}>
                          prev: Đ{s.previousClose?.toFixed(2) ?? '—'}
                        </div>
                      </div>
                    </div>

                    {/* ─ Chart + signal row ─ */}
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8 }}>
                      {histPrices.length > 1 && (
                        <MiniChart data={histPrices} width={200} height={32} color="auto" />
                      )}
                      <div style={{ flex: 1, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Badge color={sig.color} size="xs">{sig.label}</Badge>
                        {(s.dividendYield ?? 0) > 0 && (
                          <Badge color={C.gold} size="xs">DIV {s.dividendYield?.toFixed(1)}%</Badge>
                        )}
                        {(s.beta ?? 1) > 1.5 && (
                          <Badge color={C.orange} size="xs">HIGH BETA</Badge>
                        )}
                        {(s.peRatio ?? 999) < 15 && (
                          <Badge color={C.green} size="xs">VALUE</Badge>
                        )}
                      </div>
                      <button
                        onClick={() => setSelectedTicker(isOpen ? null : s.ticker)}
                        style={{
                          padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer',
                          border: `1px solid ${isOpen ? C.cyan + '44' : 'rgba(255,255,255,0.08)'}`,
                          background: isOpen ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.03)',
                          color: isOpen ? C.cyan : C.text3, flexShrink: 0,
                        }}
                      >
                        {isOpen ? 'CERRAR ▲' : 'TRADE ▼'}
                      </button>
                    </div>

                    {/* ─ Market depth ─ */}
                    <MarketDepth price={s.price} beta={s.beta ?? 1} />

                    {/* ─ Trading panel (expanded) ─ */}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div style={{
                            marginTop: 12, padding: 14, borderRadius: 10,
                            background: 'rgba(245,158,11,0.03)', border: '1px solid rgba(245,158,11,0.12)',
                          }}>
                            <div style={{ display: 'grid', gridTemplateColumns: pos ? '1fr 1fr' : '1fr', gap: 16 }}>
                              {/* BUY SIDE */}
                              <div style={{
                                padding: 12, borderRadius: 8,
                                background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.15)',
                              }}>
                                <div style={{ fontSize: 11, fontWeight: 800, color: C.green, marginBottom: 10, letterSpacing: 0.5 }}>
                                  ▲ COMPRAR {s.ticker}
                                </div>
                                <TradeInput
                                  label="CANTIDAD DE ACCIONES"
                                  value={bQty}
                                  onChange={v => setBuyQty(s.ticker, v)}
                                  color={C.green}
                                />
                                <div style={{ marginTop: 10 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                                    <span style={{ color: C.text3 }}>Precio unitario</span>
                                    <span style={{ fontFamily: C.mono, color: C.text2 }}>Đ{s.price.toFixed(2)}</span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 8, fontWeight: 800 }}>
                                    <span style={{ color: C.text2 }}>Total</span>
                                    <span style={{
                                      fontFamily: C.mono,
                                      color: credits >= buyCost ? C.green : C.red,
                                    }}>Đ{formatNumber(buyCost)}</span>
                                  </div>
                                  {credits < buyCost && (
                                    <div style={{ fontSize: 10, color: C.red, marginBottom: 6 }}>
                                      Insuficiente — faltan Đ{formatNumber(buyCost - credits)}
                                    </div>
                                  )}
                                  <ActionButton
                                    variant="success" fullWidth
                                    disabled={credits < buyCost}
                                    onClick={() => buyShares(s.ticker, bQty)}
                                  >
                                    COMPRAR {bQty} {bQty === 1 ? 'ACCIÓN' : 'ACCIONES'}
                                  </ActionButton>
                                </div>
                              </div>

                              {/* SELL SIDE */}
                              {pos && pos.shares > 0 && (
                                <div style={{
                                  padding: 12, borderRadius: 8,
                                  background: 'rgba(244,63,94,0.04)', border: '1px solid rgba(244,63,94,0.15)',
                                }}>
                                  <div style={{ fontSize: 11, fontWeight: 800, color: C.red, marginBottom: 10, letterSpacing: 0.5 }}>
                                    ▼ VENDER {s.ticker}
                                  </div>
                                  <TradeInput
                                    label={`CANTIDAD (TIENES ${pos.shares})`}
                                    value={getSellQty(s.ticker)}
                                    onChange={v => setSellQty(s.ticker, v)}
                                    max={pos.shares}
                                    color={C.red}
                                  />
                                  <div style={{ marginTop: 10 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                                      <span style={{ color: C.text3 }}>Precio unitario</span>
                                      <span style={{ fontFamily: C.mono, color: C.text2 }}>Đ{s.price.toFixed(2)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3, fontWeight: 800 }}>
                                      <span style={{ color: C.text2 }}>Ingreso</span>
                                      <span style={{ fontFamily: C.mono, color: C.green }}>
                                        +Đ{formatNumber(getSellQty(s.ticker) * s.price)}
                                      </span>
                                    </div>
                                    {(() => {
                                      const sQtyVal = getSellQty(s.ticker);
                                      const sellPnl = sQtyVal * (s.price - pos.avgCost);
                                      return (
                                        <div style={{
                                          display: 'flex', justifyContent: 'space-between',
                                          fontSize: 11, marginBottom: 8,
                                        }}>
                                          <span style={{ color: C.text3 }}>P&L parcial</span>
                                          <span style={{ fontFamily: C.mono, fontWeight: 700, color: pnlColor(sellPnl) }}>
                                            {sellPnl >= 0 ? '+' : ''}Đ{formatNumber(sellPnl)}
                                          </span>
                                        </div>
                                      );
                                    })()}
                                    <ActionButton
                                      variant="danger" fullWidth
                                      disabled={getSellQty(s.ticker) > pos.shares}
                                      onClick={() => sellShares(s.ticker, getSellQty(s.ticker))}
                                    >
                                      VENDER {getSellQty(s.ticker)} {getSellQty(s.ticker) === 1 ? 'ACCIÓN' : 'ACCIONES'}
                                    </ActionButton>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Fundamentals detail */}
                            <Divider />
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 8 }}>
                              {[
                                { l: 'P/E RATIO',    v: s.peRatio?.toFixed(1) ?? '—',                  c: (s.peRatio ?? 99) < 15 ? C.green : (s.peRatio ?? 99) > 30 ? C.red : C.text2 },
                                { l: 'BETA',         v: s.beta?.toFixed(2) ?? '—',                     c: Math.abs(s.beta ?? 1) > 1.5 ? C.orange : C.text2 },
                                { l: 'DIV YIELD',    v: `${s.dividendYield?.toFixed(2) ?? '—'}%`,      c: (s.dividendYield ?? 0) > 3 ? C.gold : C.text2 },
                                { l: 'MKT CAP',      v: s.marketCap ? `Đ${formatNumber(s.marketCap)}` : '—', c: C.text2 },
                              ].map(({ l, v, c }) => (
                                <div key={l} style={{
                                  textAlign: 'center', padding: '8px 4px', borderRadius: 6,
                                  background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)',
                                }}>
                                  <div style={{ fontSize: 9, color: C.text3, marginBottom: 3, letterSpacing: 0.5 }}>{l}</div>
                                  <div style={{ fontFamily: C.mono, fontSize: 14, fontWeight: 800, color: c }}>{v}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </GlassCard>
                );
              })}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════
            TAB: HOT STOCKS
            ════════════════════════════════════════════════════ */}
        {tab === 'hot' && (
          <div>
            <SectionHeader
              title="MEJORES OPORTUNIDADES"
              badge={<Badge color={C.red} size="xs">🔥 HOT</Badge>}
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10, marginBottom: 20 }}>
              {hotStocks.map((s, i) => {
                const sig = signalStyle(s.signal);
                const pos = positions.find(p => p.ticker === s.ticker);
                const bQty = getBuyQty(s.ticker);
                return (
                  <GlassCard key={s.ticker} glowColor={i === 0 ? C.gold : C.cyan} style={{ padding: 14 }}>
                    {i === 0 && (
                      <div style={{
                        position: 'absolute', top: 8, right: 8,
                        padding: '2px 8px', borderRadius: 10,
                        background: 'rgba(255,214,10,0.15)', border: '1px solid rgba(255,214,10,0.3)',
                        fontSize: 9, fontWeight: 700, color: C.gold,
                      }}>★ TOP PICK</div>
                    )}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontFamily: C.mono, fontSize: 18, fontWeight: 900, color: C.cyan }}>
                        {s.ticker}
                      </span>
                      <span style={{ fontSize: 13, color: C.text1 }}>{s.companyName}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                      <Badge color={sig.color} size="xs">{sig.label}</Badge>
                      {(s.dividendYield ?? 0) > 0 && (
                        <Badge color={C.gold} size="xs">DIV {s.dividendYield?.toFixed(1)}%</Badge>
                      )}
                    </div>

                    {/* Price + chart */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 }}>
                      <div>
                        <div style={{ fontFamily: C.mono, fontSize: 20, fontWeight: 900, color: C.text1 }}>
                          Đ{s.price.toFixed(2)}
                        </div>
                        <div style={{ fontSize: 11, color: s.chg >= 0 ? C.green : C.red, fontWeight: 700 }}>
                          {s.chg >= 0 ? '▲' : '▼'} {Math.abs(s.chg).toFixed(2)}%
                        </div>
                      </div>
                      {(s.priceHistory ?? []).length > 1 && (
                        <MiniChart
                          data={(s.priceHistory ?? []).slice(-20).map((h: any) => h.price)}
                          width={120} height={36} color="auto"
                        />
                      )}
                    </div>

                    {/* Fundamentals mini grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 10 }}>
                      {[
                        { l: 'P/E',  v: s.peRatio?.toFixed(1) ?? '—' },
                        { l: 'BETA', v: s.beta?.toFixed(2) ?? '—' },
                        { l: 'DIV',  v: `${s.dividendYield?.toFixed(1) ?? '—'}%` },
                      ].map(({ l, v }) => (
                        <div key={l} style={{
                          textAlign: 'center', padding: '5px 4px', borderRadius: 5,
                          background: 'rgba(255,255,255,0.03)',
                        }}>
                          <div style={{ fontSize: 9, color: C.text3 }}>{l}</div>
                          <div style={{ fontSize: 12, fontWeight: 800, color: C.text1, fontFamily: C.mono }}>{v}</div>
                        </div>
                      ))}
                    </div>

                    {pos && (
                      <div style={{
                        fontSize: 10, color: C.purple, fontWeight: 700, marginBottom: 8,
                        padding: '4px 8px', background: 'rgba(139,92,246,0.08)', borderRadius: 5,
                      }}>
                        Tienes {pos.shares} acciones
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 6 }}>
                      <ActionButton
                        variant="primary" size="sm"
                        disabled={credits < s.price}
                        onClick={() => buyShares(s.ticker, 1)}
                        style={{ flex: 1, fontSize: 10 }}
                      >
                        +1
                      </ActionButton>
                      <ActionButton
                        variant="primary" size="sm"
                        disabled={credits < s.price * 5}
                        onClick={() => buyShares(s.ticker, 5)}
                        style={{ flex: 1, fontSize: 10 }}
                      >
                        +5
                      </ActionButton>
                      <ActionButton
                        variant="primary" size="sm"
                        disabled={credits < s.price * 10}
                        onClick={() => buyShares(s.ticker, 10)}
                        style={{ flex: 1, fontSize: 10 }}
                      >
                        +10
                      </ActionButton>
                      {pos && pos.shares > 0 && (
                        <ActionButton
                          variant="danger" size="sm"
                          onClick={() => sellShares(s.ticker, Math.min(10, pos.shares))}
                          style={{ flex: 1, fontSize: 10 }}
                        >
                          SELL
                        </ActionButton>
                      )}
                    </div>
                  </GlassCard>
                );
              })}
            </div>

            {/* All other stocks in compact table */}
            <SectionHeader title="TODOS LOS VALORES" />
            <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
              {/* Table header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '70px 1fr 90px 80px 60px 60px 70px',
                gap: 0, padding: '8px 14px',
                background: 'rgba(255,255,255,0.03)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                fontSize: 9, fontWeight: 700, color: C.text3, letterSpacing: 0.8,
              }}>
                <span>TICKER</span>
                <span>EMPRESA</span>
                <span style={{ textAlign: 'right' }}>PRECIO</span>
                <span style={{ textAlign: 'right' }}>CAMBIO</span>
                <span style={{ textAlign: 'right' }}>DIV%</span>
                <span style={{ textAlign: 'right' }}>P/E</span>
                <span style={{ textAlign: 'right' }}>ACCIÓN</span>
              </div>
              {stocks.map((s, i) => {
                const chg = s.previousClose > 0 ? ((s.price - s.previousClose) / s.previousClose * 100) : 0;
                const pos = positions.find(p => p.ticker === s.ticker);
                return (
                  <div key={s.ticker} style={{
                    display: 'grid',
                    gridTemplateColumns: '70px 1fr 90px 80px 60px 60px 70px',
                    gap: 0, padding: '9px 14px',
                    borderBottom: i < stocks.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    alignItems: 'center',
                    background: pos ? 'rgba(139,92,246,0.04)' : 'transparent',
                  }}>
                    <span style={{ fontFamily: C.mono, fontWeight: 900, color: C.cyan, fontSize: 11 }}>
                      {s.ticker}
                    </span>
                    <span style={{ fontSize: 11, color: C.text2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.companyName}
                    </span>
                    <span style={{ fontFamily: C.mono, fontSize: 11, fontWeight: 700, textAlign: 'right', color: C.text1 }}>
                      Đ{s.price.toFixed(2)}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, textAlign: 'right', color: chg >= 0 ? C.green : C.red }}>
                      {chg >= 0 ? '+' : ''}{chg.toFixed(2)}%
                    </span>
                    <span style={{ fontSize: 11, textAlign: 'right', color: (s.dividendYield ?? 0) > 3 ? C.gold : C.text3 }}>
                      {s.dividendYield?.toFixed(1) ?? '—'}%
                    </span>
                    <span style={{ fontSize: 11, textAlign: 'right', color: C.text3 }}>
                      {s.peRatio?.toFixed(0) ?? '—'}
                    </span>
                    <div style={{ display: 'flex', gap: 3, justifyContent: 'flex-end' }}>
                      <ActionButton size="sm" variant="primary" disabled={credits < s.price}
                        onClick={() => buyShares(s.ticker, 1)} style={{ fontSize: 9, padding: '3px 8px' }}>
                        +1
                      </ActionButton>
                      {pos && (
                        <ActionButton size="sm" variant="danger"
                          onClick={() => sellShares(s.ticker, 1)} style={{ fontSize: 9, padding: '3px 8px' }}>
                          −1
                        </ActionButton>
                      )}
                    </div>
                  </div>
                );
              })}
            </GlassCard>
          </div>
        )}

        {/* ════════════════════════════════════════════════════
            TAB: PORTFOLIO
            ════════════════════════════════════════════════════ */}
        {tab === 'portfolio' && (
          <div>
            {positions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: C.text3 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Sin posiciones abiertas</div>
                <div style={{ fontSize: 12 }}>Ve al tab Mercado para comprar tus primeras acciones</div>
              </div>
            ) : (
              <>
                {/* Portfolio allocation */}
                <GlassCard style={{ padding: 14, marginBottom: 12 }}>
                  <SectionHeader title="DISTRIBUCIÓN DEL PORTFOLIO" />
                  <PortfolioBar positions={positions} stocks={stocks} total={portfolio} />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12 }}>
                    <div style={{ textAlign: 'center', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: 6 }}>
                      <div style={{ fontSize: 9, color: C.text3, marginBottom: 3 }}>VALOR TOTAL</div>
                      <div style={{ fontFamily: C.mono, fontSize: 16, fontWeight: 900, color: C.cyan }}>
                        Đ{formatNumber(portfolio)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: 6 }}>
                      <div style={{ fontSize: 9, color: C.text3, marginBottom: 3 }}>P&L TOTAL</div>
                      <div style={{
                        fontFamily: C.mono, fontSize: 16, fontWeight: 900,
                        color: pnlColor(totalPnL),
                      }}>
                        {totalPnL >= 0 ? '+' : ''}Đ{formatNumber(totalPnL)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: 6 }}>
                      <div style={{ fontSize: 9, color: C.text3, marginBottom: 3 }}>RETORNO</div>
                      <div style={{
                        fontFamily: C.mono, fontSize: 16, fontWeight: 900,
                        color: pnlColor(totalPnL),
                      }}>
                        {totalCost > 0 ? `${totalPnL >= 0 ? '+' : ''}${((totalPnL / totalCost) * 100).toFixed(1)}%` : '—'}
                      </div>
                    </div>
                  </div>

                  {/* Progress bar: profit/loss */}
                  <div style={{ marginTop: 12 }}>
                    <ProgressBar
                      value={winCount}
                      max={positions.length}
                      color={C.green}
                      height={5}
                      label={`WIN RATE: ${winCount}/${positions.length} posiciones en positivo`}
                    />
                  </div>
                </GlassCard>

                {/* Dividend income bar */}
                {annualDivIncome > 0 && (
                  <GlassCard style={{ padding: 12, marginBottom: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ fontSize: 24 }}>💸</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, color: C.text3, marginBottom: 2 }}>INGRESO POR DIVIDENDOS (ANUAL ESTIMADO)</div>
                      <div style={{ fontFamily: C.mono, fontSize: 18, fontWeight: 900, color: C.gold }}>
                        Đ{formatNumber(annualDivIncome)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 10, color: C.text3, marginBottom: 2 }}>YIELD MEDIO</div>
                      <div style={{ fontFamily: C.mono, fontSize: 15, fontWeight: 700, color: C.gold }}>
                        {portfolio > 0 ? ((annualDivIncome / portfolio) * 100).toFixed(2) : '—'}%
                      </div>
                    </div>
                  </GlassCard>
                )}

                {/* Position cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {positionsWithPnl.map(pos => {
                    const sQtyVal = getSellQty(pos.ticker);
                    const sig     = signalStyle(pos.signal);
                    const alloc   = portfolio > 0 ? (pos.value / portfolio) * 100 : 0;

                    return (
                      <GlassCard
                        key={pos.ticker}
                        glowColor={pos.pnl > 0 ? C.green : pos.pnl < 0 ? C.red : undefined}
                        style={{ padding: 14 }}
                      >
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                          <div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 3 }}>
                              <span style={{ fontFamily: C.mono, fontSize: 18, fontWeight: 900, color: C.cyan }}>
                                {pos.ticker}
                              </span>
                              <span style={{ fontSize: 13, color: C.text1 }}>{pos.stock?.companyName}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              <Badge color={sig.color} size="xs">{sig.label}</Badge>
                              {(pos.stock?.dividendYield ?? 0) > 0 && (
                                <Badge color={C.gold} size="xs">
                                  DIV {pos.stock?.dividendYield?.toFixed(1)}%
                                </Badge>
                              )}
                              <span style={{ fontSize: 10, color: C.text3 }}>
                                Alloc: <b style={{ color: C.text2 }}>{alloc.toFixed(1)}%</b>
                              </span>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontFamily: C.mono, fontSize: 18, fontWeight: 900, color: C.text1 }}>
                              Đ{formatNumber(pos.value)}
                            </div>
                            <div style={{
                              fontSize: 14, fontWeight: 800,
                              color: pnlColor(pos.pnl),
                            }}>
                              {pos.pnl >= 0 ? '+' : ''}Đ{formatNumber(pos.pnl)}
                            </div>
                            <div style={{ fontSize: 11, color: pnlColor(pos.pnl), fontWeight: 700 }}>
                              {pos.pnlPct >= 0 ? '+' : ''}{pos.pnlPct.toFixed(2)}%
                            </div>
                          </div>
                        </div>

                        {/* Stats grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 10 }}>
                          {[
                            { l: 'ACCIONES',    v: pos.shares.toString() },
                            { l: 'PRECIO',      v: `Đ${pos.price.toFixed(2)}` },
                            { l: 'COSTE MEDIO', v: `Đ${pos.avgCost.toFixed(2)}` },
                            { l: 'COSTE TOTAL', v: `Đ${formatNumber(pos.cost)}` },
                          ].map(({ l, v }) => (
                            <div key={l} style={{
                              textAlign: 'center', padding: '6px 4px', borderRadius: 5,
                              background: 'rgba(255,255,255,0.025)',
                            }}>
                              <div style={{ fontSize: 8, color: C.text3, marginBottom: 2, letterSpacing: 0.4 }}>{l}</div>
                              <div style={{ fontFamily: C.mono, fontSize: 11, fontWeight: 700, color: C.text1 }}>{v}</div>
                            </div>
                          ))}
                        </div>

                        {/* Allocation bar */}
                        <ProgressBar value={alloc} max={100} color={C.cyan} height={4} showPct={false} />
                        <div style={{ fontSize: 9, color: C.text3, marginBottom: 10, marginTop: 2, textAlign: 'right' }}>
                          {alloc.toFixed(1)}% del portfolio
                        </div>

                        {/* Sell panel */}
                        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                          <div style={{ flex: 1 }}>
                            <TradeInput
                              label={`VENDER (${pos.shares} disponibles)`}
                              value={sQtyVal}
                              onChange={v => setSellQty(pos.ticker, v)}
                              max={pos.shares}
                              color={C.red}
                              presets={[1, 5, 10]}
                            />
                          </div>
                          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 130 }}>
                            <div style={{ fontSize: 10, color: C.text3, textAlign: 'right' }}>
                              Ingreso: <span style={{ fontFamily: C.mono, color: C.green, fontWeight: 700 }}>
                                +Đ{formatNumber(sQtyVal * pos.price)}
                              </span>
                            </div>
                            <ActionButton
                              variant="danger"
                              disabled={sQtyVal > pos.shares}
                              onClick={() => sellShares(pos.ticker, sQtyVal)}
                            >
                              VENDER {sQtyVal}
                            </ActionButton>
                            <ActionButton
                              variant="ghost" size="sm"
                              onClick={() => sellShares(pos.ticker, pos.shares)}
                            >
                              CERRAR POSICIÓN
                            </ActionButton>
                          </div>
                        </div>
                      </GlassCard>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════
            TAB: HISTORIAL
            ════════════════════════════════════════════════════ */}
        {tab === 'history' && (
          <div>
            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: C.text3 }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📜</div>
                Sin operaciones registradas
              </div>
            ) : (
              <>
                {/* Summary stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
                  {[
                    {
                      l: 'TOTAL OPS',
                      v: orders.length.toString(),
                      c: C.cyan,
                    },
                    {
                      l: 'COMPRAS',
                      v: orders.filter((o: any) => o.type === 'buy').length.toString(),
                      c: C.green,
                    },
                    {
                      l: 'VENTAS',
                      v: orders.filter((o: any) => o.type === 'sell').length.toString(),
                      c: C.red,
                    },
                    {
                      l: 'VOLUMEN TOTAL',
                      v: `Đ${formatNumber(orders.reduce((s: number, o: any) => s + (o.total ?? 0), 0))}`,
                      c: C.gold,
                    },
                  ].map(({ l, v, c }) => (
                    <div key={l} style={{
                      padding: '10px 12px', borderRadius: 8,
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                      textAlign: 'center',
                    }}>
                      <div style={{ fontSize: 9, color: C.text3, marginBottom: 4, letterSpacing: 0.5 }}>{l}</div>
                      <div style={{ fontFamily: C.mono, fontSize: 16, fontWeight: 900, color: c }}>{v}</div>
                    </div>
                  ))}
                </div>

                {/* Order list */}
                <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
                  {/* Table header */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '50px 70px 1fr 60px 90px 90px',
                    padding: '8px 14px',
                    background: 'rgba(255,255,255,0.03)',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    fontSize: 9, fontWeight: 700, color: C.text3, letterSpacing: 0.8,
                    gap: 0,
                  }}>
                    <span>TIPO</span>
                    <span>TICKER</span>
                    <span>EMPRESA</span>
                    <span style={{ textAlign: 'right' }}>CANT.</span>
                    <span style={{ textAlign: 'right' }}>PRECIO</span>
                    <span style={{ textAlign: 'right' }}>TOTAL</span>
                  </div>
                  {[...orders].reverse().slice(0, 50).map((o: any, i: number) => {
                    const stock = stocks.find(s => s.ticker === o.ticker);
                    const isBuy = o.type === 'buy';
                    return (
                      <motion.div
                        key={o.id ?? i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.015, duration: 0.15 }}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '50px 70px 1fr 60px 90px 90px',
                          padding: '9px 14px',
                          borderBottom: i < orders.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                          alignItems: 'center', gap: 0,
                          background: isBuy ? 'rgba(16,185,129,0.02)' : 'rgba(244,63,94,0.02)',
                        }}
                      >
                        <span>
                          <Badge color={isBuy ? C.green : C.red} size="xs">
                            {isBuy ? 'BUY' : 'SELL'}
                          </Badge>
                        </span>
                        <span style={{ fontFamily: C.mono, fontWeight: 900, fontSize: 11, color: C.cyan }}>
                          {o.ticker}
                        </span>
                        <span style={{ fontSize: 10, color: C.text3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {stock?.companyName ?? '—'}
                        </span>
                        <span style={{ fontFamily: C.mono, fontSize: 11, textAlign: 'right', color: C.text2 }}>
                          {o.shares}
                        </span>
                        <span style={{ fontFamily: C.mono, fontSize: 11, textAlign: 'right', color: C.text2 }}>
                          Đ{o.price?.toFixed(2) ?? '—'}
                        </span>
                        <span style={{
                          fontFamily: C.mono, fontSize: 11, fontWeight: 700, textAlign: 'right',
                          color: isBuy ? C.red : C.green,
                        }}>
                          {isBuy ? '−' : '+'}Đ{formatNumber(o.total ?? 0)}
                        </span>
                      </motion.div>
                    );
                  })}
                </GlassCard>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

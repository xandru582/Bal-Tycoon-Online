import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ══════════════════════════════════════════════════════════════════════════
   NEXUS UI Component Library v4 — Full Cyberpunk Glassmorphism
   ══════════════════════════════════════════════════════════════════════════ */

// ── Shared tokens (inline, so components are self-contained) ──────────────
const T = {
  cyan:          '#f59e0b',
  cyanDim:       '#d97706',
  cyanGlow:      'rgba(245,158,11,0.35)',
  cyanSubtle:    'rgba(245,158,11,0.08)',
  cyanBorder:    'rgba(245,158,11,0.25)',
  purple:        '#8b5cf6',
  purpleGlow:    'rgba(139,92,246,0.35)',
  purpleSubtle:  'rgba(139,92,246,0.08)',
  purpleBorder:  'rgba(139,92,246,0.25)',
  green:         '#10b981',
  greenGlow:     'rgba(16,185,129,0.35)',
  greenSubtle:   'rgba(16,185,129,0.08)',
  orange:        '#f97316',
  orangeGlow:    'rgba(249,115,22,0.35)',
  red:           '#f43f5e',
  redGlow:       'rgba(244,63,94,0.35)',
  gold:          '#fbbf24',
  text1:         '#eef2f8',
  text2:         '#94a3b8',
  text3:         '#475569',
  surface:       'rgba(10,14,24,0.84)',
  surfaceHigh:   'rgba(16,21,34,0.94)',
  border:        'rgba(255,255,255,0.07)',
  borderFaint:   'rgba(255,255,255,0.04)',
  mono:          "'JetBrains Mono', ui-monospace, monospace",
  sans:          "'Inter', -apple-system, system-ui, sans-serif",
};

// ── Tier colour maps for upgrades ─────────────────────────────────────────
export const TIER_COLORS: Record<number, { color: string; glow: string; border: string; label: string }> = {
  0: { color: T.text2,   glow: 'rgba(138,154,181,0.3)',  border: 'rgba(138,154,181,0.2)', label: 'BÁSICO'    },
  1: { color: T.cyan,    glow: T.cyanGlow,                border: T.cyanBorder,            label: 'AVANZADO'  },
  2: { color: T.purple,  glow: T.purpleGlow,              border: T.purpleBorder,          label: 'ELITE'     },
  3: { color: T.green,   glow: T.greenGlow,               border: 'rgba(16,185,129,0.22)', label: 'RARO'      },
  4: { color: T.orange,  glow: T.orangeGlow,              border: 'rgba(249,115,22,0.22)', label: 'ÉPICO'     },
  5: { color: T.gold,    glow: 'rgba(251,191,36,0.35)',   border: 'rgba(251,191,36,0.22)', label: 'LEGENDARIO'},
  6: { color: '#e879f9', glow: 'rgba(232,121,249,0.35)',  border: 'rgba(232,121,249,0.22)',label: 'MÍTICO'    },
  7: { color: T.red,     glow: T.redGlow,                 border: 'rgba(244,63,94,0.22)',  label: 'SUPREMO'   },
  8: { color: '#ffffff', glow: 'rgba(255,255,255,0.35)',  border: 'rgba(255,255,255,0.22)',label: 'TRASCENDENTE'},
  9: { color: T.cyan,    glow: T.cyanGlow,                border: T.cyanBorder,            label: 'ABSOLUTO'  },
};


// ════════════════════════════════════════════════════════════════════════════
// GlassCard — Primary container with glassmorphism
// ════════════════════════════════════════════════════════════════════════════
export function GlassCard({
  children, style, className, onClick, glowColor, noPadding, ...rest
}: React.HTMLAttributes<HTMLDivElement> & { glowColor?: string; noPadding?: boolean }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`glass-panel ${onClick ? 'interactive-card' : ''} ${className ?? ''}`}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: noPadding ? 0 : 20,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        ...(hovered && glowColor ? {
          borderColor: glowColor,
          boxShadow: `0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px ${glowColor}44, 0 0 30px ${glowColor}15`,
        } : {}),
        ...style,
      }}
      {...rest}
    >
      {/* Top highlight line */}
      <div style={{
        position: 'absolute',
        top: 0, left: '10%', right: '10%',
        height: 1,
        background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)`,
        pointerEvents: 'none',
      }} />
      {children}
    </div>
  );
}


// ════════════════════════════════════════════════════════════════════════════
// StatCard — KPI display with gradient value
// ════════════════════════════════════════════════════════════════════════════
export function StatCard({
  label, value, subValue, icon, color, small, trend,
}: {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: string;
  color?: string;
  small?: boolean;
  trend?: 'up' | 'down' | 'neutral';
}) {
  const accentColor = color ?? T.cyan;
  const iconSize = small ? 22 : 28;
  const iconBoxSize = small ? 38 : 48;
  const valueFontSize = small ? 17 : 22;

  const trendEl = trend && (
    <span style={{
      fontSize: 10, fontWeight: 700,
      color: trend === 'up' ? T.green : trend === 'down' ? T.red : T.text3,
      marginLeft: 4,
    }}>
      {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '─'}
    </span>
  );

  return (
    <div
      className="glass-panel"
      style={{
        padding: small ? 12 : 16,
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
      }}
    >
      {/* Subtle corner glow */}
      <div style={{
        position: 'absolute', bottom: -20, right: -20,
        width: 60, height: 60,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${accentColor}18 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {icon && (
        <div style={{
          width: iconBoxSize,
          height: iconBoxSize,
          borderRadius: small ? 8 : 10,
          background: `linear-gradient(135deg, ${accentColor}18, ${accentColor}08)`,
          border: `1px solid ${accentColor}33`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: iconSize,
          flexShrink: 0,
          boxShadow: `inset 0 0 12px ${accentColor}10`,
        }}>
          {icon}
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="label-caps" style={{ marginBottom: 2 }}>{label}</div>
        <div
          className="font-mono"
          style={{
            fontSize: valueFontSize,
            fontWeight: 800,
            color: accentColor,
            lineHeight: 1.1,
            textShadow: `0 0 16px ${accentColor}55`,
            display: 'flex',
            alignItems: 'baseline',
          }}
        >
          {value}
          {trendEl}
        </div>
        {subValue && (
          <div style={{ fontSize: 11, color: T.text3, marginTop: 2 }}>{subValue}</div>
        )}
      </div>
    </div>
  );
}


// ════════════════════════════════════════════════════════════════════════════
// ProgressBar — Glowing bar with shimmer
// ════════════════════════════════════════════════════════════════════════════
export function ProgressBar({
  value, max, color, height = 6, label, showPct = true,
}: {
  value: number;
  max: number;
  color?: string;
  height?: number;
  label?: string;
  showPct?: boolean;
}) {
  const pct = Math.min(100, (value / Math.max(1, max)) * 100);
  const fillColor = color ?? `linear-gradient(90deg, ${T.cyan}, ${T.purple})`;
  const glowColor = color ?? T.cyan;

  return (
    <div>
      {label && (
        <div style={{
          fontSize: 10,
          color: T.text3,
          marginBottom: 4,
          display: 'flex',
          justifyContent: 'space-between',
          fontWeight: 500,
          letterSpacing: 0.5,
        }}>
          <span>{label}</span>
          {showPct && <span className="font-mono">{pct.toFixed(1)}%</span>}
        </div>
      )}

      <div style={{
        height,
        background: 'rgba(255,255,255,0.05)',
        borderRadius: height / 2,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.06)',
        position: 'relative',
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          style={{
            height: '100%',
            background: fillColor,
            borderRadius: height / 2,
            boxShadow: pct > 5 ? `0 0 ${height * 2}px ${glowColor}88` : 'none',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Shimmer sweep */}
          {pct > 10 && (
            <div style={{
              position: 'absolute',
              top: 0, bottom: 0,
              width: '40%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
              animation: 'shimmer-bar 2.2s ease-in-out infinite',
            }} />
          )}
        </motion.div>
      </div>
    </div>
  );
}


// ════════════════════════════════════════════════════════════════════════════
// MiniChart — SVG Sparkline with area fill
// ════════════════════════════════════════════════════════════════════════════
export function MiniChart({
  data, width = 120, height = 40, color = T.cyan,
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  if (data.length < 2) return <div style={{ width, height }} />;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 3;

  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - pad - ((v - min) / range) * (height - pad * 2),
  }));

  const linePath = pts.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ');
  const areaPath = `${linePath} L${pts[pts.length - 1].x},${height} L${pts[0].x},${height} Z`;

  const isUp = data[data.length - 1] >= data[0];
  const c = color === 'auto' ? (isUp ? T.green : T.red) : color;
  const gradId = `sparkGrad_${Math.random().toString(36).slice(2, 7)}`;

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c} stopOpacity="0.3" />
          <stop offset="100%" stopColor={c} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" stroke={c} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      {/* Endpoint dot */}
      <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="2.5" fill={c} />
    </svg>
  );
}


// ════════════════════════════════════════════════════════════════════════════
// ActionButton — Gradient glow button
// ════════════════════════════════════════════════════════════════════════════
export function ActionButton({
  children, onClick, disabled, variant = 'primary', size = 'md',
  style: customStyle, fullWidth,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'danger' | 'ghost' | 'success' | 'purple' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
  fullWidth?: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  const variants = {
    primary: {
      bg: `linear-gradient(135deg, ${T.cyan}dd, ${T.cyanDim ?? '#00aacc'}dd)`,
      bgHover: `linear-gradient(135deg, ${T.cyan}, #00aacc)`,
      color: '#000',
      border: T.cyanBorder,
      glow: T.cyanGlow,
      shadow: `0 4px 20px ${T.cyanGlow}`,
    },
    danger: {
      bg: `linear-gradient(135deg, ${T.red}cc, #cc2244cc)`,
      bgHover: `linear-gradient(135deg, ${T.red}, #cc2244)`,
      color: '#fff',
      border: 'rgba(244,63,94,0.3)',
      glow: T.redGlow ?? T.red,
      shadow: `0 4px 20px rgba(244,63,94,0.3)`,
    },
    success: {
      bg: `linear-gradient(135deg, ${T.green}cc, #28cc0fcc)`,
      bgHover: `linear-gradient(135deg, ${T.green}, #28cc0f)`,
      color: '#000',
      border: 'rgba(16,185,129,0.3)',
      glow: T.greenGlow,
      shadow: `0 4px 20px ${T.greenGlow}`,
    },
    ghost: {
      bg: 'transparent',
      bgHover: T.cyanSubtle,
      color: T.text2,
      border: T.border,
      glow: 'transparent',
      shadow: 'none',
    },
    purple: {
      bg: `linear-gradient(135deg, ${T.purple}cc, #8a35cccc)`,
      bgHover: `linear-gradient(135deg, ${T.purple}, #8a35cc)`,
      color: '#fff',
      border: T.purpleBorder,
      glow: T.purpleGlow,
      shadow: `0 4px 20px ${T.purpleGlow}`,
    },
    gold: {
      bg: `linear-gradient(135deg, ${T.gold}cc, ${T.orange}cc)`,
      bgHover: `linear-gradient(135deg, ${T.gold}, ${T.orange})`,
      color: '#000',
      border: 'rgba(255,214,10,0.3)',
      glow: 'rgba(255,214,10,0.35)',
      shadow: `0 4px 20px rgba(255,214,10,0.3)`,
    },
  } as const;

  const v = variants[variant];
  const pad = size === 'sm' ? '5px 13px' : size === 'lg' ? '12px 28px' : '8px 20px';
  const fs  = size === 'sm' ? 11 : size === 'lg' ? 14 : 12;

  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.03, y: -1 }}
      whileTap={disabled  ? {} : { scale: 0.96 }}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: pad,
        borderRadius: 8,
        border: `1px solid ${disabled ? T.border : (hovered ? v.border : v.border)}`,
        background: disabled
          ? 'rgba(255,255,255,0.05)'
          : hovered ? v.bgHover : v.bg,
        color: disabled ? T.text3 : v.color,
        fontSize: fs,
        fontWeight: 700,
        fontFamily: T.sans,
        letterSpacing: 0.4,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s ease',
        boxShadow: disabled || !hovered ? 'none' : v.shadow,
        width: fullWidth ? '100%' : undefined,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        position: 'relative',
        overflow: 'hidden',
        ...customStyle,
      }}
    >
      {children}
    </motion.button>
  );
}


// ════════════════════════════════════════════════════════════════════════════
// TabBar — Pill-style tabs with gradient active state
// ════════════════════════════════════════════════════════════════════════════
export function TabBar({
  tabs, active, onChange,
}: {
  tabs: { id: string; label: string; icon?: string }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div style={{
      display: 'flex',
      gap: 4,
      background: 'rgba(255,255,255,0.03)',
      padding: 4,
      borderRadius: 10,
      marginBottom: 16,
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      {tabs.map(t => {
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            style={{
              flex: 1,
              padding: '7px 14px',
              borderRadius: 7,
              border: isActive ? '1px solid rgba(245,158,11,0.25)' : '1px solid transparent',
              background: isActive
                ? `linear-gradient(135deg, rgba(245,158,11,0.16), rgba(139,92,246,0.10))`
                : 'transparent',
              color: isActive ? T.cyan : T.text3,
              fontWeight: isActive ? 700 : 500,
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: T.sans,
              letterSpacing: 0.3,
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              boxShadow: isActive ? 'inset 0 0 16px rgba(245,158,11,0.08)' : 'none',
            }}
          >
            {t.icon && <span style={{ fontSize: 13 }}>{t.icon}</span>}
            {t.label}
          </button>
        );
      })}
    </div>
  );
}


// ════════════════════════════════════════════════════════════════════════════
// Badge — Glowing pill indicator
// ════════════════════════════════════════════════════════════════════════════
export function Badge({
  children, color = T.cyan, size = 'sm',
}: {
  children: React.ReactNode;
  color?: string;
  size?: 'xs' | 'sm' | 'md';
}) {
  const pad = size === 'xs' ? '1px 6px' : size === 'md' ? '4px 12px' : '2px 9px';
  const fs  = size === 'xs' ? 9 : size === 'md' ? 13 : 11;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: pad,
      borderRadius: 999,
      background: `${color}18`,
      color,
      fontSize: fs,
      fontWeight: 700,
      letterSpacing: 0.6,
      border: `1px solid ${color}33`,
      boxShadow: `0 0 10px ${color}22, inset 0 0 6px ${color}0a`,
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  );
}


// ════════════════════════════════════════════════════════════════════════════
// EventFeed — Scrollable event list with left accent bar
// ════════════════════════════════════════════════════════════════════════════
export function EventFeed({
  items, maxItems = 10,
}: {
  items: { id: string; icon: string; text: string; color?: string; subtext?: string }[];
  maxItems?: number;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, overflowY: 'auto', flex: 1 }}>
      <AnimatePresence initial={false}>
        {items.slice(0, maxItems).map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ delay: idx * 0.03, duration: 0.2 }}
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'flex-start',
              padding: '7px 10px',
              background: 'rgba(255,255,255,0.025)',
              borderRadius: 7,
              borderLeft: `2px solid ${item.color ?? T.cyan}`,
              boxShadow: `inset 0 0 12px ${item.color ?? T.cyan}08`,
            }}
          >
            <span style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, lineHeight: 1.35, color: T.text1 }}>{item.text}</div>
              {item.subtext && (
                <div style={{ fontSize: 10, color: T.text3, marginTop: 1 }}>{item.subtext}</div>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}


// ════════════════════════════════════════════════════════════════════════════
// Divider
// ════════════════════════════════════════════════════════════════════════════
export function Divider({ color }: { color?: string }) {
  return (
    <div style={{
      height: 1,
      background: color
        ? `linear-gradient(90deg, transparent, ${color}44, transparent)`
        : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
      margin: '10px 0',
    }} />
  );
}


// ════════════════════════════════════════════════════════════════════════════
// SectionHeader — Labelled section with optional badge
// ════════════════════════════════════════════════════════════════════════════
export function SectionHeader({
  title, badge, action,
}: {
  title: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 3,
          height: 14,
          borderRadius: 2,
          background: `linear-gradient(180deg, ${T.cyan}, ${T.purple})`,
          boxShadow: `0 0 8px ${T.cyanGlow}`,
        }} />
        <span className="label-caps" style={{ color: T.text2, fontSize: 11 }}>{title}</span>
        {badge}
      </div>
      {action}
    </div>
  );
}
